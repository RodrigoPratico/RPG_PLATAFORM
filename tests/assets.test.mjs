import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {validateAssetLayout} from '../scripts/asset-paths.mjs';
import {assetAliases,resolveAssetPath} from '../dist/shared/asset-paths.generated.js';
import {safeImage,assetURL} from '../dist/shared/assets.js';
import {seedState} from '../dist/app/seed.js';
import {upgradeState} from '../dist/app/migrations.js';

const root=new URL('../',import.meta.url).pathname;

test('imagens ficam agrupadas por tipo, sem cópias antigas na raiz',async()=>{
 assert.ok(await validateAssetLayout(resolve(root,'dist'))>0);
 for(const [old,target] of Object.entries(assetAliases)){
  assert.ok((await stat(resolve(root,'dist',target))).isFile());
  await assert.rejects(stat(resolve(root,'dist',old)),{code:'ENOENT'});
 }
});

test('URLs antigas resolvem para o mesmo destino no navegador, Linux e Vercel',async()=>{
 const aliases=JSON.parse(await readFile(resolve(root,'dist/assets/aliases.json'),'utf8'));
 const vercel=JSON.parse(await readFile(resolve(root,'vercel.json'),'utf8'));
 assert.deepEqual(aliases,assetAliases);
 for(const [old,target] of Object.entries(aliases)){
  assert.equal(resolveAssetPath(old),target);
  assert.ok(vercel.rewrites.some(rule=>rule.source==='/'+old&&decodeURIComponent(rule.destination)==='/'+target));
 }
 assert.equal(safeImage('assets/Borin.webp'),'assets/Cards/Borin.webp');
 assert.match(assetURL('assets/region-ashen.webp'),/Mapa\/Regi%C3%B5es\/Regi%C3%A3o%20Ponte%20de%20pedra/);
 assert.equal(resolveAssetPath('data:image/webp;base64,AAAA'),'data:image/webp;base64,AAAA');
});

test('salvamentos schema 3 com URLs antigas são corrigidos sem redefinir os dados',()=>{
 const old=seedState(),c=old.campaigns[0],ch=c.characters[0];old.revision=41;
 c.maps[0].image='assets/caldris-world.webp';ch.image='assets/MOnzai.webp';ch.portrait='assets/MOnzai-portrait.webp';ch.notes='Anotação pessoal';
 const before=structuredClone(old),result=upgradeState(old),next=result.state.campaigns[0];
 assert.equal(result.changed,true);assert.equal(result.state.revision,41);
 assert.equal(next.maps[0].image,'assets/Mapa/Mapa.webp');assert.equal(next.characters[0].image,'assets/Cards/MOnzai.webp');assert.equal(next.characters[0].portrait,'assets/Cards/Miniaturas/MOnzai.webp');
 assert.equal(next.characters[0].notes,ch.notes);assert.deepEqual(next.characters[0].positions,ch.positions);assert.deepEqual(next.chapters,c.chapters);assert.deepEqual(next.regions,c.regions);assert.deepEqual(old,before);
 assert.equal(upgradeState(result.state).changed,false);
});

test('build recusa imagem solta ou temporário para evitar regressão na organização',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'atlas-layout-'));
 try{
  const assets=resolve(directory,'assets');await mkdir(assets);
  const stray=resolve(assets,'Solta.png');await writeFile(stray,'x');await assert.rejects(validateAssetLayout(directory),/organização por tipo/);
  await rm(stray);await mkdir(resolve(assets,'Mapa'));const temp=resolve(assets,'Mapa/Em processo.webp.tmp');await writeFile(temp,'');
  await assert.rejects(validateAssetLayout(directory),/temporário/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('novo mapa de local mantém marcadores personalizados dos mapas ancestrais',async()=>{
 const old=JSON.parse(await readFile(new URL('./fixtures/campaign-v2.json',import.meta.url),'utf8'));
 const c=old.campaigns[0],ch=c.characters.find(ch=>ch.id==='lyra'),parent=c.regions.find(r=>r.id===ch.regionId);
 ch.locationId='region-brennford-velmoor-capela';ch.positions[parent.mapId]={x:21.25,y:83.75};
 const positions=structuredClone(ch.positions),next=upgradeState(old).state.campaigns[0].characters.find(ch=>ch.id==='lyra');
 assert.equal(next.regionId,'subregion-brennford-capela-de-pedra-negra');
 assert.deepEqual(next.positions[parent.mapId],positions[parent.mapId]);assert.deepEqual(next.positions.caldris,positions.caldris);
 assert.ok(next.positions['submap-brennford-capela-de-pedra-negra']);
});
