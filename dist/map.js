import {escapeHTML as e,clamp} from './model.js';
import {polygonArea} from './geometry.js';
import {mapRegion,mapCharacters,regionMembers} from './regions.js';
import {$,$$,avatar,icon,empty} from './ui.js';

export function renderMap(campaign,mapId,selectedId,{zoom=1,showLocations=false,showCharacters=true,showRegions=true,drawing=null}={}) {
 const map=campaign.maps.find(m=>m.id===mapId);
 if(!map)return empty('Seu mundo começa aqui','Adicione um mapa em Universo e backups para começar.','<a class="button primary" href="#universo">Adicionar mapa</a>');
 const local=mapRegion(campaign,mapId),regions=campaign.regions.filter(r=>r.worldMapId===mapId);
 const chars=mapCharacters(campaign,mapId);
 const regionLayer=showRegions&&!drawing?`<svg class="region-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Regiões clicáveis">${[...regions].sort((a,b)=>polygonArea(b.polygon)-polygonArea(a.polygon)).map(r=>`<polygon points="${r.polygon.map(p=>p.join(',')).join(' ')}" data-region="${e(r.id)}" tabindex="0" role="button" aria-label="Explorar ${e(r.name)}"><title>${e(r.name)}</title></polygon>`).join('')}</svg>`:'';
 return `<div class="atlas-context"><div>${local?`<button class="text-button" data-map-back="${e(local.worldMapId)}">← Voltar ao mapa do reino</button><span class="context-separator">/</span><strong>${e(local.name)}</strong>`:`<span class="eyebrow">${map.archived?'MAPA ANTERIOR · REFERÊNCIA':'MAPA DO REINO'}</span><span>${regions.length?`${regions.length} regiões para explorar`:e(map.name)}</span>`}</div>${!map.archived?'<button class="text-button" data-action="start-region">＋ Delimitar região</button>':''}</div>
 <div class="atlas-toolbar"><div class="toolbar-start">${icon('map')}<select id="map-select" aria-label="Mapa ativo">${campaign.maps.map(m=>`<option value="${e(m.id)}" ${m.id===mapId?'selected':''}>${e(m.name)}</option>`).join('')}</select><span class="toolbar-divider"></span><label class="toggle"><input id="toggle-characters" type="checkbox" ${showCharacters?'checked':''}> Personagens</label><label class="toggle"><input id="toggle-locations" type="checkbox" ${showLocations?'checked':''}> Lugares</label>${regions.length?`<label class="toggle"><input id="toggle-regions" type="checkbox" ${showRegions?'checked':''}> Regiões</label>`:''}</div><div class="zoom-controls"><button data-zoom="out" aria-label="Diminuir zoom">−</button><span>${Math.round(zoom*100)}%</span><button data-zoom="in" aria-label="Aumentar zoom">+</button><button data-zoom="fit">Ajustar</button><button id="fullscreen" aria-label="Mapa em tela cheia">⛶</button></div></div>
 ${drawing?`<div class="drawing-toolbar"><span>Clique nos vértices do contorno · ${drawing.length}/80 pontos</span><div><button data-action="undo-region-point" ${drawing.length?'':'disabled'}>Desfazer ponto</button><button class="primary" data-action="finish-region" ${drawing.length>=3?'':'disabled'}>Concluir contorno</button><button data-action="cancel-region">Cancelar</button></div></div>`:''}
 <div class="map-viewport" id="map-viewport"><div class="map-canvas ${drawing?'is-drawing':''}" id="map-canvas" data-map-id="${e(mapId)}" style="width:${zoom*100}%"><img id="world-map" src="${e(map.image)}" alt="${e(map.name)}" draggable="false">
 ${regionLayer}
 ${drawing?`<svg class="drawing-layer" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${drawing.map(p=>p.join(',')).join(' ')}"/>${drawing.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="0.55"><title>Ponto ${i+1}</title></circle>`).join('')}</svg>`:''}
 ${showRegions&&!drawing?regions.map(r=>`<button class="region-count" style="left:${r.x}%;top:${r.y}%" data-region="${e(r.id)}" aria-label="${regionMembers(campaign,r.id).length} personagens em ${e(r.name)}; abrir mapa">${icon('map')}<span>${regionMembers(campaign,r.id).length}</span></button>`).join(''):''}
 ${showLocations&&!drawing?campaign.locations.filter(l=>l.mapId===mapId).map(l=>`<button class="location-pin" style="left:${l.x}%;top:${l.y}%" data-location="${e(l.id)}" aria-label="${e(l.name)}">◇<span>${e(l.name)}</span></button>`).join(''):''}
 ${showCharacters&&!drawing?chars.map(c=>{const p=c.positions[mapId];return `<button class="map-token ${c.id===selectedId?'selected':''} ${c.id==='momo'?'queen':''}" style="left:${p.x}%;top:${p.y}%" data-character="${e(c.id)}" aria-label="${e(c.name)}; arraste para mover, Enter para abrir ficha">${avatar(c)}${c.id==='momo'?'<span class="crown">♛</span>':''}</button>`;}).join(''):''}
 </div><div class="map-caption">${icon('pin')} ${drawing?'Marque pelo menos três vértices para criar sua região':regions.length?'Aponte uma região para ler · Clique para explorar · Arraste personagens para transferir':'Arraste personagens · Aponte para ampliar · Clique para abrir a ficha'}</div></div>
 <div class="map-footnote"><span><i class="dot"></i> ${chars.length} personagens ${local?'nesta região':'neste mapa'}</span><span>${map.archived?'Posições históricas preservadas':local?'Marcadores locais salvos por região':'Contornos e posições aproximados · editáveis'}</span></div>`;
}

function tooltipPosition(hover,x,y) {
 hover.hidden=false;const rect=hover.getBoundingClientRect();
 hover.style.left=`${clamp(x+14,8,Math.max(8,innerWidth-rect.width-12))}px`;
 hover.style.top=`${clamp(y+10,8,Math.max(8,innerHeight-rect.height-12))}px`;
}
export function bindMap({campaign,mapId,onSelect,onMove,onLocation,onMap,onRegion,onZoom,onToggles,onDrawPoint,drawing,report}) {
 $('#map-select')?.addEventListener('change',ev=>onMap(ev.target.value));
 $$('[data-map-back]').forEach(b=>b.addEventListener('click',()=>onMap(b.dataset.mapBack)));
 $$('[data-zoom]').forEach(b=>b.addEventListener('click',()=>onZoom(b.dataset.zoom)));
 for(const [id,key] of [['characters','showCharacters'],['locations','showLocations'],['regions','showRegions']])$(`#toggle-${id}`)?.addEventListener('change',ev=>onToggles(key,ev.target.checked));
 $('#fullscreen')?.addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen().catch(report);else $('.atlas-panel').requestFullscreen?.().catch(report);});
 $$('[data-location]').forEach(b=>b.addEventListener('click',()=>onLocation(b.dataset.location)));
 const hover=$('#hover-card');
 for(const node of $$('[data-region]')) {
   const region=campaign.regions.find(r=>r.id===node.dataset.region);
   const show=ev=>{const rect=node.getBoundingClientRect();const members=regionMembers(campaign,region.id);hover.className='region-hover';hover.innerHTML=`<img src="${e(campaign.maps.find(m=>m.id===region.mapId).image)}" alt="Mapa de ${e(region.name)}"><strong>${e(region.name)}</strong><p>${e(region.summary)}</p><small>${members.length} personagem(ns) presente(s)${members.length?' · '+e(members.slice(0,4).map(ch=>ch.name).join(', ')):''}</small><div class="hover-cta">Clique para abrir o mapa regional ↗</div>`;tooltipPosition(hover,ev?.clientX??rect.right,ev?.clientY??rect.top);};
   node.addEventListener('mouseenter',show);node.addEventListener('focus',()=>show());
   node.addEventListener('mousemove',ev=>tooltipPosition(hover,ev.clientX,ev.clientY));
   node.addEventListener('mouseleave',()=>hover.hidden=true);node.addEventListener('blur',()=>hover.hidden=true);
   node.addEventListener('click',()=>{hover.hidden=true;onRegion(region.id);});
   if(node.tagName.toLowerCase()==='polygon')node.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();onRegion(region.id);}});
 }
 if(drawing)$('#map-canvas')?.addEventListener('click',ev=>{const rect=$('#map-canvas').getBoundingClientRect();onDrawPoint([clamp((ev.clientX-rect.left)/rect.width*100),clamp((ev.clientY-rect.top)/rect.height*100)]);});
 for(const token of $$('.map-token')) {
   const char=campaign.characters.find(c=>c.id===token.dataset.character);let start=null,moved=false,blockClick=false;
   token.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;start={x:ev.clientX,y:ev.clientY,position:{...char.positions[mapId]}};moved=false;token.setPointerCapture(ev.pointerId);hover.hidden=true;});
   token.addEventListener('pointermove',ev=>{if(!start)return;if(Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>4)moved=true;if(!moved)return;const rect=$('#map-canvas').getBoundingClientRect();token.style.left=`${clamp((ev.clientX-rect.left)/rect.width*100)}%`;token.style.top=`${clamp((ev.clientY-rect.top)/rect.height*100)}%`;token.classList.add('dragging');});
   token.addEventListener('pointerup',async()=>{if(!start)return;const old=start.position;start=null;token.classList.remove('dragging');if(moved){blockClick=true;try{await onMove(char.id,{x:parseFloat(token.style.left),y:parseFloat(token.style.top)});}catch(err){token.style.left=old.x+'%';token.style.top=old.y+'%';report(err);}setTimeout(()=>blockClick=false,150);}});
   token.addEventListener('pointercancel',()=>{if(start){token.style.left=start.position.x+'%';token.style.top=start.position.y+'%';start=null;}token.classList.remove('dragging');});
   token.addEventListener('click',()=>{hover.hidden=true;if(!blockClick)onSelect(char.id);});
   token.addEventListener('keydown',ev=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];if(!delta)return;ev.preventDefault();const p=char.positions[mapId];onMove(char.id,{x:clamp(p.x+delta[0]),y:clamp(p.y+delta[1])},true).catch(report);});
   const show=()=>{if(start)return;const rect=token.getBoundingClientRect(),region=campaign.regions.find(r=>r.id===char.regionId);hover.className='';hover.innerHTML=`${char.image?`<img src="${e(char.image)}" alt="${e(char.name)}">`:avatar(char)}<strong>${e(char.name)}</strong><small>${e(region?.name||'Sem região definida')} · ${e(char.rank)}</small>`;tooltipPosition(hover,rect.right,rect.top-40);};
   token.addEventListener('mouseenter',show);token.addEventListener('focus',show);token.addEventListener('mouseleave',()=>hover.hidden=true);token.addEventListener('blur',()=>hover.hidden=true);
 }
}
