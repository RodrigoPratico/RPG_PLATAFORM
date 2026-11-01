import {escapeHTML as e} from '../../shared/primitives.js';
import {icon,pageHeading,badge,empty} from '../../shared/ui.js';
const locationName=(c,id)=>c.locations.find(l=>l.id===id)?.name||'Local desconhecido';
const button=(action,label,primary=false)=>`<button class="${primary?'primary':''}" data-action="${action}">${icon('plus')}${label}</button>`;
export function recordView(c,key,query='') {
 const config={lore:['AS LEIS DO SEU UNIVERSO','Compêndio','O cânone, as regras e as memórias que sustentam a campanha.','Novo registro'],factions:['O EQUILÍBRIO DO PODER','Facções','Instituições, alianças e forças em disputa.','Nova facção'],threads:['NEM TUDO FOI REVELADO','Tramas e mistérios','Acompanhe os fios soltos, os riscos e as perguntas em aberto.','Nova trama']}[key];
 const rows=c[key].filter(v=>(v.title+' '+v.body+' '+v.status).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 return `${pageHeading(...config.slice(0,3),button(`new-${key}`,config[3],true))}<div class="list-toolbar"><label class="search-box">${icon('search')}<input id="filter" type="search" placeholder="Buscar nos registros…" value="${e(query)}" aria-label="Buscar registros"></label><span class="muted">${rows.length} registros</span></div><div class="record-grid">${rows.map(v=>`<article class="panel record-card"><div class="section-line">${badge(v.status)}<button class="text-button" data-edit-record="${key}:${e(v.id)}">Editar ↗</button></div><h2>${e(v.title)}</h2><div class="prose">${e(v.body)}</div></article>`).join('')}</div>${rows.length?'':empty('Nenhum registro por aqui','Adicione um registro ou tente outra busca.')}`;
}
