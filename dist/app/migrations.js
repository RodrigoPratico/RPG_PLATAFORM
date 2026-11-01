import {SCHEMA_VERSION,validateState} from './schema.js';
import {clone} from '../shared/primitives.js';
import {installCaldrisAtlas} from '../features/atlas/data/caldris.js';
import {upgradeAtlasAssets} from '../features/atlas/migrations.js';
import {upgradeCharacterAssets} from '../features/characters/migrations.js';
import {mergeSceneCatalog} from '../features/atlas/catalog.js';
import {sceneCatalog} from '../features/atlas/data/catalog.generated.js';

/** Upgrades run on a copy; the repository remains untouched until its atomic save. */
export function upgradeState(input,catalog=sceneCatalog) {
 if(!input||![1,2,SCHEMA_VERSION].includes(input.schemaVersion))throw new Error('Versão de arquivo incompatível. São aceitos backups 1, 2 e 3.');
 const next=clone(input);let changed=input.schemaVersion!==SCHEMA_VERSION;
 if(!Array.isArray(next.campaigns))throw new Error('Lista de campanhas inválida.');
 for(const c of next.campaigns){
  if(!Array.isArray(c.characters)||!Array.isArray(c.maps)||!Array.isArray(c.locations))throw new Error('Campanha inválida para atualização.');
  if(input.schemaVersion===1){c.regions=[];for(const ch of c.characters)ch.regionId='';if(c.id==='voz-que-devolve')installCaldrisAtlas(c);}
  changed=upgradeAtlasAssets(c)||changed;changed=upgradeCharacterAssets(c)||changed;
 }
 next.schemaVersion=SCHEMA_VERSION;
 // Validate the imported graph before resolving ancestors or merging asset data.
 validateState(next);
 for(const c of next.campaigns)changed=mergeSceneCatalog(c,catalog)||changed;
 return {state:validateState(next),changed};
}
export const migrateState=input=>upgradeState(input).state;
