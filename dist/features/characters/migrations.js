import {resolveAssetPath} from '../../shared/asset-paths.generated.js';
export function upgradeCharacterAssets(campaign) {
 let changed=false;
 for(const character of campaign.characters)for(const field of ['image','portrait']){
  const image=resolveAssetPath(character[field]);if(image!==character[field]){character[field]=image;changed=true;}
 }
 return changed;
}
