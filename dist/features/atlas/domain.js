import {clamp} from '../../shared/primitives.js';
import {pointInPolygon,polygonArea} from './geometry.js';

export const mapRegion=(campaign,mapId)=>campaign.regions.find(r=>r.mapId===mapId);
/** Deepest region first, guarded against malformed cycles. */
export function regionTrail(campaign,id) {
 const result=[],seen=new Set();let current=campaign.regions.find(r=>r.id===id);
 while(current){if(seen.has(current.id))throw new Error('Ciclo entre mapas regionais.');seen.add(current.id);result.push(current);current=mapRegion(campaign,current.worldMapId);}
 return result;
}
export const belongsToRegion=(campaign,character,id)=>regionTrail(campaign,character.regionId).some(r=>r.id===id);
export const regionMembers=(campaign,id)=>campaign.characters.filter(ch=>belongsToRegion(campaign,ch,id));
export const regionLabel=(campaign,id)=>regionTrail(campaign,id).reverse().map(r=>r.name).join(' / ');
export function mapTrail(campaign,mapId) {
 const region=mapRegion(campaign,mapId);const regions=region?regionTrail(campaign,region.id).reverse():[];
 const ids=regions.length?[regions[0].worldMapId,...regions.map(r=>r.mapId)]:[mapId];
 return ids.map(id=>campaign.maps.find(m=>m.id===id)).filter(Boolean);
}
export function regionForLocation(campaign,locationId) {
 const location=campaign.locations.find(l=>l.id===locationId);
 const explicit=campaign.regions.filter(r=>r.locationIds.includes(locationId)).sort((a,b)=>regionTrail(campaign,b.id).length-regionTrail(campaign,a.id).length)[0];
 return explicit||(location?mapRegion(campaign,location.mapId):undefined);
}
export function regionAtPoint(campaign,mapId,point) {
 return campaign.regions.filter(r=>r.worldMapId===mapId&&pointInPolygon([point.x,point.y],r.polygon)).sort((a,b)=>polygonArea(a.polygon)-polygonArea(b.polygon)||a.id.localeCompare(b.id))[0];
}
export function mapCharacters(campaign,mapId) {
 const region=mapRegion(campaign,mapId);
 return campaign.characters.filter(ch=>ch.positions[mapId]&&(!region||belongsToRegion(campaign,ch,region.id)));
}
/** Keep the current local marker and its ancestors; discard sibling markers. */
export function assignRegion(campaign,character,regionId,{worldPosition,keepLocation=false}={}) {
 const region=campaign.regions.find(r=>r.id===regionId);
 if(regionId&&!region)throw new Error('Região não encontrada.');
 const oldTrail=regionTrail(campaign,character.regionId),nextTrail=region?regionTrail(campaign,region.id):[];
 const oldIds=new Set(oldTrail.map(r=>r.id)),allowed=new Set(nextTrail.flatMap(r=>[r.mapId,r.worldMapId]));
 const changed=character.regionId!==(region?.id||'');
 for(const other of campaign.regions)if(!allowed.has(other.mapId))delete character.positions[other.mapId];
 if(!region){if(changed)for(const r of campaign.regions)delete character.positions[r.worldMapId];character.regionId='';if(!keepLocation)character.locationId='';return;}
 character.regionId=region.id;
 if(changed&&!keepLocation)character.locationId=region.locationIds[0]||'';
 for(const ancestor of nextTrail)if(!character.positions[ancestor.worldMapId]||(changed&&!oldIds.has(ancestor.id)))character.positions[ancestor.worldMapId]={x:ancestor.x,y:ancestor.y};
 const n=regionMembers(campaign,region.id).filter(ch=>ch.id!==character.id).length;
 if(!character.positions[region.mapId])character.positions[region.mapId]={x:clamp(42+(n%4)*6),y:clamp(40+Math.floor(n/4)*7)};
 if(worldPosition)character.positions[region.worldMapId]={...worldPosition};
}
export function positionAtLocation(campaign,character,locationId) {
 character.locationId=locationId;const loc=campaign.locations.find(l=>l.id===locationId);
 if(loc){const n=campaign.characters.filter(ch=>ch.id!==character.id&&ch.locationId===locationId).length;character.positions[loc.mapId]={x:clamp(loc.x+(n%3-1)*3.2),y:clamp(loc.y+Math.floor(n/3)*5)};}
}
export function positionCharacterAtLocation(campaign,character,locationId) {
 const region=regionForLocation(campaign,locationId);if(region)assignRegion(campaign,character,region.id,{keepLocation:true});
 positionAtLocation(campaign,character,locationId);
}
export function moveCharacter(campaign,id,mapId,point) {
 const ch=campaign.characters.find(c=>c.id===id);if(!ch)throw new Error('Personagem não encontrado.');
 if(!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new Error('Coordenada inválida.');
 const position={x:clamp(point.x),y:clamp(point.y)},child=regionAtPoint(campaign,mapId,position),local=mapRegion(campaign,mapId);
 if(child)assignRegion(campaign,ch,child.id,{worldPosition:position});
 else if(local)assignRegion(campaign,ch,local.id);
 else if(campaign.regions.some(r=>r.worldMapId===mapId))throw new Error('Solte o personagem dentro de uma região. Para deixá-lo sem paradeiro, edite a ficha.');
 ch.positions[mapId]=position;
}
/** Removing a parent removes descendant connections, retaining maps and records. */
export function removeRegion(campaign,id) {
 const removed=campaign.regions.find(r=>r.id===id);if(!removed)return;
 const parent=mapRegion(campaign,removed.worldMapId),ids=new Set(campaign.regions.filter(r=>regionTrail(campaign,r.id).some(a=>a.id===id)).map(r=>r.id));
 for(const ch of campaign.characters)if(ids.has(ch.regionId)){
  for(const r of campaign.regions)if(ids.has(r.id))delete ch.positions[r.mapId];
  ch.regionId=parent?.id||'';if(parent)assignRegion(campaign,ch,parent.id,{keepLocation:true});
 }
 campaign.regions=campaign.regions.filter(r=>!ids.has(r.id));
}
