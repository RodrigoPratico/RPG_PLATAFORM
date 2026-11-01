import {uid} from '../../shared/primitives.js';
export function emptyCampaign(name) {
  return {id:uid(),name,subtitle:'Um novo mundo está esperando.',day:'Dia 1',characters:[],chapters:[],maps:[],regions:[],locations:[],factions:[],threads:[],lore:[],tournament:{rules:'',matches:[]},updatedAt:new Date().toISOString()};
}
