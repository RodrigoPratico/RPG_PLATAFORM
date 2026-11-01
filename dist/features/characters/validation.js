import {text,requireValue,list} from '../../shared/validation.js';
import {safeImage} from '../../shared/assets.js';
import {ATTRIBUTES} from './domain.js';
export function validateCharacters(c) {list(c.characters,'characters');
    for (const ch of c.characters) {
      requireValue(text(ch.name, 140) && ch.name.trim() && text(ch.role, 500) && text(ch.summary) && text(ch.notes) && text(ch.relations) && text(ch.age, 100) && text(ch.rank, 140) && text(ch.faction, 200) && text(ch.loyalty, 500), 'Ficha de personagem inválida.');
      requireValue(ch.image === '' || !!safeImage(ch.image), 'Imagem de personagem inválida.');
      requireValue(!ch.portrait || !!safeImage(ch.portrait), 'Miniatura de personagem inválida.');
      requireValue(ch.positions && typeof ch.positions === 'object' && !Array.isArray(ch.positions), 'Posições inválidas.');
      for (const [mapId, p] of Object.entries(ch.positions)) requireValue(c.maps.some(m=>m.id===mapId) && p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=100 && p.y>=0 && p.y<=100, 'Coordenada fora do mapa.');
      requireValue(ch.attributes && ATTRIBUTES.every(a=>ch.attributes[a] === null || (Number.isInteger(ch.attributes[a]) && ch.attributes[a]>=0 && ch.attributes[a]<=9999999)), 'Atributos inválidos.');
      requireValue(ch.locationId === '' || c.locations.some(l=>l.id===ch.locationId), 'Localidade de personagem inexistente.');
      requireValue(ch.regionId===''||c.regions.some(r=>r.id===ch.regionId),'Região de personagem inexistente.');
    }

}
