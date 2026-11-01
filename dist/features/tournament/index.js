import {createController} from './controller.js';
import {tournamentView} from './view.js';
import {field} from '../../shared/ui.js';
export function createTournamentFeature(ctx) {
 const api=createController(ctx);
 return {id:'tournament',routes:[{id:'campeonato',label:'Campeonato',icon:'sword',render:()=>tournamentView(ctx.campaign())}],
  actions:{'new-match':()=>api.editMatch(),'edit-rules':()=>ctx.formDialog('Regulamento do campeonato',field('Regras e planejamento','rules',ctx.campaign().tournament.rules,{type:'textarea',rows:18}),async data=>ctx.commit('Regulamento atualizado',c=>{c.tournament.rules=ctx.value(data,'rules');}),{wide:true})},commands:{match:api.editMatch}}
}
