import {createController} from './controller.js';
import {settingsView} from './view.js';
export function createCampaignsFeature(ctx) {
 const api=createController(ctx);
 return {id:'campaigns',routes:[{id:'universo',label:'Universo e backups',icon:'settings',group:'system',render:()=>settingsView(ctx.campaign(),ctx.state(),{atlas:ctx.service('atlas')?.renderSettings(ctx.campaign()),backups:ctx.service('backups')?.renderSettings()})}],
  actions:{'edit-campaign':()=>api.editCampaign(),'new-campaign':()=>api.editCampaign(true),
   'delete-campaign':async()=>{if(ctx.state().campaigns.length===1)throw new Error('Crie outra campanha antes de excluir a última.');if(!confirm(`Excluir toda a campanha “${ctx.campaign().name}”, incluindo textos e personagens?`))return;await ctx.commit('Campanha excluída',(c,next)=>{next.campaigns=next.campaigns.filter(v=>v.id!==c.id);ctx.activateCampaign(next.campaigns[0].id);ctx.ui.mapId='';});}}
 };
}
