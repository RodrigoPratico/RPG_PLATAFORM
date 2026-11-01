import {text,requireValue} from '../../shared/validation.js';
export function validateCampaign(c) {
 if(c.catalogApplied!==undefined)requireValue(Array.isArray(c.catalogApplied)&&c.catalogApplied.length<=5000&&new Set(c.catalogApplied).size===c.catalogApplied.length&&c.catalogApplied.every(v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(v)),'Catálogo de imagens inválido.');
    requireValue(text(c.name, 140) && c.name.trim(), 'Nome de campanha inválido.');
    requireValue(text(c.subtitle, 500) && text(c.day, 140), 'Metadados inválidos.');
    requireValue(text(c.updatedAt,100) && Number.isFinite(Date.parse(c.updatedAt)), 'Data da campanha inválida.');
    if(c.history!==undefined)requireValue(Array.isArray(c.history) && c.history.length<=60 && c.history.every(h=>h && text(h.description,500) && text(h.date,100) && Number.isFinite(Date.parse(h.date))), 'Histórico inválido.');

}
