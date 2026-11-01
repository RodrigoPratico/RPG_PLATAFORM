import {resolveAssetPath} from '../../../shared/asset-paths.generated.js';
/** The supplied Caldris map pack. Boundaries are editable editorial approximations. */
import {assignRegion,regionForLocation} from '../domain.js';
import {pointInPolygon} from '../geometry.js';

const definitions=[
 {id:'caldris-real',name:'Caldris Real e Greymoor',asset:'region-caldris',x:48,y:42,locations:['capital','greymoor','arena'],polygon:[[43,29],[51,26],[60,29],[67,39],[62,47],[61,51],[50,53],[48,63],[38,64],[34,54],[36,47],[39,38]],summary:'Coração político do reino, com 70 mil habitantes protegidos pela barreira seletiva: pessoas circulam, exércitos externos não entram. Monzai e Celine estão no castelo; Pike e Finch sustentam a nova Carta. Oriane, Caedmon e Mallory seguem pela estrada de Greymoor para interceptar Velarde. O Campo do Leão é a arena proposta do próximo capítulo.'},
 {id:'brennford-velmoor',name:'Brennford e Floresta de Velmoor',asset:'region-brennford',x:70,y:46,locations:['brennford','velmoor','trigo'],polygon:[[62,47],[67,39],[76,39],[79,44],[78,50],[74,57],[80,62],[84,73],[80,83],[62,87],[52,82],[48,70],[48,63],[50,53],[61,51]],summary:'A vila de cerca de 40 casas permanece selada por barreira absoluta, sob comando de Lyra Ashvale. Garrick cuida do portão e das rondas. A capela de pedra negra antecede Brennford. Ao sul e oeste, a Floresta de Velmoor guarda o local da descida de Monzai; nos campos de trigo-azulado ainda se vê o sulco da espada de Borin.'},
 {id:'ashen-dunmere',name:'Rio Ashen, Ponte Velha e Dunmere',asset:'region-ashen',x:81,y:53,locations:['ponte','dunmere'],polygon:[[74,47],[79,44],[84,47],[89,52],[84,58],[86,69],[80,62],[74,57],[78,50]],summary:'Corredor do Rio Ashen. A Ponte de Pedra Velha fica a quatro quilômetros de Brennford, com doze passos de largura: foi aqui que o Marquês cedeu. Dunmere é um posto de troca de cavalos e um acampamento registrado do Corvo Negro. Dain e seus homens estão agora na estrada de Caldris; não foram deslocados automaticamente para o antigo acampamento.'},
 {id:'thornwick-marca',name:'Thornwick e Marca Oriental',asset:'region-thornwick',x:92,y:55,locations:['thornwick'],polygon:[[70,29],[90,30],[98,26],[98,65],[86,69],[84,58],[89,52],[90,44],[82,42],[79,44],[76,39],[67,39],[60,29]],summary:'Varrick Thorne governa a Marca e escreve aos quatro duques indecisos. Mathis está livre. A Catedral das Passagens foi entregue sem condições, 1.200 pessoas foram curadas e a Cripta dos Nomes foi esvaziada. O Tribunal foi desfeito; os nomes presentes na ilustração descrevem lugares, não restauram instituições abolidas.'},
 {id:'durnholm-montanhas',name:'Durnholm e Montanhas Cinzas',asset:'region-durnholm',x:75,y:15,locations:['durnholm'],polygon:[[39,6],[95,4],[98,26],[90,30],[70,29],[60,24],[44,25],[38,16]],summary:'Cidade ressuscitada nas Montanhas Cinzas: 8.840 pessoas voltaram à vida. Borin mantém a ordem; Vesk investiga as entidades divinas; Elric enfrenta a crise jurídica dos ressuscitados; Yuki vigia o perímetro. A cidade se reconstrói após a queda da criatura e o fim da cobrança de almas.'},
 {id:'harrow',name:'Terras de Harrow',asset:'region-harrow',x:32,y:22,locations:['harrow'],polygon:[[21,8],[39,6],[44,25],[43,30],[36,32],[26,30],[16,27],[14,18]],summary:'Ducado do noroeste, entre a costa, o Lago de Myr e as Montanhas Cinzas. O Duque Harrow marcha com seis mil homens; seu perfil pessoal permanece desconhecido. O tempo de viagem diverge entre registros e segue como pendência do cânone.'},
 {id:'velarde',name:'Ducado Velarde e Costa das Brumas',asset:'region-velarde',x:25,y:38,locations:['velarde'],polygon:[[16,27],[26,30],[36,32],[39,38],[36,47],[31,50],[21,49],[13,45],[9,36]],summary:'Casa do Duque Velarde, veterano de três guerras e pai de Oriane. Oito mil homens marcham sob seu comando. A filha pretende interceptá-lo em Greymoor com a Carta e testemunhas. O mapa regional mostra o porto, a fortaleza e a costa; a posição do exército é aproximada, não uma localização confirmada em tempo real.'},
 {id:'hallow',name:'Hallow e os Cumes Sangrentos',asset:'region-hallow',x:23,y:60,locations:['hallow'],polygon:[[13,45],[21,49],[31,50],[34,54],[38,64],[31,71],[22,73],[15,67],[10,58]],summary:'Terras tribais independentes e origem de Yuki, entre os Cumes Sangrentos e a Costa Cinzenta. A Revolta de Hallow marcou sua infância e a trajetória de Caedmon. Yuki está atualmente em Durnholm: sua origem não é confundida com sua região atual.'},
 {id:'brandt-ducados',name:'Domínio Brandt e Quatro Ducados',asset:'region-brandt',x:34,y:76,locations:['brandt'],polygon:[[31,71],[38,64],[48,63],[48,70],[52,82],[62,87],[53,92],[37,90],[24,85],[21,78],[22,73]],summary:'Ilsa Brandt, considerada a melhor comandante viva de Caldris, lidera quatro mil homens. Os quatro ducados indecisos aguardam o resultado da disputa. O novo mapa nomeia Sorell, Karth, Meren e Valferio; esses nomes cartográficos ainda não definem aliados, governantes ou decisões na história.'}
];

