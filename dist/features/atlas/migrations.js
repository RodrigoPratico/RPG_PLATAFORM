const aliases={
 'assets/caldris-world.webp':'assets/Mapa/Mapa.webp',
 'assets/Mapa.webp':'assets/Mapa/Arquivo/Mapa anterior.webp',
 'assets/region-caldris.webp':'assets/Mapa/Regiões/RegiãoCaldrisReal.webp',
 'assets/region-brennford.webp':'assets/Mapa/Regiões/RegiãoBrennford.webp',
 'assets/region-ashen.webp':'assets/Mapa/Regiões/Região Ponte de pedra.webp',
 'assets/region-thornwick.webp':'assets/Mapa/Regiões/Regiãothornwick.webp',
 'assets/region-durnholm.webp':'assets/Mapa/Regiões/RegiãoDurnholm.webp',
 'assets/region-harrow.webp':'assets/Mapa/Regiões/Região Harrow.webp',
 'assets/region-velarde.webp':'assets/Mapa/Regiões/Região Ducato Valarde.webp',
 'assets/region-hallow.webp':'assets/Mapa/Regiões/RegiãoHallow.webp',
 'assets/region-brandt.webp':'assets/Mapa/Regiões/RegiãoBrandt.webp'
};
export function upgradeAtlasAssets(campaign){let changed=false;for(const map of campaign.maps)if(aliases[map.image]){map.image=aliases[map.image];changed=true;}return changed;}
