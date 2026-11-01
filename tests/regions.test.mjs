import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seedState} from '../dist/app/seed.js';
import {migrateState} from '../dist/app/migrations.js';
import {validateState} from '../dist/app/schema.js';
import {validPolygon,pointInPolygon} from '../dist/features/atlas/geometry.js';
import {regionAtPoint,regionForLocation,mapCharacters,assignRegion,moveCharacter,removeRegion,positionCharacterAtLocation} from '../dist/features/atlas/domain.js';

test('nove regiões abrem mapas distintos e todos os personagens conhecidos são distribuídos',()=>{
 const c=seedState().campaigns[0],roots=c.regions.filter(r=>r.worldMapId==='caldris');assert.equal(roots.length,9);assert.equal(new Set(c.regions.map(r=>r.mapId)).size,c.regions.length);
 for(const r of roots){assert.equal(validPolygon(r.polygon),true);assert.equal(regionAtPoint(c,'caldris',{x:r.x,y:r.y}).id,r.id);assert.ok(c.maps.find(m=>m.id===r.mapId));}
 assert.equal(c.characters.filter(ch=>ch.regionId).length,20);
 const yuki=c.characters.find(ch=>ch.id==='yuki');assert.equal(yuki.regionId,'region-durnholm-montanhas');
 const unknown=c.characters.find(ch=>ch.id==='rorik');assert.equal(unknown.regionId,'');assert.deepEqual(unknown.positions,{});
});
test('geometria aceita fronteiras e contornos côncavos, rejeita cruzamentos e números inválidos',()=>{
 const square=[[0,0],[10,0],[10,10],[0,10]];
 assert.ok(validPolygon(square));assert.ok(pointInPolygon([0,5],square));assert.ok(pointInPolygon([10,10],square));assert.equal(pointInPolygon([11,5],square),false);
 assert.equal(validPolygon([[0,0],[10,10],[0,10],[10,0]]),false);
 assert.equal(validPolygon([[0,0],[1,1],[2,2]]),false);assert.equal(validPolygon([[0,0],[NaN,1],[2,2]]),false);
 assert.equal(validPolygon([[0,0],[0,0],[1,1],[0,2]]),false);
});
test('salvamento versão 1 recebe atlas sem perder capítulos, notas, atributos ou mapas anteriores',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/campaign-v1.json',import.meta.url),'utf8'));
 const untouched=structuredClone(old);const updated=migrateState(old),c=updated.campaigns[0];
 assert.deepEqual(old,untouched);assert.equal(updated.revision,7);assert.equal(updated.schemaVersion,3);
 assert.deepEqual(c.chapters,old.campaigns[0].chapters);assert.equal(c.characters[0].notes,old.campaigns[0].characters[0].notes);
 assert.deepEqual(c.characters[0].attributes,old.campaigns[0].characters[0].attributes);
 assert.equal(c.maps.find(m=>m.id==='caldris').image,'assets/Mapa/Mapa.webp');
 const archive=c.maps.find(m=>m.archived);assert.equal(archive.image,'assets/Mapa/Arquivo/Mapa anterior.webp');assert.deepEqual(c.characters[0].positions[archive.id],old.campaigns[0].characters[0].positions.caldris);
 assert.deepEqual(migrateState(updated),updated);
});
test('outras campanhas são migradas sem receber personagens ou mapas de Caldris',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/campaign-v1.json',import.meta.url),'utf8'));
 old.campaigns[0].id='mundo-personalizado';const c=migrateState(old).campaigns[0];assert.deepEqual(c.regions,[]);assert.equal(c.maps.length,1);assert.equal(c.maps[0].image,'assets/Mapa/Arquivo/Mapa anterior.webp');
});
test('arrastar entre regiões transfere pertencimento e elimina marcadores regionais antigos',()=>{
 const state=seedState(),c=state.campaigns[0];const borin=c.characters.find(ch=>ch.id==='borin');const previous=c.regions.find(r=>r.id===borin.regionId);
 moveCharacter(c,borin.id,'caldris',{x:70,y:45});assert.equal(borin.regionId,'region-brennford-velmoor');assert.equal(borin.locationId,'brennford');assert.equal(borin.positions[previous.mapId],undefined);
 assert.equal(mapCharacters(c,previous.mapId).some(ch=>ch.id===borin.id),false);
 const current=c.regions.find(r=>r.id===borin.regionId);assert.ok(mapCharacters(c,current.mapId).some(ch=>ch.id===borin.id));
 moveCharacter(c,borin.id,current.mapId,{x:22.5,y:67});assert.deepEqual(borin.positions[current.mapId],{x:22.5,y:67});assert.deepEqual(borin.positions.caldris,{x:70,y:45});validateState(state);
 assert.throws(()=>moveCharacter(c,borin.id,'caldris',{x:2,y:50}),/dentro de uma região/);
});
test('escolher local regional vincula a região e preserva posições de mapas avulsos',()=>{
 const c=seedState().campaigns[0],ch=c.characters.find(v=>v.id==='lyra');c.maps.push({id:'mapa-avulso',name:'Taverna',image:'assets/Mapa.webp'});ch.positions['mapa-avulso']={x:11,y:12};
 const loc=c.locations.find(l=>l.id==='region-caldris-real-castelo');positionCharacterAtLocation(c,ch,loc.id);
 assert.equal(ch.regionId,'region-caldris-real');assert.equal(ch.locationId,loc.id);assert.deepEqual(ch.positions['mapa-avulso'],{x:11,y:12});
 assignRegion(c,ch,'');assert.equal(ch.regionId,'');assert.equal(ch.positions.caldris,undefined);assert.equal(ch.locationId,'');
});
test('backup rejeita mapas cíclicos, referências de região ausentes e contornos malformados',()=>{
 let state=seedState();state.campaigns[0].characters[0].regionId='ausente';assert.throws(()=>validateState(state),/Região/);
 state=seedState();state.campaigns[0].regions[0].polygon=[[0,0],[1,1],[2,2]];assert.throws(()=>validateState(state),/Contorno/);
 state=seedState();const c=state.campaigns[0];c.regions.push({...c.regions[0],id:'ciclo',mapId:'caldris',worldMapId:c.regions[0].mapId,locationIds:[]});assert.throws(()=>validateState(state),/Ciclo/);
});
test('excluir conexão regional não apaga capítulos ou fichas',()=>{
 const state=seedState(),c=state.campaigns[0];const count=c.characters.length,chapters=structuredClone(c.chapters);
 removeRegion(c,'region-durnholm-montanhas');validateState(state);assert.equal(c.characters.length,count);assert.deepEqual(c.chapters,chapters);assert.equal(c.characters.find(ch=>ch.id==='yuki').regionId,'');
});
