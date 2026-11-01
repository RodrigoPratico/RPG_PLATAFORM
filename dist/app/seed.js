import {baselineState} from '../features/campaigns/data/caldris.js';
import {migrateState} from './migrations.js';
export const seedState=()=>migrateState(baselineState());
