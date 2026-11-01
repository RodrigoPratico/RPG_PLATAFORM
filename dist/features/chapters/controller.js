import {clone,uid,escapeHTML as e} from '../../shared/primitives.js';
import {field,selectField} from '../../shared/ui.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
function editChapter(id){
 const old=campaign().chapters.find(v=>v.id===id);const ch=clone(old||{id:uid(),title:'',period:'',status:'Rascunho',body:'',characterIds:[]});
 formDialog(old?'Editar capítulo':'Novo capítulo',`${field('Título *','title',ch.title,{required:true,max:200})}<div class="form-two">${field('Período na história','period',ch.period,{max:100})}${selectField('Estado','status',ch.status,['Rascunho','Em andamento','Concluído'].map(v=>[v,v]))}</div>${field('Texto do capítulo','body',ch.body,{type:'textarea',rows:18})}<fieldset class="character-checks"><legend>Vincular personagens</legend>${campaign().characters.map(v=>`<label><input type="checkbox" name="characters" value="${e(v.id)}" ${ch.characterIds.includes(v.id)?'checked':''}>${e(v.name)}</label>`).join('')}</fieldset>`,async data=>{
  const updated={...ch,title:value(data,'title',200,true),period:value(data,'period',100),status:value(data,'status',100),body:value(data,'body'),characterIds:data.getAll('characters')};
  ui.chapterId=ch.id;await commit(`Capítulo ${updated.title} salvo`,c=>{if(old)c.chapters[c.chapters.findIndex(v=>v.id===id)]=updated;else c.chapters.push(updated);});
 },{wide:true,onDelete:old?()=>commit(`Capítulo ${ch.title} excluído`,c=>{c.chapters=c.chapters.filter(v=>v.id!==id);}):null});
}
return {editChapter};
}
