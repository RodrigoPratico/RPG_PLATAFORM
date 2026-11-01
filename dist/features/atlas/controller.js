import {clone,uid,escapeHTML as e} from '../../shared/primitives.js';
import {$,avatar,field,selectField,fileField} from '../../shared/ui.js';
import {readImage} from '../../shared/image-input.js';
import {mapRegion,mapCharacters,assignRegion,removeRegion} from './domain.js';
import {validPolygon,polygonAnchor} from './geometry.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
const locOptions=()=>[['','Local não informado'],...campaign().locations.map(l=>[l.id,l.name])];
const mapOptions=()=>campaign().maps.map(m=>[m.id,m.name]);
function navigateMap(id){
 if(!campaign().maps.some(m=>m.id===id))throw new Error('Mapa não encontrado.');
 ui.mapId=id;ui.zoom=1;ui.drawing=null;
 if(!mapCharacters(campaign(),id).some(ch=>ch.id===ui.selectedId))ui.selectedId=mapCharacters(campaign(),id)[0]?.id||'';
 const hash='mapa?map='+encodeURIComponent(id);if(location.hash==='#'+hash)render();else location.hash=hash;
}

function editRegion(id,drawnPolygon){
 if(!campaign().maps.length){toast('Adicione o mapa do mundo antes de criar uma região.');return;}
 const old=campaign().regions.find(r=>r.id===id);
 const row=clone(old||{id:uid(),name:'',summary:'',kind:mapRegion(campaign(),ui.mapId)?'subregion':'region',worldMapId:ui.mapId||campaign().maps[0].id,mapId:'',polygon:drawnPolygon||[[35,35],[65,35],[65,65],[35,65]],locationIds:[]});
 const links=campaign().locations.map(l=>`<label><input type="checkbox" name="locations" value="${e(l.id)}" ${row.locationIds.includes(l.id)?'checked':''}>${e(l.name)}</label>`).join('');
 formDialog(old?'Editar região':'Conectar nova região',`${field('Nome da região *','name',row.name,{required:true,max:140})}${field('Resumo ao apontar para a região *','summary',row.summary,{type:'textarea',rows:6,required:true})}<div class="form-two">${selectField('Mapa onde fica o contorno','worldMapId',row.worldMapId,mapOptions())}${selectField('Mapa que abre ao clicar','mapId',row.mapId,[['','Criar mapa com a imagem enviada'],...mapOptions().filter(([id])=>id!==row.worldMapId)])}</div>${fileField('Imagem do novo mapa regional (se necessário)','image')}<details class="region-advanced"><summary>Contorno e vínculos com localidades</summary>${field('Pontos X,Y em percentuais · um por linha','polygon',row.polygon.map(p=>p.join(', ')).join('\n'),{type:'textarea',rows:7,required:true,max:10000})}<p class="muted">Origem no canto superior esquerdo. Para desenhar visualmente, cancele e use “Delimitar região” no mapa.</p><fieldset class="character-checks"><legend>Localidades desta região</legend>${links}</fieldset></details>`,async data=>{
  const polygon=value(data,'polygon',10000,true).split(/\n+/).map(line=>line.trim().split(/\s*,\s*/).map(Number));
  if(!validPolygon(polygon))throw new Error('Contorno inválido. Use 3 a 80 pares X,Y, entre 0 e 100, sem cruzar as linhas.');
  const mapId=value(data,'mapId',100)||uid(),worldMapId=value(data,'worldMapId',100);
  const file=data.get('image');let image='';if(file?.size)image=await readImage(file);
  if(!value(data,'mapId',100)&&!image)throw new Error('Selecione um mapa existente ou envie uma imagem para o mapa regional.');
  if(value(data,'mapId',100)&&image)throw new Error('Para criar um mapa com a imagem, selecione “Criar mapa com a imagem enviada”.');
  const name=value(data,'name',140,true),anchor=old&&JSON.stringify(old.polygon)===JSON.stringify(polygon)?{x:old.x,y:old.y}:polygonAnchor(polygon);
  if(old&&old.mapId!==mapId&&campaign().regions.some(r=>r.worldMapId===old.mapId))throw new Error('Esta região possui sub-regiões. Substitua a imagem do mapa existente ou desconecte os locais antes de trocar o mapa de destino.');
  const updated={...row,...anchor,name,summary:value(data,'summary',200000,true),mapId,worldMapId,polygon,locationIds:data.getAll('locations')};
  await commit(`Região ${name} salva`,c=>{
   if(image)c.maps.push({id:mapId,name,image});
   if(old)c.regions[c.regions.findIndex(r=>r.id===old.id)]=updated;else c.regions.push(updated);
   for(const ch of c.characters)if(ch.regionId===row.id){if(old&&old.mapId!==mapId)delete ch.positions[old.mapId];assignRegion(c,ch,row.id);}
  });
 },{wide:true,onDelete:old?()=>commit(`Região ${row.name} removida`,c=>removeRegion(c,row.id)):null});
}

