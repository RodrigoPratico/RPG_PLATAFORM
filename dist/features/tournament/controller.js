import {uid} from '../../shared/primitives.js';
import {field,selectField} from '../../shared/ui.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
function editMatch(id){
 const old=campaign().tournament.matches.find(m=>m.id===id);const m=old||{id:uid(),round:'Classificatórias',a:'',b:'',winner:'',notes:''};
 const options=[['','A definir'],...campaign().characters.map(ch=>[ch.id,ch.name])];
 formDialog('Confronto do campeonato',`${field('Etapa','round',m.round,{max:100})}<div class="form-two">${selectField('Participante A','a',m.a,options)}${selectField('Participante B','b',m.b,options)}</div>${selectField('Resultado','winner',m.winner,[['','Aguardando resultado'],['empate','Empate'],...options.slice(1)])}${field('Notas da luta','notes',m.notes,{type:'textarea',rows:5,max:5000})}`,async data=>{const updated={...m,round:value(data,'round',100),a:value(data,'a',100),b:value(data,'b',100),winner:value(data,'winner',100),notes:value(data,'notes',5000)};if(updated.a&&updated.a===updated.b)throw new Error('Escolha participantes diferentes.');if(updated.winner&&!['empate',updated.a,updated.b].includes(updated.winner))throw new Error('O vencedor deve ser um dos participantes.');if(updated.winner&&(!updated.a||!updated.b))throw new Error('Defina os dois participantes antes de registrar um resultado.');await commit('Confronto atualizado',c=>{if(old)c.tournament.matches[c.tournament.matches.findIndex(v=>v.id===id)]=updated;else c.tournament.matches.push(updated);});},{onDelete:old?()=>commit('Confronto excluído',c=>{c.tournament.matches=c.tournament.matches.filter(v=>v.id!==id);}):null});
}
return {editMatch};
}
