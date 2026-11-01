import {resolveAssetPath} from '../../shared/asset-paths.generated.js';
export function upgradeAtlasAssets(campaign) {
 let changed=false;
 for(const map of campaign.maps){const image=resolveAssetPath(map.image);if(image!==map.image){map.image=image;changed=true;}}
 return changed;
}
