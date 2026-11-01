import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seedState} from '../dist/app/seed.js';
import {upgradeState} from '../dist/app/migrations.js';
import {validateState} from '../dist/app/schema.js';
import {mergeSceneCatalog} from '../dist/features/atlas/catalog.js';
import {sceneCatalog} from '../dist/features/atlas/data/catalog.generated.js';
import {assignRegion,moveCharacter,mapCharacters,mapTrail,regionMembers,removeRegion,positionCharacterAtLocation} from '../dist/features/atlas/domain.js';
import {safeImage,assetURL} from '../dist/shared/assets.js';
import {characterView} from '../dist/features/characters/view.js';
import * as spatial from '../dist/features/atlas/domain.js';

const capelaId='subregion-brennford-capela-de-pedra-negra';
const getScene=(c,id=capelaId)=>c.regions.find(r=>r.id===id);

test('as dez cenas mantêm os caminhos originais, locais corretos e a hierarquia',()=>{
 const c=seedState().campaigns[0],scenes=c.regions.filter(r=>r.kind==='subregion'&&r.worldMapId===getScene(c).worldMapId);
 assert.ok(scenes.length>=10);
 for(const r of scenes){const m=c.maps.find(m=>m.id===r.mapId);assert.match(m.image,/^assets\/Mapa\/Regiões\/Brennford-Subregioes\/Brennford - .+\.(webp|png|jpe?g)$/i);assert.ok(r.summary);}
 const scene=getScene(c);assert.deepEqual(mapTrail(c,scene.mapId).map(m=>m.id),['caldris',scene.worldMapId,scene.mapId]);
 assert.equal(c.characters.find(ch=>ch.id==='lyra').regionId,'region-brennford-velmoor');
});

test('mover para uma sub-região preserva ancestrais, transfere entre irmãos e filtra a região inteira',()=>{
 const s=seedState(),c=s.campaigns[0],ch=c.characters.find(ch=>ch.id==='lyra'),scene=getScene(c);
 const rootPosition=structuredClone(ch.positions.caldris);
 moveCharacter(c,ch.id,scene.worldMapId,{x:scene.x,y:scene.y});
 assert.equal(ch.regionId,scene.id);assert.deepEqual(ch.positions.caldris,rootPosition);
 assert.ok(mapCharacters(c,scene.worldMapId).some(ch=>ch.id==='lyra'));
 assert.ok(mapCharacters(c,scene.mapId).some(ch=>ch.id==='lyra'));
 assert.ok(regionMembers(c,'region-brennford-velmoor').some(ch=>ch.id==='lyra'));
 assert.match(characterView(c,'','region-brennford-velmoor',spatial),/data-open-character="lyra"/);
 const parentPosition=structuredClone(ch.positions[scene.worldMapId]);
 moveCharacter(c,ch.id,scene.mapId,{x:11,y:77});
 assert.deepEqual(ch.positions[scene.worldMapId],parentPosition);assert.deepEqual(ch.positions.caldris,rootPosition);
 const sibling=getScene(c,'subregion-brennford-filial-da-guilda');assignRegion(c,ch,sibling.id);
 assert.equal(ch.positions[scene.mapId],undefined);assert.ok(ch.positions[sibling.mapId]);
 const destination=c.regions.find(r=>r.id==='region-durnholm-montanhas');assignRegion(c,ch,destination.id);
 assert.equal(ch.positions[sibling.mapId],undefined);assert.equal(ch.positions[scene.worldMapId],undefined);validateState(s);
});

test('escolher o local ilustrado posiciona no mapa filho sem inventar ocupantes iniciais',()=>{
 const s=seedState(),c=s.campaigns[0],ch=c.characters.find(ch=>ch.id==='borin'),scene=getScene(c);
 assert.equal(regionMembers(c,scene.id).length,0);
 positionCharacterAtLocation(c,ch,scene.locationIds[0]);assert.equal(ch.regionId,scene.id);
 assert.ok(ch.positions[scene.mapId]);assert.ok(ch.positions[scene.worldMapId]);validateState(s);
});

