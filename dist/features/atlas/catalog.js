import {clamp} from '../../shared/primitives.js';
import {safeImage} from '../../shared/assets.js';
import {regionForLocation,assignRegion} from './domain.js';

const normalized=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/** Merge newly committed scenes. Saved edits and deliberately deleted connections survive. */
export function mergeSceneCatalog(campaign,catalog) {
 if(!campaign.regions?.length||!catalog?.entries?.length)return false;
 let changed=false;const applied=new Set(campaign.catalogApplied||[]);
 for(const entry of catalog.entries){
  if(applied.has(entry.key)||!entry.parentRegionId)continue;
  const parent=campaign.regions.find(r=>r.id===entry.parentRegionId);if(!parent)continue;
  if(!safeImage(entry.image))throw new Error('Caminho de imagem inválido no catálogo.');
  const regionId='subregion-'+entry.key,mapId='submap-'+entry.key;
  if(campaign.regions.some(r=>r.id===regionId)||campaign.maps.some(m=>m.id===mapId))throw new Error('Identificador do catálogo já utilizado: '+entry.key);
  let loc=campaign.locations.find(l=>l.mapId===parent.mapId&&(l.id===entry.locationId||normalized(l.name)===normalized(entry.name)));
  const count=campaign.regions.filter(r=>r.worldMapId===parent.mapId).length;
  const x=clamp(loc?.x??entry.x??(20+(count%4)*20),4,96),y=clamp(loc?.y??entry.y??(25+Math.floor(count/4)*18),4,96);
  if(!loc){
   const id=entry.locationId||'local-'+entry.key;if(campaign.locations.some(l=>l.id===id))throw new Error('Localidade do catálogo já utilizada: '+id);
   loc={id,name:entry.name,mapId:parent.mapId,x,y,description:entry.summary||'Local ilustrado fornecido pelo mestre. Posição aproximada e editável.'};campaign.locations.push(loc);
  }
  const polygon=[[x-3,y-3],[x+3,y-3],[x+3,y+3],[x-3,y+3]];
  campaign.maps.push({id:mapId,name:entry.group+' · '+entry.name,image:entry.image});
  campaign.regions.push({id:regionId,name:entry.name,summary:entry.summary||loc.description,kind:'subregion',assetKey:entry.key,worldMapId:parent.mapId,mapId,polygon,x,y,locationIds:[loc.id]});
  for(const character of campaign.characters)if(character.locationId===loc.id&&regionForLocation(campaign,loc.id)?.id===regionId){
   const worldPosition=character.positions[parent.mapId];
   assignRegion(campaign,character,regionId,{keepLocation:true,worldPosition});
  }
  applied.add(entry.key);changed=true;
 }
 if(changed)campaign.catalogApplied=[...applied];
 return changed;
}
