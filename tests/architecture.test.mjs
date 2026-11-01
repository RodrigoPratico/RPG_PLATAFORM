import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {collectModuleGraph} from '../scripts/module-graph.mjs';
import {discoverScenes} from '../scripts/asset-catalog.mjs';
import {assertImageBytes} from '../scripts/image-signature.mjs';
import {readFile} from 'node:fs/promises';
import {FeatureRegistry} from '../dist/app/feature-registry.js';
import {installFeatures,featureFactories} from '../dist/app/features.js';
import {createAtlasFeature} from '../dist/features/atlas/index.js';
import {createStore} from '../dist/app/store.js';
import {seedState} from '../dist/app/seed.js';
import {validateState} from '../dist/app/schema.js';

test('módulos resolvem localmente, sem ciclos; funcionalidades não importam a aplicação',async()=>{
 const graph=await collectModuleGraph(new URL('../dist',import.meta.url).pathname);
 assert.ok(graph.size>40);
 for(const [path,node] of graph){
  if(path.startsWith('features/'))assert.ok(node.dependencies.every(d=>!d.startsWith('app/')),'Dependência invertida em '+path);
  if(path.startsWith('shared/'))assert.ok(node.dependencies.every(d=>d.startsWith('shared/')),'Compartilhado depende de funcionalidade: '+path);
  if(path!=='app.js'&&path!=='app/bootstrap.js')await import(new URL('../dist/'+path,import.meta.url));
 }
 assert.deepEqual(graph.get('app.js').dependencies,['app/bootstrap.js']);
});

test('registro modular rejeita colisões sem instalação parcial e permite omitir módulos',async()=>{
 const registry=new FeatureRegistry();let hit=0;
 registry.register({id:'first',routes:[{id:'atlas'}],commands:{open:()=>hit++},actions:{save:()=>hit++},services:{enabled:true}});
 for(const feature of [{id:'first'},{id:'other',routes:[{id:'atlas'}]},{id:'other',routes:[{id:'same'},{id:'same'}]},{id:'other',actions:{save(){}}},{id:'other',commands:{open(){}}}])assert.throws(()=>registry.register(feature),/duplicad/);
 assert.equal(registry.has('other'),false);await registry.handle({open:'123'});await registry.handle({action:'save'});assert.equal(hit,2);
 const minimal=new FeatureRegistry();installFeatures(minimal,{},[()=>({id:'chapters',routes:[{id:'capitulos'}]})]);
 assert.equal(minimal.routes().length,1);assert.equal(minimal.service('atlas'),undefined);
});

test('store só publica a cópia validada depois de persistir e recusa gravações simultâneas',async()=>{
 let finish,fail=false,revision=0;
 const repository={save:async(next,expected)=>{assert.equal(expected,revision);if(fail)throw new Error('Quota excedida');await new Promise(resolve=>finish=resolve);return ++revision;}};
 const store=createStore({repository,validate:validateState});store.initialize(seedState());
 const original=structuredClone(store.state());fail=true;
 await assert.rejects(store.commit('falha',c=>c.name='Não deve salvar'),/Quota/);assert.deepEqual(store.state(),original);assert.equal(store.isSaving(),false);
 fail=false;const promise=store.commit('nome atualizado',c=>c.name='Novo nome');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(store.campaign().name,original.campaigns[0].name);
 await assert.rejects(store.commit('concorrente',()=>{}),/andamento/);finish();await promise;
 assert.equal(store.campaign().name,'Novo nome');assert.equal(store.state().revision,1);assert.equal(store.campaign().history.at(-1).description,'nome atualizado');
});

test('fichas continuam editáveis com atlas desabilitado, sem apagar localização ou marcadores',async()=>{
 const registry=new FeatureRegistry(),state=seedState(),campaign=()=>state.campaigns[0];let save,form;
 const ch=campaign().characters.find(ch=>ch.id==='lyra'),positions=structuredClone(ch.positions),region=ch.regionId;
 const ctx={ui:{},state:()=>state,campaign,service:id=>registry.service(id),formDialog:(_title,body,onSave)=>{form=body;save=onSave;},value:(data,key)=>String(data.get(key)||''),commit:async(_description,mutate)=>{mutate(campaign(),state);validateState(state);}};
 installFeatures(registry,ctx,featureFactories.filter(f=>f!==createAtlasFeature));
 registry.service('characters').editCharacter(ch.id);assert.doesNotMatch(form,/name="regionId"/);
 const data=new FormData();for(const key of ['name','role','age','rank','locationId','faction','loyalty','summary','relations','notes'])data.set(key,ch[key]);
 for(const [key,value] of Object.entries(ch.attributes))data.set('attr-'+key,value??'');data.set('notes','Edição sem atlas');
 await save(data);const updated=campaign().characters.find(ch=>ch.id==='lyra');
 assert.equal(updated.notes,'Edição sem atlas');assert.equal(updated.regionId,region);assert.deepEqual(updated.positions,positions);
 assert.equal(registry.route('mapa'),undefined);assert.ok(registry.route('capitulos'));
});

test('scanner reconhece pastas futuras, prefere WebP e mantém nomes exatos e IDs estáveis',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'atlas-assets-'));
 try{
  const folder=resolve(directory,'assets/Mapa/Regiões/Thornwick-Subregioes');await mkdir(folder,{recursive:true});
  const stem='Thornwick - Pátio Leste';await writeFile(resolve(folder,stem+'.png'),'original');await writeFile(resolve(folder,stem+'.webp'),'derivada');
  const config={parents:{thornwick:'region-thornwick-marca'},placements:{}};
  const catalog=await discoverScenes(directory,config);assert.equal(catalog.entries.length,1);assert.equal(catalog.entries[0].key,'thornwick-patio-leste');assert.equal(catalog.entries[0].parentRegionId,'region-thornwick-marca');
  assert.ok(catalog.entries[0].image.endsWith(stem+'.webp'));assert.ok(catalog.entries[0].source.endsWith(stem+'.png'));assert.equal(catalog.revision,(await discoverScenes(directory,config)).revision);
  assert.equal((await discoverScenes(directory,{parents:{},placements:{}})).warnings.length,1);
  await writeFile(resolve(folder,'Nome fora do padrão.png'),'x');await assert.rejects(discoverScenes(directory,config),/fora do padrão/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('build rejeita derivadas vazias ou truncadas em vez de publicar imagens quebradas',async()=>{
 const bytes=await readFile(new URL('../dist/assets/Mapa/Regiões/Thornwick-Subregioes/Thornwick - Guilda Central.webp',import.meta.url));
 assert.doesNotThrow(()=>assertImageBytes(bytes,'Guilda Central.webp'));
 assert.throws(()=>assertImageBytes(Buffer.alloc(0),'Vazio.webp'),/vazia/);
 assert.throws(()=>assertImageBytes(bytes.subarray(0,bytes.length-20),'Truncado.webp'),/truncada/);
});
