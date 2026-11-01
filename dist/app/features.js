// Explicit, local feature composition. Remove an optional registration to omit its UI.
import {createAtlasFeature} from '../features/atlas/index.js';
import {createCharactersFeature} from '../features/characters/index.js';
import {createChaptersFeature} from '../features/chapters/index.js';
import {createRecordsFeature} from '../features/records/index.js';
import {createTournamentFeature} from '../features/tournament/index.js';
import {createCampaignsFeature} from '../features/campaigns/index.js';
import {createBackupsFeature} from '../features/backups/index.js';
export const featureFactories=[createAtlasFeature,createCharactersFeature,createChaptersFeature,createRecordsFeature,createTournamentFeature,createCampaignsFeature,createBackupsFeature];
export function installFeatures(registry,context,factories=featureFactories){for(const create of factories)registry.register(create(context));}
