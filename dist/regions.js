import {clamp,positionAtLocation} from './model.js';
import {pointInPolygon,polygonArea} from './geometry.js';

export const mapRegion=(campaign,mapId)=>campaign.regions.find(r=>r.mapId===mapId);
export const regionMembers=(campaign,id)=>campaign.characters.filter(ch=>ch.regionId===id);
export function regionForLocation(campaign,locationId) {
  const location=campaign.locations.find(l=>l.id===locationId);
  return campaign.regions.find(r=>r.locationIds.includes(locationId)) || (location?mapRegion(campaign,location.mapId):undefined);
}
export function regionAtPoint(campaign,mapId,point) {
  // Smaller regions win in overlaps, e.g. the Ashen corridor within the Marca.
  return campaign.regions.filter(r=>r.worldMapId===mapId&&pointInPolygon([point.x,point.y],r.polygon)).sort((a,b)=>polygonArea(a.polygon)-polygonArea(b.polygon)||a.id.localeCompare(b.id))[0];
}
export function mapCharacters(campaign,mapId) {
  const region=mapRegion(campaign,mapId);
  return campaign.characters.filter(ch=>ch.positions[mapId] && (!region||ch.regionId===region.id));
}
/** A character belongs to one current region; old regional markers cannot leak. */
export function assignRegion(campaign,character,regionId,{worldPosition,keepLocation=false}={}) {
  const region=campaign.regions.find(r=>r.id===regionId);
  const changed=character.regionId!==(region?.id||'');
  for(const other of campaign.regions)if(other.id!==region?.id)delete character.positions[other.mapId];
  character.regionId=region?.id||'';
  if(!region) {
    if(changed)for(const mapId of new Set(campaign.regions.map(r=>r.worldMapId)))delete character.positions[mapId];
    if(!keepLocation)character.locationId='';
    return;
  }
  if(changed&&!keepLocation)character.locationId=region.locationIds[0]||'';
  const n=regionMembers(campaign,region.id).filter(ch=>ch.id!==character.id).length;
  if(worldPosition)character.positions[region.worldMapId]={...worldPosition};
  else if(changed||!character.positions[region.worldMapId])character.positions[region.worldMapId]={x:region.x,y:region.y};
  if(!character.positions[region.mapId])character.positions[region.mapId]={x:clamp(42+(n%4)*6),y:clamp(40+Math.floor(n/4)*7)};
}
export function positionCharacterAtLocation(campaign,character,locationId) {
  const region=regionForLocation(campaign,locationId);
  if(region)assignRegion(campaign,character,region.id,{keepLocation:true});
  positionAtLocation(campaign,character,locationId);
}
export function moveCharacter(campaign,id,mapId,point) {
  const character=campaign.characters.find(ch=>ch.id===id);
  if(!character)throw new Error('Personagem não encontrado.');
  const position={x:clamp(point.x),y:clamp(point.y)};
  const local=mapRegion(campaign,mapId);
  if(local)assignRegion(campaign,character,local.id);
  else if(campaign.regions.some(r=>r.worldMapId===mapId)) {
    const region=regionAtPoint(campaign,mapId,position);
    if(!region)throw new Error('Solte o personagem dentro de uma região. Para deixá-lo sem paradeiro, edite a ficha.');
    assignRegion(campaign,character,region.id,{worldPosition:position});
  }
  character.positions[mapId]=position;
}
export function removeRegion(campaign,id) {
  const removed=campaign.regions.find(r=>r.id===id);
  if(!removed)return;
  for(const ch of campaign.characters)if(ch.regionId===id){ch.regionId='';delete ch.positions[removed.mapId];}
  campaign.regions=campaign.regions.filter(r=>r.id!==id);
}