const worldLocations={capital:[48,42],greymoor:[43,58],arena:[54,34],brennford:[70,46],velmoor:[64,71],trigo:[77,49],ponte:[77,54],dunmere:[83,53],thornwick:[92,55],durnholm:[75,15],harrow:[32,22],velarde:[25,38],hallow:[23,60],brandt:[34,76]};
const points={
 'caldris-real':[['castelo','Castelo Real',49,32],['patio','Pátio Norte',65,30],['trono','Salão do Trono',54,36],['conselho','Praça do Conselho',56,46],['chancelaria','Chancelaria',71,40],['tribunal','Tribunal da Carta',89,46],['arena','Campo do Leão',85,18],['greymoor','Greymoor',51,86]],
 'brennford-velmoor':[['vila','Brennford',62,30],['capela','Capela de Pedra Negra',64,22],['guilda','Filial da Guilda',75,27],['portao','Portão de Garrick',65,38],['trigo','Campos de Trigo-Azulado',86,46],['descida','Clareira da Descida',79,74],['ruinas','Ruínas das Raízes',50,77]],
 'ashen-dunmere':[['ponte','Ponte de Pedra Velha',53,49],['dunmere','Dunmere',82,30],['cavalos','Posto de Troca de Cavalos',87,40],['corvo','Acampamento do Corvo Negro',83,82],['colina','Colina da Vigia',22,19],['vau','Vau das Carroças',86,63]],
 'thornwick-marca':[['torre','Torre do Marquês',55,31],['catedral','Catedral das Passagens',70,42],['praca','Praça dos 1.200',57,50],['cripta','Cripta dos Nomes',84,48],['tribunal','Antigo Tribunal das Passagens',83,58],['patio','Pátio Leste',75,62],['guilda','Guilda Central',58,63],['porto','Porto e Mercado do Sal',67,80]],
 'durnholm-montanhas':[['praca','Praça da Ressurreição',47,41],['salao','Salão das Cinzas',67,41],['casa','Casa dos Oito Mil',75,50],['muralha','Muralha Quebrada',29,47],['portao','Portão do Eco',67,64],['vigia','Torre da Vigília',89,63],['impacto','Vale do Impacto',38,77]],
 harrow:[['cidade','Harrow',35,43],['durin','Fortaleza Durin',56,28],['campo','Campo do Corvo',42,29],['ponte','Ponte de Myr',58,62],['lago','Lago de Myr',63,50],['bosque','Bosque das Sentinelas',24,58]],
 velarde:[['porto','Porto Velarde',40,47],['fortaleza','Fortaleza Velarde',44,18],['doca','Doca do Comércio',47,57],['farol','Farol do Sal',18,64],['vinhedos','Vinhedos Ventosos',86,45],['estrada','Estrada do Sal',77,70]],
 hallow:[['cidade','Hallow',45,53],['cumes','Cumes Sangrentos',40,27],['totem','Totem do Uivo',85,42],['vale','Vale da Matilha',71,29],['rota','Rota dos Clãs',69,55],['porto','Porto das Cinzas',28,56]],
 'brandt-ducados':[['forte','Forte Brandt',46,36],['emissarios','Pátio dos Emissários',33,45],['sorell','Ducado de Sorell',32,72],['karth','Ducado de Karth',46,83],['meren','Ducado de Meren',74,76],['valferio','Ducado de Valferio',89,66],['fronteira','Posto de Fronteira de Sarn',64,52]]
};
const localPositions={momo:[62,32],celine:[67,32],pike:[71,42],finch:[87,45],hale:[53,34],dain:[51,78],oriane:[43,85],caedmon:[48,85],mallory:[53,85],lyra:[60,30],garrick:[65,38],borin:[43,40],vesk:[49,40],elric:[49,47],yuki:[80,57],varrick:[55,30],mathis:[60,34],velarde:[40,47],harrow:[35,43],brandt:[46,36]};

