import {SCHEMA_VERSION} from '../shared/schema-version.js';
import {list,requireValue} from '../shared/validation.js';
import {validateCampaign} from '../features/campaigns/validation.js';
import {validateAtlas} from '../features/atlas/validation.js';
import {validateCharacters} from '../features/characters/validation.js';
import {validateChapters} from '../features/chapters/validation.js';
import {validateRecords} from '../features/records/validation.js';
import {validateTournament} from '../features/tournament/validation.js';
export {SCHEMA_VERSION};
export const campaignValidators=[validateCampaign,validateAtlas,validateCharacters,validateChapters,validateRecords,validateTournament];
/** Validate the aggregate before persistence. Validators do not depend on the browser. */
export function validateState(state,validators=campaignValidators) {
 requireValue(state&&state.schemaVersion===SCHEMA_VERSION,'Versão de arquivo incompatível. Esperado: '+SCHEMA_VERSION+'.');
 requireValue(Number.isSafeInteger(state.revision)&&state.revision>=0,'Revisão de arquivo inválida.');
 list(state.campaigns,'campanhas',100);requireValue(state.campaigns.length>0,'É necessário ter uma campanha.');
 for(const c of state.campaigns)for(const validate of validators)validate(c);
 return state;
}
