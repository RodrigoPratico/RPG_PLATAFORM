import {SCHEMA_VERSION,validateState} from './schema.js';
import {upgradeState,migrateState} from './migrations.js';
import {seedState} from './seed.js';
import {removeCharacter} from './campaign-operations.js';
import {CampaignRepository} from '../features/campaigns/repository.js';
import {createStore} from './store.js';
import {FeatureRegistry} from './feature-registry.js';
import {installFeatures} from './features.js';
import {escapeHTML as e} from '../shared/primitives.js';
import {$,icon} from '../shared/ui.js';
import {value} from '../shared/validation.js';
import {logError} from '../shared/errors.js';
import {createDialogs} from '../shared/dialogs.js';

const registry=new FeatureRegistry(),repository=new CampaignRepository(validateState);
const ui={mapId:'',selectedId:'momo',chapterId:'ch4',zoom:1,showLocations:false,showCharacters:true,showRegions:true,query:'',regionFilter:'',drawing:null};
let activeRoute='',toastTimer,channel;
function toast(message,error=false){const el=$('#toast');clearTimeout(toastTimer);el.textContent=message;el.className=error?'show error':'show';toastTimer=setTimeout(()=>el.className='',error?10000:4500);}
function report(err){logError('operation_failed',err);toast(err.message||'Não foi possível concluir a operação.',true);}
const safely=fn=>(...args)=>Promise.resolve().then(()=>fn(...args)).catch(report);
function status(message,error=false){$('#save-state').textContent=message;$('#save-state').classList.toggle('save-error',error);}
const store=createStore({repository,validate:validateState,onStatus:status,onSaved:revision=>channel?.postMessage({revision})});
const dialogs=createDialogs({report,toast,safely});
async function commit(description,mutate,{rerender=true}={}){await store.commit(description,mutate);if(rerender)render();}
const context={ui,repository,SCHEMA_VERSION,validateState,migrateState,removeCharacter,
 campaign:store.campaign,state:store.state,activateCampaign:id=>store.activate(id),commit,render,toast,report,safely,value,...dialogs,
 service:id=>registry.service(id),route:()=>activeRoute,navigate:id=>{if(registry.route(id))location.hash=id;}};
installFeatures(registry,context);
for(const feature of registry.features())for(const href of feature.styles||[]){
 if(document.querySelector(`link[data-feature-style="${feature.id}"]`))continue;
 const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.featureStyle=feature.id;document.head.append(link);
}
function render(){
 const c=store.campaign(),[requested,query='']=location.hash.slice(1).split('?');
 const route=registry.route(requested)||registry.routes()[0];if(!route)throw new Error('Nenhuma funcionalidade está registrada.');activeRoute=route.id;
 const snapshot=route.beforeRender?.(new URLSearchParams(query));
 $('#campaign-select').innerHTML=store.state().campaigns.map(v=>`<option value="${e(v.id)}" ${v.id===c.id?'selected':''}>${e(v.name)}</option>`).join('');
 $('#nav').innerHTML=registry.routes().map(r=>`${r.group==='system'?'<div class="nav-separator"></div>':''}<a href="#${e(r.id)}" ${route.id===r.id?'aria-current="page"':''} class="${route.id===r.id?'active':''}">${icon(r.icon)}<span>${e(r.label)}</span>${r.badge?`<small>${r.badge(c)}</small>`:''}</a>`).join('');
 $('#breadcrumb').textContent=`${c.name} / ${route.label}`;$('#hover-card').hidden=true;
 $('#main').innerHTML=route.render();
 $('#filter')?.addEventListener('input',ev=>{ui.query=ev.target.value;render();const input=$('#filter');input.focus();input.setSelectionRange(ui.query.length,ui.query.length);});
 route.afterRender?.(snapshot);
 for(const feature of registry.features())feature.onRouteRendered?.(route.id);
}

document.addEventListener('click',safely(async ev=>{const target=ev.target.closest('button,a');if(!target)return;if(target.classList.contains('close-dialog'))return dialogs.closeDialog();await registry.handle(target.dataset,ev);}));
$('#editor').addEventListener('cancel',ev=>{ev.preventDefault();dialogs.closeDialog();});
$('#backup-button').addEventListener('click',safely(()=>registry.action('backup')?.()));
$('#help-button').addEventListener('click',safely(()=>registry.action('help')?.()));
$('#storage-button').addEventListener('click',()=>context.navigate('universo'));
$('#mobile-menu').addEventListener('click',()=>document.body.classList.toggle('menu-open'));
$('#campaign-select').addEventListener('change',ev=>{store.activate(ev.target.value);ui.mapId='';ui.selectedId='';ui.chapterId='';ui.query='';ui.regionFilter='';ui.drawing=null;render();});
window.addEventListener('hashchange',()=>{ui.query='';document.body.classList.remove('menu-open');if(store.state())render();});
window.addEventListener('beforeunload',ev=>{if(dialogs.hasUnsavedChanges()||store.isSaving()){ev.preventDefault();ev.returnValue='';}});
window.addEventListener('scroll',()=>{if(!document.activeElement?.matches('[aria-describedby~="hover-card"]'))$('#hover-card').hidden=true;},true);
window.addEventListener('unhandledrejection',ev=>report(ev.reason));
async function start(){
 try{
  await repository.open();const stored=await repository.read();let state;
  if(stored){const upgrade=upgradeState(stored);state=upgrade.state;if(upgrade.changed)state.revision=await repository.save(state,stored.revision);}
  else{state=seedState();state.revision=await repository.save(state,0);}
  store.initialize(state);
  if(globalThis.BroadcastChannel){channel=new BroadcastChannel('caldris-atlas');channel.onmessage=ev=>{if(ev.data.revision>store.state().revision){status('Outra aba alterou o arquivo · recarregue',true);toast('Há alterações em outra aba. Recarregue para ver a versão atual.',true);}};}
  status('● Salvo neste navegador');render();
 }catch(err){logError('startup_failed',err);$('#main').innerHTML=`<section class="panel startup-error"><h1>Não foi possível abrir o arquivo</h1><p>${e(err.message)}</p><p>Seus dados existentes não foram apagados. Verifique o armazenamento e tente novamente.</p><button id="retry">Tentar novamente</button></section>`;$('#retry').onclick=()=>location.reload();status('Arquivo indisponível',true);}
}
start();
