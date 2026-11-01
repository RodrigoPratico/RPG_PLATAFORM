import {createController} from './controller.js';
import {backupSettings} from './view.js';
export function createBackupsFeature(ctx) {
 const api=createController(ctx);
 return {id:'backups',services:{...api,renderSettings:backupSettings},onRouteRendered:id=>{if(id==='universo')api.storageInfo().catch(()=>{});},
  actions:{backup:api.exportBackup,import:api.importBackup,help:api.help,
   persistent:async()=>{const granted=await navigator.storage?.persist?.();ctx.toast(granted?'Armazenamento persistente concedido.':'O navegador não concedeu persistência. Continue exportando backups.');await api.storageInfo();},
   restore:async()=>{let previous=await ctx.repository.read('previous');if(!previous)throw new Error('Ainda não há uma gravação anterior para restaurar.');previous=ctx.migrateState(previous);if(!confirm('Restaurar o estado anterior de todas as campanhas?'))return;await ctx.commit('Gravação anterior restaurada',(_c,next)=>{next.campaigns=previous.campaigns;ctx.activateCampaign(next.campaigns[0].id);ctx.ui.mapId='';});ctx.toast('Gravação anterior restaurada.');}}
 };
}
