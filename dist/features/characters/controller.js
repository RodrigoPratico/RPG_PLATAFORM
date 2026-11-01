import {clone,escapeHTML as e} from '../../shared/primitives.js';
import {avatar,icon,field,selectField,fileField,badge} from '../../shared/ui.js';
import {readImage} from '../../shared/image-input.js';
import {ATTRIBUTES,emptyCharacter} from './domain.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
const spatial=ctx.service('atlas');
const {mapRegion,regionForLocation,assignRegion,positionCharacterAtLocation,moveCharacter}=spatial||{mapRegion:()=>null,regionForLocation:()=>null,assignRegion:()=>{},positionCharacterAtLocation:()=>{},moveCharacter:()=>{}};
const removeCharacter=ctx.removeCharacter;
const locOptions=()=>[['','Local não informado'],...campaign().locations.map(l=>[l.id,l.name])];
const mapOptions=()=>campaign().maps.map(m=>[m.id,m.name]);
function editCharacter(id){
 const existing=campaign().characters.find(ch=>ch.id===id);const ch=clone(existing||emptyCharacter());
 if(!existing){const region=mapRegion(campaign(),ui.mapId);if(region){ch.regionId=region.id;ch.locationId=region.locationIds[0]||'';}}
 const attrs=ATTRIBUTES.map(a=>field(a,`attr-${a}`,ch.attributes[a]??'',{type:'number'})).join('');
 const body=`<div class="form-two">${field('Nome *','name',ch.name,{required:true,max:140})}${field('Função','role',ch.role,{max:500})}${field('Idade / anotação','age',ch.age,{max:100})}${field('Rank / registro público','rank',ch.rank,{max:140})}${!spatial?'':selectField('Região / sub-região atual','regionId',ch.regionId,[['','Sem região definida'],...campaign().regions.map(r=>[r.id,spatial?.regionLabel(campaign(),r.id)||r.name])])}${selectField('Local atual','locationId',ch.locationId,locOptions())}${field('Facção','faction',ch.faction,{max:200})}</div>${fileField(ch.image?'Substituir imagem (opcional)':'Imagem da ficha','image')}${ch.image?'<p class="muted">A imagem atual será mantida se nenhum arquivo for selecionado.</p>':''}<div class="form-two">${field('Lealdade','loyalty',ch.loyalty,{max:500})}${!spatial?'':selectField('Posicionar também no mapa','pinMapId','',[['','Manter posições / não adicionar'],...mapOptions()])}</div><p class="muted">Escolher uma região atualiza seus mapas. Arrastar para outra região no mapa do reino transfere o personagem e ajusta o local geral. Dentro da região, a posição é livre.</p><div class="attribute-form">${attrs}</div><small class="muted">Campo vazio = desconhecido. Até 9.999.999; não inferimos atributos não informados.</small>${field('Resumo e história','summary',ch.summary,{type:'textarea',rows:8})}${field('Relações e contexto','relations',ch.relations,{type:'textarea',rows:3})}${field('Notas do mestre','notes',ch.notes,{type:'textarea',rows:3})}`;
 formDialog(existing?'Editar personagem':'Novo personagem',body,async data=>{
   const image=data.get('image');const updated={...ch,name:value(data,'name',140,true),role:value(data,'role',500),age:value(data,'age',100),rank:value(data,'rank',140),locationId:value(data,'locationId',100),faction:value(data,'faction',200),loyalty:value(data,'loyalty',500),summary:value(data,'summary'),relations:value(data,'relations'),notes:value(data,'notes')};
   for(const a of ATTRIBUTES){const v=value(data,`attr-${a}`,10);updated.attributes[a]=v===''?null:Number(v);}
   if(image?.size){updated.image=await readImage(image);updated.portrait='';}
   await commit(`Ficha de ${updated.name} ${existing?'atualizada':'criada'}`,c=>{
    if(existing)c.characters[c.characters.findIndex(v=>v.id===ch.id)]=updated;else c.characters.push(updated);
    if(!spatial)return;
    const selectedRegion=value(data,'regionId',100);
    const inferred=regionForLocation(c,updated.locationId);
    if(updated.locationId!==ch.locationId&&updated.locationId){
      if(selectedRegion&&selectedRegion!==ch.regionId&&inferred&&inferred.id!==selectedRegion)throw new Error('O local escolhido pertence a outra região. Revise a região ou o local atual.');
      if(!inferred&&selectedRegion!==ch.regionId)assignRegion(c,updated,selectedRegion,{keepLocation:true});
      positionCharacterAtLocation(c,updated,updated.locationId);
    }else if(selectedRegion!==ch.regionId||!existing){
      assignRegion(c,updated,selectedRegion);
      if(!existing&&updated.locationId)positionCharacterAtLocation(c,updated,updated.locationId);
    }
    const mid=value(data,'pinMapId',100);if(mid){const linked=mapRegion(c,mid);if(linked)assignRegion(c,updated,linked.id);if(!updated.positions[mid])moveCharacter(c,updated.id,mid,{x:50,y:50});}
   });ui.selectedId=updated.id;
 },{wide:true,onDelete:existing?()=>commit(`Personagem ${ch.name} excluído`,c=>removeCharacter(c,ch.id)):null});
}

function showCharacter(id){
 const c=campaign(),ch=c.characters.find(v=>v.id===id);if(!ch)return;
 readDialog(ch.name,`<div class="full-character"><div>${ch.image?`<a href="${e(ch.image)}" target="_blank" rel="noopener" title="Abrir imagem inteira">${avatar(ch,'full-card')}</a>`:avatar(ch,'full-card')}<p class="muted">${ch.image?'Clique na ficha para ampliar a imagem original.':'Retrato ainda não fornecido.'}</p></div><div><div class="section-line">${badge(ch.role||'Personagem')}<button data-edit-character="${e(id)}">Editar ficha</button></div><p class="location-line">${icon('pin')}${e(c.locations.find(l=>l.id===ch.locationId)?.name||'Local desconhecido')}</p><dl class="facts"><dt>Idade</dt><dd>${e(ch.age||'Não informada')}</dd><dt>Rank</dt><dd>${e(ch.rank||'Não informado')}</dd><dt>Facção</dt><dd>${e(ch.faction||'Não informada')}</dd><dt>Lealdade</dt><dd>${e(ch.loyalty||'Não registrada')}</dd></dl><div class="attribute-display">${ATTRIBUTES.map(a=>`<div><small>${e(a)}</small><strong>${ch.attributes[a]===null?'?':ch.attributes[a].toLocaleString('pt-BR')}</strong></div>`).join('')}</div><p class="character-region">Região: ${e(spatial?.regionLabel(c,ch.regionId)||c.regions.find(r=>r.id===ch.regionId)?.name||'Sem região definida')}</p><h3>História e estado atual</h3><div class="prose">${e(ch.summary||'Sem resumo.')}</div><h3>Relações</h3><div class="prose">${e(ch.relations||'Nenhuma relação registrada.')}</div>${ch.notes?`<h3>Notas do mestre</h3><div class="prose master-note">${e(ch.notes)}</div>`:''}<h3>Capítulos vinculados</h3>${c.chapters.filter(v=>v.characterIds.includes(id)).map(v=>`<button class="chapter-link" data-chapter="${e(v.id)}">${icon('book')}${e(v.title)}</button>`).join('')||'<p class="muted">Ainda sem capítulos vinculados.</p>'}<div class="button-row"><button data-locate-character="${e(id)}">Ver no atlas</button><button class="quiet" data-remove-pin="${e(id)}">Retirar do mapa ativo</button></div></div></div>`);
}
return {editCharacter,showCharacter};
}
