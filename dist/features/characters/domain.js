import {uid} from '../../shared/primitives.js';
export const ATTRIBUTES = ['Força', 'Agilidade', 'Vitalidade', 'Inteligência', 'Destreza'];
export function emptyCharacter() {
  return {id:uid(),name:'',role:'',age:'',rank:'',image:'',summary:'',notes:'',relations:'',faction:'',loyalty:'',locationId:'',regionId:'',positions:{},attributes:Object.fromEntries(ATTRIBUTES.map(a=>[a,null]))};
}
