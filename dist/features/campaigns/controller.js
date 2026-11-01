import {escapeHTML as e} from '../../shared/primitives.js';
import {field} from '../../shared/ui.js';
import {emptyCampaign} from './domain.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
function editCampaign(isNew=false){
 const c=isNew?emptyCampaign(''):campaign();
 formDialog(isNew?'Nova campanha':'Identidade da campanha',`${field('Nome *','name',c.name,{required:true,max:140})}${field('Subtítulo','subtitle',c.subtitle,{max:500})}${field('Dia e hora na história','day',c.day,{max:140})}${isNew?'<p class="muted">O novo universo começa vazio e independente de Caldris. Adicione seu mapa e personagens depois de criar.</p>':''}`,async data=>{const name=value(data,'name',140,true);await commit(`Campanha ${name} configurada`,(current,next)=>{const target=isNew?c:current;Object.assign(target,{name,subtitle:value(data,'subtitle',500),day:value(data,'day',140)});if(isNew){next.campaigns.push(target);ctx.activateCampaign(target.id);ui.mapId='';ui.chapterId='';ui.selectedId='';}});if(isNew)location.hash='universo';});
}
return {editCampaign};
}
