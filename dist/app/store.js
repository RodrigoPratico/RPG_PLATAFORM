import {clone} from '../shared/primitives.js';

/** The only state writer. Persistence and validation are supplied as ports. */
export function createStore({repository,validate,onStatus=()=>{},onSaved=()=>{}}) {
 let state,activeId='',busy=false;
 const campaign=()=>state.campaigns.find(c=>c.id===activeId)||state.campaigns[0];
 return {
  campaign,state:()=>state,isSaving:()=>busy,
  activate(id){activeId=id;},
  initialize(value){state=value;activeId=campaign().id;},
  async commit(description,mutate){
   if(busy)throw new Error('Uma gravação está em andamento. Aguarde um instante.');
   busy=true;onStatus('Salvando…');const previousActive=activeId;
   try{
    const next=clone(state),current=next.campaigns.find(c=>c.id===campaign().id);
    await mutate(current,next);current.updatedAt=new Date().toISOString();
    current.history=[...(current.history||[]),{date:current.updatedAt,description}].slice(-60);
    validate(next);next.revision=await repository.save(next,state.revision);state=next;
    onStatus('● Salvo neste navegador');onSaved(state.revision);
   }catch(err){activeId=previousActive;onStatus('Falha ao salvar · alterações não gravadas',true);throw err;}
   finally{busy=false;}
  }
 };
}
