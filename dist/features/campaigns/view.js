import {escapeHTML as e} from '../../shared/primitives.js';
import {icon,pageHeading} from '../../shared/ui.js';
const locationName=(c,id)=>c.locations.find(l=>l.id===id)?.name||'Local desconhecido';
const button=(action,label,primary=false)=>`<button class="${primary?'primary':''}" data-action="${action}">${icon('plus')}${label}</button>`;
export function settingsView(c,state,sections={}) {
return `${pageHeading('MUNDOS QUE CONTINUAM','Universo e backups','Suas campanhas, mapas e arquivos em um só lugar.')}<div class="settings-grid"><section class="panel"><h2>Esta campanha</h2><p class="muted">${e(c.name)} · ${e(c.day)}</p><button data-action="edit-campaign">Editar nome e calendário</button><hr><h3>Outras histórias</h3><p>Campanhas têm mapas, personagens e arquivos independentes.</p><button data-action="new-campaign">${icon('plus')} Nova campanha</button><p class="muted">${state.campaigns.length} campanha(s) neste navegador.</p><button class="text-button danger-text" data-action="delete-campaign">Excluir campanha atual</button></section>${sections.backups||''}${sections.atlas||''}</div>`;
}
