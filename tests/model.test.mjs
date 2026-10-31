import test from 'node:test';
import assert from 'node:assert/strict';
import {validateState,emptyCampaign,emptyCharacter,removeCharacter,positionAtLocation,safeImage,escapeHTML,uid} from '../dist/model.js';
import {seedState} from '../dist/seed.js';

test('campanha inicial preserva fatos, vínculos e incertezas',()=>{
 const s=validateState(seedState());const c=s.campaigns[0];
 assert.equal(c.characters.length,21);assert.equal(c.characters.filter(v=>v.image).length,9);
 assert.equal(c.chapters.filter(v=>v.status==='Concluído').length,4);
 assert.equal(c.chapters.at(-1).status,'Rascunho');assert.equal(c.tournament.matches.length,0);
 assert.deepEqual(c.characters.find(v=>v.id==='rorik').positions,{});
 assert.equal(c.characters.find(v=>v.id==='celine').locationId,'capital');
 assert.match(c.characters.find(v=>v.id==='celine').notes,/32/);
 assert.equal(c.characters.find(v=>v.id==='yuki').attributes.Força,null);
});
test('backup rejeita coordenadas inválidas e referências inexistentes',()=>{
 let s=seedState();s.campaigns[0].characters[0].positions.caldris.x=101;
 assert.throws(()=>validateState(s),/Coordenada/);
 s=seedState();s.campaigns[0].chapters[0].characterIds.push('nao-existe');
 assert.throws(()=>validateState(s),/Vínculo/);
 s=seedState();s.campaigns[0].characters[0].locationId='nao-existe';
 assert.throws(()=>validateState(s),/Localidade/);
});
test('backup rejeita IDs duplicados e propriedades perigosas',()=>{
 let s=seedState();s.campaigns[0].characters.push(s.campaigns[0].characters[0]);
 assert.throws(()=>validateState(s),/Identificadores/);
 for(const id of ['__proto__','constructor','a:b','../etc/passwd']){
  s=seedState();s.campaigns[0].maps[0].id=id;assert.throws(()=>validateState(s),/Identificadores/);
 }
});
test('backup rejeita atributos, imagens, versão e histórico inválidos',()=>{
 let s=seedState();s.campaigns[0].characters[0].attributes.Força=-1;assert.throws(()=>validateState(s),/Atributos/);
 s=seedState();s.campaigns[0].maps[0].image='https://tracker.example/map.svg';assert.throws(()=>validateState(s),/mapa/);
 s=seedState();s.schemaVersion=99;assert.throws(()=>validateState(s),/Versão/);
 s=seedState();s.campaigns[0].history={bad:'object'};assert.throws(()=>validateState(s),/Histórico/);
 s=seedState();s.revision=-1;assert.throws(()=>validateState(s),/Revisão/);
});
test('remoção de personagem elimina vínculos e confrontos sem afetar outra campanha',()=>{
 const s=seedState();const c=s.campaigns[0];const other=structuredClone(c);other.id='outro-mundo';s.campaigns.push(other);
 c.tournament.matches.push({id:'luta1',round:'Final',a:'momo',b:'lyra',winner:'',notes:''});
 removeCharacter(c,'momo');validateState(s);
 assert.equal(c.characters.some(v=>v.id==='momo'),false);
 assert.equal(c.chapters.some(ch=>ch.characterIds.includes('momo')),false);
 assert.equal(c.tournament.matches.length,0);assert.equal(other.characters.some(v=>v.id==='momo'),true);
});
test('locais usam coordenadas percentuais por mapa e preservam posições de outro mapa',()=>{
 const c=seedState().campaigns[0];const ch=c.characters.find(v=>v.id==='lyra');
 c.maps.push({id:'regional',name:'Mapa local',image:'assets/Mapa.webp'});
 ch.positions.regional={x:10,y:90};positionAtLocation(c,ch,'capital');
 assert.equal(ch.locationId,'capital');assert.deepEqual(ch.positions.regional,{x:10,y:90});
 assert.ok(ch.positions.caldris.x>=0&&ch.positions.caldris.x<=100);
});
test('campanhas vazias são independentes e válidas',()=>{
 const a=emptyCampaign('Campanha A'),b=emptyCampaign('Campanha B');a.characters.push(emptyCharacter());
 assert.equal(b.characters.length,0);assert.notEqual(a.id,b.id);
 validateState({schemaVersion:1,revision:0,campaigns:[b]});
});
test('texto e imagens não permitem HTML ou URLs executáveis',()=>{
 assert.equal(escapeHTML('<script>"&'), '&lt;script&gt;&quot;&amp;');
 for(const value of ['javascript:alert(1)','data:image/svg+xml;base64,AAAA','assets/../../secret.png','https://example.org/image.png'])assert.equal(safeImage(value),'');
 assert.equal(safeImage('data:image/webp;base64,AAAA'),'data:image/webp;base64,AAAA');
 assert.equal(new Set(Array.from({length:1000},uid)).size,1000);
});
