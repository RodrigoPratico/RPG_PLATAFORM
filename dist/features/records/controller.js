import {uid,escapeHTML as e} from '../../shared/primitives.js';
import {field} from '../../shared/ui.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
function editRecord(key,id){
 const old=campaign()[key].find(v=>v.id===id);const row=old||{id:uid(),title:'',status:key==='lore'?'Cânone':'Em andamento',body:''};
 const label={lore:'registro do compêndio',threads:'trama',factions:'facção'}[key];
 formDialog(`Editar ${label}`,`${field('Título *','title',row.title,{required:true,max:200})}${field('Estado / categoria','status',row.status,{max:100})}${field('Conteúdo e contexto','body',row.body,{type:'textarea',rows:13})}${key==='threads'?'<p class="muted">Use o estado “Resolvido” para retirar esta trama da contagem de pendências.</p>':''}`,async data=>{const updated={...row,title:value(data,'title',200,true),status:value(data,'status',100),body:value(data,'body')};await commit(`${updated.title} atualizado`,c=>{if(old)c[key][c[key].findIndex(v=>v.id===row.id)]=updated;else c[key].push(updated);});},{wide:true,onDelete:old?()=>commit(`${row.title} excluído`,c=>{c[key]=c[key].filter(v=>v.id!==row.id);}):null});
}
return {editRecord};
}