function editMap(id){
 const old=campaign().maps.find(m=>m.id===id);const map=old||{id:uid(),name:'',image:''};
 formDialog(old?'Editar mapa':'Adicionar mapa',`${field('Nome do mapa *','name',map.name,{required:true,max:140})}${fileField(old?'Substituir imagem (opcional)':'Imagem do mapa *','image')}<p class="muted">Coordenadas são percentuais. Ao substituir a imagem, revise as posições e localidades existentes.</p>`,async data=>{
 const file=data.get('image');const image=file?.size?await readImage(file):map.image;if(!image)throw new Error('Selecione uma imagem para o mapa.');
 await commit(`Mapa ${value(data,'name',140,true)} salvo`,c=>{const updated={...map,name:value(data,'name',140,true),image};if(old)c.maps[c.maps.findIndex(v=>v.id===id)]=updated;else c.maps.push(updated);});ui.mapId=map.id;if(ctx.route()==='mapa')navigateMap(map.id);
 },{onDelete:old?()=>commit(`Mapa ${map.name} excluído`,c=>{const ids=c.locations.filter(l=>l.mapId===id).map(l=>l.id);for(const r of [...c.regions])if(r.mapId===id||r.worldMapId===id)removeRegion(c,r.id);for(const r of c.regions)r.locationIds=r.locationIds.filter(loc=>!ids.includes(loc));for(const ch of c.characters){delete ch.positions[id];if(ids.includes(ch.locationId))ch.locationId='';}c.locations=c.locations.filter(l=>l.mapId!==id);c.maps=c.maps.filter(m=>m.id!==id);}):null});
}

function editLocation(id){
 if(!campaign().maps.length){toast('Adicione um mapa antes de criar localidades.');return;}
 const old=campaign().locations.find(l=>l.id===id);const l=old||{id:uid(),name:'',mapId:ui.mapId,x:50,y:50,description:''};
 formDialog(old?'Editar localidade':'Nova localidade',`${field('Nome *','name',l.name,{required:true,max:140})}${selectField('Mapa','mapId',l.mapId,mapOptions())}<div class="form-two">${field('X · 0 a 100%','x',l.x,{type:'number'})}${field('Y · 0 a 100%','y',l.y,{type:'number'})}</div>${field('Contexto da localidade','description',l.description,{type:'textarea',rows:6})}<p class="muted">Origem: canto superior esquerdo. Editar a localidade não move automaticamente personagens já posicionados.</p>`,async data=>{
  const updated={...l,name:value(data,'name',140,true),mapId:value(data,'mapId',100),x:Number(value(data,'x',20,true)),y:Number(value(data,'y',20,true)),description:value(data,'description')};
  await commit(`Localidade ${updated.name} salva`,c=>{if(old)c.locations[c.locations.findIndex(v=>v.id===id)]=updated;else c.locations.push(updated);for(const r of c.regions)if(r.worldMapId!==updated.mapId&&r.mapId!==updated.mapId)r.locationIds=r.locationIds.filter(loc=>loc!==updated.id);});
 },{onDelete:old?()=>commit(`Localidade ${l.name} excluída`,c=>{c.characters.filter(ch=>ch.locationId===id).forEach(ch=>ch.locationId='');for(const r of c.regions)r.locationIds=r.locationIds.filter(loc=>loc!==id);c.locations=c.locations.filter(v=>v.id!==id);}):null});
 const form=$('#edit-form');for(const name of ['x','y']){form.elements[name].max='100';form.elements[name].step='0.1';}
}

function showLocation(id){const c=campaign(),l=c.locations.find(v=>v.id===id);const child=c.regions.find(r=>r.worldMapId===l.mapId&&r.locationIds.includes(id));if(child)return navigateMap(child.mapId);readDialog(l.name,`<p class="prose">${e(l.description)}</p><h3>Personagens neste local</h3><div class="linked-characters">${c.characters.filter(ch=>ch.locationId===id).map(ch=>`<button class="character-chip" data-open-character="${e(ch.id)}">${avatar(ch)}${e(ch.name)}</button>`).join('')||'<p class="muted">Nenhum personagem vinculado.</p>'}</div><button data-edit-location="${e(id)}">Editar localidade</button>`);}
return {navigateMap,editRegion,editMap,editLocation,showLocation};
}
