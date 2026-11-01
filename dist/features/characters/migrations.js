const names=['Borin','Celina','Elric','Lyra','MOnzai','SirCaedmon','Varrick','Vesk','Yuki'];
export function upgradeCharacterAssets(campaign) {
 let changed=false;
 for(const ch of campaign.characters)for(const name of names){
  if(ch.image==='assets/'+name+'.webp'){ch.image='assets/Cards/'+name+'.webp';changed=true;}
  if(ch.portrait==='assets/'+name+'-portrait.webp'){ch.portrait='assets/Cards/Miniaturas/'+name+'.webp';changed=true;}
 }
 return changed;
}
