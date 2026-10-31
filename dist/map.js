import {escapeHTML as e,clamp} from './model.js';
import {$,$$,avatar,icon,empty} from './ui.js';
/** Map coordinates are normalized percentages, independent of source dimensions. */
export function renderMap(campaign,mapId,selectedId,{zoom=1,showLocations=false,showCharacters=true}={}) {
 const map=campaign.maps.find(m=>m.id===mapId);
 if (!map) return empty('Seu mundo começa aqui','Adicione um mapa em Universo e backups para começar a posicionar personagens.','<a class="button primary" href="#universo">Adicionar mapa</a>');
 const chars=campaign.characters.filter(c=>c.positions[mapId]);
 return `<div class="atlas-toolbar"><div class="toolbar-start">${icon('map')}<select id="map-select" aria-label="Mapa ativo">${campaign.maps.map(m=>`<option value="${e(m.id)}" ${m.id===mapId?'selected':''}>${e(m.name)}</option>`).join('')}</select><span class="toolbar-divider"></span><label class="toggle"><input id="toggle-characters" type="checkbox" ${showCharacters?'checked':''}> Personagens</label><label class="toggle"><input id="toggle-locations" type="checkbox" ${showLocations?'checked':''}> Lugares</label></div><div class="zoom-controls"><button data-zoom="out" title="Diminuir zoom" aria-label="Diminuir zoom">−</button><span id="zoom-level">${Math.round(zoom*100)}%</span><button data-zoom="in" title="Aumentar zoom" aria-label="Aumentar zoom">+</button><button data-zoom="fit" title="Ajustar mapa">Ajustar</button><button id="fullscreen" title="Tela cheia" aria-label="Mapa em tela cheia">⛶</button></div></div>
 <div class="map-viewport" id="map-viewport"><div class="map-canvas" id="map-canvas" style="width:${zoom*100}%"><img id="world-map" src="${e(map.image)}" alt="${e(map.name)}" draggable="false">
 ${showLocations?campaign.locations.filter(l=>l.mapId===mapId).map(l=>`<button class="location-pin" style="left:${l.x}%;top:${l.y}%" data-location="${e(l.id)}" aria-label="${e(l.name)}">◇<span>${e(l.name)}</span></button>`).join(''):''}
 ${showCharacters?chars.map(c=>{const p=c.positions[mapId];return `<button class="map-token ${c.id===selectedId?'selected':''} ${c.id==='momo'?'queen':''}" style="left:${p.x}%;top:${p.y}%" data-character="${e(c.id)}" aria-label="${e(c.name)}; arraste para mover, Enter para abrir ficha" title="${e(c.name)}">${avatar(c)}${c.id==='momo'?'<span class="crown">♛</span>':''}</button>`;}).join(''):''}
 </div><div class="map-caption">${icon('pin')} Arraste para posicionar · Passe o mouse para ampliar · Clique para abrir a ficha</div></div>
 <div class="map-footnote"><span><i class="dot"></i> ${chars.length} personagens neste mapa</span><span>Posições aproximadas e editáveis · localização textual na ficha</span></div>`;
}
export function bindMap({campaign,mapId,onSelect,onMove,onLocation,onMap,onZoom,onToggles,report}) {
 $('#map-select')?.addEventListener('change',ev=>onMap(ev.target.value));
 $$('[data-zoom]').forEach(b=>b.addEventListener('click',()=>onZoom(b.dataset.zoom)));
 $('#toggle-locations')?.addEventListener('change',ev=>onToggles('showLocations',ev.target.checked));
 $('#toggle-characters')?.addEventListener('change',ev=>onToggles('showCharacters',ev.target.checked));
 $('#fullscreen')?.addEventListener('click',()=>{const box=$('.atlas-panel');if(document.fullscreenElement) document.exitFullscreen().catch(report);else box.requestFullscreen?.().catch(report);});
 $$('[data-location]').forEach(b=>b.addEventListener('click',()=>onLocation(b.dataset.location)));
 const hover=$('#hover-card');
 for (const token of $$('.map-token')) {
   const char=campaign.characters.find(c=>c.id===token.dataset.character);
   let start=null,moved=false,blockClick=false;
   token.addEventListener('pointerdown',ev=>{
     if(ev.button!==0) return;start={x:ev.clientX,y:ev.clientY,position:{...char.positions[mapId]}};moved=false;token.setPointerCapture(ev.pointerId);hover.hidden=true;
   });
   token.addEventListener('pointermove',ev=>{
     if(!start)return;
     if(Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>4)moved=true;
     if(!moved)return;
     const rect=$('#map-canvas').getBoundingClientRect();token.style.left=`${clamp((ev.clientX-rect.left)/rect.width*100)}%`;token.style.top=`${clamp((ev.clientY-rect.top)/rect.height*100)}%`;token.classList.add('dragging');
   });
   token.addEventListener('pointerup',async()=>{
     if(!start)return; const old=start.position;start=null;token.classList.remove('dragging');
     if(moved){blockClick=true;try{await onMove(char.id,{x:parseFloat(token.style.left),y:parseFloat(token.style.top)});}catch(err){token.style.left=old.x+'%';token.style.top=old.y+'%';report(err);}setTimeout(()=>blockClick=false,100);}
   });
   token.addEventListener('pointercancel',()=>{if(start){token.style.left=start.position.x+'%';token.style.top=start.position.y+'%';start=null;}token.classList.remove('dragging');});
   token.addEventListener('click',()=>{hover.hidden=true;if(!blockClick)onSelect(char.id);});
   token.addEventListener('keydown',ev=>{
     const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];
     if(!delta)return;ev.preventDefault();const p=char.positions[mapId];onMove(char.id,{x:clamp(p.x+delta[0]),y:clamp(p.y+delta[1])}).catch(report);
   });
   function show(){if(start)return;const rect=token.getBoundingClientRect();const loc=campaign.locations.find(l=>l.id===char.locationId);hover.innerHTML=`${char.image?`<img src="${e(char.image)}" alt="${e(char.name)}">`:avatar(char)}<strong>${e(char.name)}</strong><small>${e(loc?.name||'Local não informado')} · ${e(char.rank)}</small>`;hover.style.left=`${clamp(rect.right+12,8,Math.max(8,innerWidth-268))}px`;hover.style.top=`${clamp(rect.top-40,8,Math.max(8,innerHeight-430))}px`;hover.hidden=false;}
   token.addEventListener('mouseenter',show);token.addEventListener('focus',show);token.addEventListener('mouseleave',()=>hover.hidden=true);token.addEventListener('blur',()=>hover.hidden=true);
 }
}
