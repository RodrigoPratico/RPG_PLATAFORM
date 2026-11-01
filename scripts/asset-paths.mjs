/** Keep compatibility URLs without retaining duplicate images in assets/. */
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve,extname,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export async function syncAssetPaths(root) {
 const config=JSON.parse(await readFile(resolve(root,'assets.config.json'),'utf8'));
 const aliases=config.legacyAliases||{},valid=path=>typeof path==='string'&&path.startsWith('assets/')&&!/[\\%?#:]/.test(path)&&path.split('/').every(part=>part&&part!=='.'&&part!=='..'&&part===part.trim());
 for(const [source,target] of Object.entries(aliases)){
  if(!valid(source)||!valid(target)||source===target||aliases[target])throw new Error('Alias de asset inválido: '+source);
  if(!(await stat(resolve(root,'dist',target))).isFile())throw new Error('Destino de asset ausente: '+target);
 }
 const publicPath=resolve(root,'dist/assets/aliases.json'),modulePath=resolve(root,'dist/shared/asset-paths.generated.js');
 await mkdir(dirname(modulePath),{recursive:true});
 await writeFile(publicPath,JSON.stringify(aliases,null,2)+'\n');
 await writeFile(modulePath,'// Generated from assets.config.json by scripts/asset-paths.mjs.\nexport const assetAliases = Object.freeze('+JSON.stringify(aliases,null,2)+');\nexport const resolveAssetPath = path => typeof path === "string" && Object.hasOwn(assetAliases,path) ? assetAliases[path] : path;\n');
 const vercelPath=resolve(root,'vercel.json'),vercel=JSON.parse(await readFile(vercelPath,'utf8'));
 const sources=new Set(Object.keys(aliases).map(src=>'/'+src));
 vercel.rewrites=[...(vercel.rewrites||[]).filter(rule=>!sources.has(rule.source)),...Object.entries(aliases).map(([source,target])=>({source:'/'+source,destination:'/'+target.split('/').map(encodeURIComponent).join('/')}))];
 await writeFile(vercelPath,JSON.stringify(vercel,null,2)+'\n');
 return aliases;
}

export async function validateAssetLayout(dist) {
 const root=resolve(dist,'assets'),imageExtensions=new Set(['.png','.jpg','.jpeg','.webp','.svg','.gif','.avif']);let images=0;
 async function visit(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
   const path=resolve(directory,entry.name),name=relative(root,path).replaceAll('\\','/');
   if(entry.isSymbolicLink())throw new Error('Link simbólico em assets: '+name);
   if(entry.name.endsWith('.webp.tmp'))throw new Error('Arquivo temporário em assets: '+name);
   if(entry.isDirectory())await visit(path);
   else if(imageExtensions.has(extname(entry.name).toLowerCase())){
    if(!name.includes('/')||!['Cards','Mapa','Interface'].includes(name.split('/')[0]))throw new Error('Imagem fora da organização por tipo: '+name);
    images++;
   }
  }
 }
 await visit(root);return images;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),aliases=await syncAssetPaths(root);
 console.log(JSON.stringify({event:'asset_paths',aliases:Object.keys(aliases).length,images:await validateAssetLayout(resolve(root,'dist'))}));
}