test('excluir conexão com filhos preserva textos, fichas, mapas e a exclusão no próximo carregamento',()=>{
 const s=seedState(),c=s.campaigns[0],ch=c.characters.find(ch=>ch.id==='lyra'),scene=getScene(c);
 assignRegion(c,ch,scene.id);const chapters=structuredClone(c.chapters),maps=c.maps.length,characters=c.characters.length;
 removeRegion(c,'region-brennford-velmoor');validateState(s);
 assert.equal(ch.regionId,'');assert.equal(c.regions.some(r=>r.id===scene.id),false);
 assert.equal(c.maps.length,maps);assert.equal(c.characters.length,characters);assert.deepEqual(c.chapters,chapters);
 assert.equal(upgradeState(s).changed,false);
 const another=seedState();removeRegion(another.campaigns[0],capelaId);assert.equal(upgradeState(another).state.campaigns[0].regions.some(r=>r.id===capelaId),false);
});

test('versão 2 preserva dados pessoais, revisões e imagens enviadas; atualização é idempotente',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/campaign-v2.json',import.meta.url))),before=structuredClone(old);
 old.campaigns[0].characters[0].image='data:image/webp;base64,AAAA';before.campaigns[0].characters[0].image=old.campaigns[0].characters[0].image;
 const result=upgradeState(old),c=result.state.campaigns[0];assert.ok(result.changed);assert.equal(result.state.revision,12);assert.equal(result.state.schemaVersion,3);
 assert.deepEqual(c.chapters,old.campaigns[0].chapters);assert.deepEqual(c.history,old.campaigns[0].history);
 for(const ch of old.campaigns[0].characters){const current=c.characters.find(v=>v.id===ch.id);assert.equal(current.notes,ch.notes);assert.deepEqual(current.attributes,ch.attributes);assert.deepEqual(current.positions,ch.positions);assert.equal(current.regionId,ch.regionId);}
 assert.equal(c.characters[0].image,'data:image/webp;base64,AAAA');assert.deepEqual(old,before);assert.equal(upgradeState(result.state).changed,false);
});

test('um novo arquivo entra no schema 3 sem restaurar defaults nem sobrescrever edições',()=>{
 const s=seedState(),c=s.campaigns[0];getScene(c).summary='Resumo do mestre';c.characters[0].notes='Continuar daqui';
 const future={key:'thornwick-local-futuro',name:'Local Futuro',group:'Thornwick',parentRegionId:'region-thornwick-marca',image:'assets/Mapa/Regiões/Thornwick-Subregioes/Thornwick - Local Futuro.png'};
 const result=upgradeState(s,{entries:[...sceneCatalog.entries,future]});assert.ok(result.changed);
 assert.equal(getScene(result.state.campaigns[0]).summary,'Resumo do mestre');assert.equal(result.state.campaigns[0].characters[0].notes,'Continuar daqui');
 assert.ok(result.state.campaigns[0].regions.some(r=>r.assetKey===future.key));
 assert.equal(mergeSceneCatalog(c,{entries:[{...future,parentRegionId:'nao-cadastrada'}]}),false);
 assert.equal(s.campaigns[0].regions.some(r=>r.assetKey===future.key),false);
});

test('assets aceitam a hierarquia com acentos e rejeitam caminhos e esquemas perigosos',()=>{
 const path='assets/Mapa/Regiões/Brennford-Subregioes/Brennford - Capela de Pedra Negra.webp';
 assert.equal(safeImage(path),path);assert.match(assetURL(path),/Regi%C3%B5es/);assert.match(assetURL(path),/Capela%20de/);
 for(const path of ['assets/../secret.png','assets/Mapa/../../secret.png','assets/%2e%2e/a.png','assets//a.png','assets/./a.png','assets/a.png?x=1','assets/a.png#x','assets/a\\b.png','https://host/a.png','data:image/svg+xml;base64,AAAA'])assert.equal(safeImage(path),'');
});
