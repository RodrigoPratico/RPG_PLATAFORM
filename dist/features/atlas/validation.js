import {text,requireValue,list} from '../../shared/validation.js';
import {safeImage} from '../../shared/assets.js';
import {validPolygon,pointInPolygon} from './geometry.js';
export function validateAtlas(c) {
for(const key of ['maps','regions','locations'])list(c[key],key);
    for (const m of c.maps) requireValue(text(m.name, 140) && !!safeImage(m.image), 'Imagem ou nome de mapa inválido.');
    const linkedMaps=new Set();
    for(const region of c.regions) {
      requireValue(region.kind===undefined||['region','subregion'].includes(region.kind),'Tipo de região inválido.');
      requireValue(region.assetKey===undefined||text(region.assetKey,100),'Identificador de imagem inválido.');
      requireValue(text(region.name,140)&&region.name.trim()&&text(region.summary), 'Nome ou resumo de região inválido.');
      requireValue(c.maps.some(m=>m.id===region.worldMapId)&&c.maps.some(m=>m.id===region.mapId)&&region.mapId!==region.worldMapId&&!linkedMaps.has(region.mapId), 'Ligação de mapas da região inválida.');
      linkedMaps.add(region.mapId);
      requireValue(validPolygon(region.polygon), 'Contorno de região inválido: use 3 a 80 pontos sem cruzamentos.');
      requireValue(Number.isFinite(region.x)&&Number.isFinite(region.y)&&pointInPolygon([region.x,region.y],region.polygon), 'Ponto central da região fora do contorno.');
      requireValue(Array.isArray(region.locationIds)&&region.locationIds.length<=5000&&new Set(region.locationIds).size===region.locationIds.length&&region.locationIds.every(id=>c.locations.some(l=>l.id===id&&(l.mapId===region.worldMapId||l.mapId===region.mapId))), 'Locais vinculados à região inválidos.');
    }
    for(const region of c.regions) {
      const seen=new Set([region.mapId]);let current=region.worldMapId;
      while(current){requireValue(!seen.has(current),'Ciclo entre mapas regionais.');seen.add(current);current=c.regions.find(r=>r.mapId===current)?.worldMapId;}
    }

    for (const row of c.locations) requireValue(text(row.name, 140) && text(row.description) && c.maps.some(m=>m.id===row.mapId) && Number.isFinite(row.x) && Number.isFinite(row.y) && row.x>=0 && row.x<=100 && row.y>=0 && row.y<=100, 'Localidade inválida.');
}
