import {createController} from './controller.js';
import {recordView} from './view.js';
export function createRecordsFeature(ctx) {
 const api=createController(ctx),routes=[['compendio','Compêndio','spark','lore'],['faccoes','Facções','flag','factions'],['tramas','Tramas e mistérios','pin','threads']];
 return {id:'records',routes:routes.map(([id,label,icon,key])=>({id,label,icon,render:()=>recordView(ctx.campaign(),key,ctx.ui.query)})),
  actions:Object.fromEntries(['lore','factions','threads'].map(key=>['new-'+key,()=>api.editRecord(key)])),
  commands:{editRecord:value=>{const [key,id]=value.split(':');if(!['lore','factions','threads'].includes(key))throw new Error('Tipo de registro inválido.');api.editRecord(key,id);}}
 };
}
