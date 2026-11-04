import {$} from '../../shared/ui.js';
import {clamp,clone} from '../../shared/primitives.js';
import * as domain from './domain.js';
import {validPolygon} from './geometry.js';
import {atlas} from './view.js';
import {bindMap} from './interactions.js';
import {createController} from './controller.js';
import {atlasSettings} from './settings.js';
export function createAtlasFeature(ctx) {
 const api=createController(ctx),{ui,campaign,commit,render,toast,report}=ctx;
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&ui.fullscreen){ui.fullscreen=false;render();}});
 const onFullscreenToggle=()=>{
  ui.fullscreen=!ui.fullscreen;
  if(ui.fullscreen)document.documentElement.requestFullscreen?.().catch(()=>{});
  else if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  render();
 };
 return {id:'atlas',styles:['./features/atlas/styles.css'],services:{...domain,navigateMap:api.navigateMap,renderSettings:atlasSettings},
  onRouteRendered(id){
   document.body.classList.toggle('map-fullscreen',id==='mapa'&&ui.fullscreen);
   if(id!=='mapa'&&ui.fullscreen){ui.fullscreen=false;document.exitFullscreen?.().catch(()=>{});}
  },
  routes:[{id:'mapa',label:'Atlas do mundo',icon:'map',render:()=>atlas(campaign(),ui),
   beforeRender(params){
    const old=$('#map-viewport'),scroll=old?{id:$('#map-canvas')?.dataset.mapId,left:old.scrollLeft,top:old.scrollTop}:null,c=campaign();
    const requested=params.get('map'),root=c.maps.find(m=>!m.archived&&!domain.mapRegion(c,m.id)),next=c.maps.some(m=>m.id===requested)?requested:root?.id;
    if(next&&next!==ui.mapId){ui.mapId=next;ui.zoom=1;ui.drawing=null;}
    if(!c.maps.some(m=>m.id===ui.mapId))ui.mapId=c.maps[0]?.id||'';
    return {scroll};
   },
   afterRender({scroll}={}){
    if(scroll?.id===ui.mapId&&$('#map-viewport')){$('#map-viewport').scrollLeft=scroll.left;$('#map-viewport').scrollTop=scroll.top;}
    const c=campaign();bindMap({campaign:c,mapId:ui.mapId,drawing:ui.drawing,
     onSelect:id=>{ui.selectedId=id;render();if(innerWidth<=1000)ctx.service('characters')?.showCharacter(id);},
     onMove:async(id,p,keyboard=false)=>{const mapId=ui.mapId;await commit(`Posição de ${c.characters.find(ch=>ch.id===id).name} ajustada`,next=>domain.moveCharacter(next,id,mapId,p));if(keyboard)$(`.map-token[data-character="${CSS.escape(id)}"]`)?.focus({preventScroll:true});},
     onLocation:api.showLocation,onMap:api.navigateMap,onRegion:id=>api.navigateMap(c.regions.find(r=>r.id===id).mapId),
     onDrawPoint:point=>{if(ui.drawing.length>=80){toast('Limite de 80 pontos por contorno.');return;}ui.drawing.push(point.map(v=>Math.round(v*10)/10));render();},
     onZoom:direction=>{ui.zoom=direction==='fit'?1:clamp(ui.zoom+(direction==='in'?0.25:-0.25),1,3);render();},
     onToggles:(key,v)=>{ui[key]=v;render();},onFullscreenToggle,report});
   }}],
  actions:{'new-region':()=>api.editRegion(),'new-subregion':()=>api.editRegion(),'new-map':()=>api.editMap(),'new-location':()=>api.editLocation(),
   'start-region':()=>{if(!ui.mapId)throw new Error('Adicione um mapa primeiro.');ui.drawing=[];render();},
   'cancel-region':()=>{ui.drawing=null;render();},'undo-region-point':()=>{ui.drawing?.pop();render();},
   'finish-region':()=>{if(!validPolygon(ui.drawing))throw new Error('Use ao menos três pontos, sem cruzamentos.');const p=clone(ui.drawing);ui.drawing=null;render();api.editRegion(undefined,p);}},
  commands:{editRegion:api.editRegion,regionMap:api.navigateMap,editMap:api.editMap,editLocation:api.editLocation,
   filterRegion:id=>{ui.regionFilter=id;ctx.navigate('personagens');render();}}
 };
}
