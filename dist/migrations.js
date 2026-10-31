import {SCHEMA_VERSION,clone,validateState} from './model.js';
import {installCaldrisAtlas} from './atlas-data.js';

/** Migrate a copy; never mutate a browser database or backup before validation. */
export function migrateState(input) {
  if(!input||![1,SCHEMA_VERSION].includes(input.schemaVersion))throw new Error('Versão de arquivo incompatível. São aceitos backups 1 e 2.');
  if(input.schemaVersion===SCHEMA_VERSION)return validateState(clone(input));
  const next=clone(input);
  if(!Array.isArray(next.campaigns))throw new Error('Lista de campanhas inválida.');
  for(const c of next.campaigns) {
    if(!Array.isArray(c.characters)||!Array.isArray(c.maps)||!Array.isArray(c.locations))throw new Error('Campanha inválida para atualização.');
    c.regions=[];
    for(const ch of c.characters)ch.regionId='';
    if(c.id==='voz-que-devolve')installCaldrisAtlas(c);
  }
  next.schemaVersion=SCHEMA_VERSION;
  return validateState(next);
}