function uniqueId(collection,base) {let id=base,n=2;while(collection.some(item=>item.id===id))id=base+'-'+n++;return id;}
export function installCaldrisAtlas(campaign) {
  const world=campaign.maps.find(map=>map.id==='caldris');
  if(!world||campaign.atlasRevision===2)return;
  const previousId=uniqueId(campaign.maps,'caldris-previous');
  campaign.maps.push({...world,id:previousId,name:world.name+' · mapa anterior',archived:true});
  for(const ch of campaign.characters)if(ch.positions.caldris)ch.positions[previousId]={...ch.positions.caldris};
  world.image='assets/Mapa/Mapa.webp';world.name='Caldris · mapa do reino';
  for(const loc of campaign.locations)if(loc.mapId==='caldris'&&worldLocations[loc.id]){[loc.x,loc.y]=worldLocations[loc.id];}
  for(const data of definitions) {
    const mapId=uniqueId(campaign.maps,'caldris-'+data.id);
    campaign.maps.push({id:mapId,name:data.name,image:resolveAssetPath(`assets/${data.asset}.webp`)});
    const region={id:'region-'+data.id,name:data.name,worldMapId:'caldris',mapId,summary:data.summary,x:data.x,y:data.y,polygon:structuredClone(data.polygon),locationIds:data.locations.filter(id=>campaign.locations.some(l=>l.id===id))};
    campaign.regions.push(region);
    for(const [suffix,name,x,y] of points[data.id]) {
      const id=uniqueId(campaign.locations,`${region.id}-${suffix}`);
      campaign.locations.push({id,name,x,y,mapId,description:'Ponto de referência do mapa regional fornecido. A posição é aproximada; detalhes narrativos podem ser editados pelo mestre.'});
    }
  }
  const locationCounts=new Map();
  for(const ch of campaign.characters) {
    const region=regionForLocation(campaign,ch.locationId);
    if(!region)continue;
    assignRegion(campaign,ch,region.id,{keepLocation:true});
    const loc=campaign.locations.find(l=>l.id===ch.locationId);
    const n=locationCounts.get(ch.locationId)||0;locationCounts.set(ch.locationId,n+1);
    const worldPoint={x:loc.x+(n%3-1)*3,y:loc.y+Math.floor(n/3)*4};
    ch.positions.caldris=pointInPolygon([worldPoint.x,worldPoint.y],region.polygon)?worldPoint:{x:region.x,y:region.y};
    if(localPositions[ch.id]){const [x,y]=localPositions[ch.id];ch.positions[region.mapId]={x,y};}
  }
  const notes=campaign.lore.find(row=>row.id==='l5');
  if(notes)notes.body+='\n\nATLAS REGIONAL\nO mapa do reino e nove mapas regionais foram fornecidos pelo autor. Contornos e posições de marcadores são aproximações editáveis. Os novos nomes de lugares vêm das imagens; isso não confirma novos acontecimentos ou alianças. O mapa anterior permanece arquivado para consulta.';
  campaign.atlasRevision=2;
}
