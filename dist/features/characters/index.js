import {createController} from './controller.js';
import {characterView} from './view.js';
export function createCharactersFeature(ctx) {
 const api=createController(ctx),{ui,campaign,commit,render,closeDialog}=ctx;
 return {id:'characters',services:api,
  routes:[{id:'personagens',label:'Personagens',icon:'people',badge:c=>c.characters.length,render:()=>characterView(campaign(),ui.query,ui.regionFilter,ctx.service('atlas')),
   afterRender(){document.querySelector('#region-filter')?.addEventListener('change',ev=>{ui.regionFilter=ev.target.value;render();});}}],
  actions:{'new-character':()=>api.editCharacter()},commands:{editCharacter:api.editCharacter,openCharacter:api.showCharacter,
   locateCharacter:id=>{const c=campaign(),ch=c.characters.find(v=>v.id===id),spatial=ctx.service('atlas');if(!spatial)throw new Error('O atlas não está habilitado.');const mid=c.regions.find(r=>r.id===ch.regionId)?.mapId||Object.keys(ch.positions).find(id=>!c.maps.find(m=>m.id===id)?.archived);if(!mid)throw new Error('Este personagem está sem marcador. Edite a ficha e escolha um local.');ui.selectedId=id;closeDialog();spatial.navigateMap(mid);},
   removePin:async id=>{await commit('Marcador retirado do mapa ativo',c=>{delete c.characters.find(ch=>ch.id===id).positions[ui.mapId];});closeDialog();}}
 };
}
