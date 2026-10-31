import {ATTRIBUTES,SCHEMA_VERSION,uid,clone,clamp,escapeHTML as e,validateState,emptyCampaign,emptyCharacter,removeCharacter,positionAtLocation} from './model.js';
import {CampaignRepository,readImage,logError} from './repository.js';
import {seedState} from './seed.js';
import {$,$$,icon,avatar,field,selectField,fileField,badge,download} from './ui.js';
import {ROUTES,atlas,characterView,chapterView,recordView,tournamentView,settingsView} from './views.js';
import {bindMap} from './map.js';

const repository=new CampaignRepository();
let state,activeCampaignId='',busy=false,dirty=false;
const ui={mapId:'',selectedId:'momo',chapterId:'ch4',zoom:1,showLocations:false,showCharacters:true,query:''};
let activeRoute='mapa';
let toastTimer;
function campaign(){return state.campaigns.find(c=>c.id===activeCampaignId)||state.campaigns[0];}
function toast(message,error=false){const el=$('#toast');clearTimeout(toastTimer);el.textContent=message;el.className=error?'show error':'show';toastTimer=setTimeout(()=>el.className='',error?10000:4500);}
function report(err){logError('operation_failed',err);toast(err.message||'Não foi possível concluir a operação.',true);}
function safely(fn){return (...args)=>Promise.resolve().then(()=>fn(...args)).catch(report);}
function status(message,error=false){$('#save-state').textContent=message;$('#save-state').classList.toggle('save-error',error);}
/** Save a validated candidate first; publish it to the UI only on successful commit. */
async function commit(description,mutate,{rerender=true}={}){
 if(busy)throw new Error('Uma gravação está em andamento. Aguarde um instante.');
 busy=true;status('Salvando…');const priorCampaignId=activeCampaignId;
 try{
  const next=clone(state); const c=next.campaigns.find(v=>v.id===campaign().id);
  await mutate(c,next);
  c.updatedAt=new Date().toISOString();c.history=[...(c.history||[]),{date:c.updatedAt,description}].slice(-60);
  validateState(next);
  next.revision=await repository.save(next,state.revision);state=next;
  status('● Salvo neste navegador');
  channel?.postMessage({revision:state.revision});
  if(rerender)render();
 }catch(err){activeCampaignId=priorCampaignId;status('Falha ao salvar · alterações não gravadas',true);throw err;}finally{busy=false;}
}
let channel;
function render(){
 const c=campaign();activeCampaignId=c.id;
 if(!c.maps.some(m=>m.id===ui.mapId))ui.mapId=c.maps[0]?.id||'';
 activeRoute=location.hash.slice(1)||'mapa';if(!ROUTES.some(r=>r[0]===activeRoute))activeRoute='mapa';
 $('#campaign-select').innerHTML=state.campaigns.map(v=>`<option value="${e(v.id)}" ${v.id===c.id?'selected':''}>${e(v.name)}</option>`).join('');
 $('#nav').innerHTML=ROUTES.map(([id,title,ic],i)=>`${i===7?'<div class="nav-separator"></div>':''}<a href="#${id}" ${activeRoute===id?'aria-current="page"':''} class="${activeRoute===id?'active':''}">${icon(ic)}<span>${title}</span>${id==='personagens'?`<small>${c.characters.length}</small>`:id==='capitulos'?`<small>${c.chapters.length}</small>`:''}</a>`).join('');
 $('#breadcrumb').textContent=`${c.name} / ${ROUTES.find(r=>r[0]===activeRoute)[1]}`;
 $('#hover-card').hidden=true;
 const renderers={mapa:()=>atlas(c,ui),personagens:()=>characterView(c,ui.query),capitulos:()=>chapterView(c,ui.chapterId),compendio:()=>recordView(c,'lore',ui.query),faccoes:()=>recordView(c,'factions',ui.query),tramas:()=>recordView(c,'threads',ui.query),campeonato:()=>tournamentView(c),universo:()=>settingsView(c,state)};
 $('#main').innerHTML=renderers[activeRoute]();
 $('#filter')?.addEventListener('input',ev=>{const value=ev.target.value;ui.query=value;render();const input=$('#filter');input.focus();input.setSelectionRange(value.length,value.length);});
 if(activeRoute==='mapa')bindMap({campaign:c,mapId:ui.mapId,onSelect:id=>{ui.selectedId=id;render();if(innerWidth<=1000)showCharacter(id);},onMove:(id,p)=>commit(`Posição de ${c.characters.find(ch=>ch.id===id).name} ajustada`,next=>{next.characters.find(ch=>ch.id===id).positions[ui.mapId]=p;},{rerender:false}).then(()=>{c.characters.find(ch=>ch.id===id).positions[ui.mapId]=p;const token=$(`.map-token[data-character="${CSS.escape(id)}"]`);if(token){token.style.left=p.x+'%';token.style.top=p.y+'%';}}),onLocation:showLocation,onMap:id=>{ui.mapId=id;ui.zoom=1;render();},onZoom:direction=>{ui.zoom=direction==='fit'?1:clamp(ui.zoom+(direction==='in'?0.25:-0.25),1,3);render();},onToggles:(key,v)=>{ui[key]=v;render();},report});
 if(activeRoute==='universo')storageInfo().catch(()=>{});
}

function formDialog(title,body,onSave,{onDelete=null,wide=false,submit='Salvar alterações'}={}){
 const dialog=$('#editor');if(dialog.open)dialog.close();dirty=false;
 $('#dialog-content').innerHTML=`<form id="edit-form"><header class="dialog-header"><div><span class="eyebrow">ARQUIVOS DA CAMPANHA</span><h2>${e(title)}</h2></div><button type="button" class="quiet close-dialog" aria-label="Fechar">×</button></header><div class="dialog-body">${body}</div><footer class="dialog-footer"><div>${onDelete?'<button type="button" id="delete-record" class="danger-text quiet">Excluir registro</button>':''}<small id="dirty-indicator">Preencha e salve para gravar.</small></div><div><button type="button" class="close-dialog">Cancelar</button><button type="submit" class="primary">${e(submit)}</button></div></footer><p class="form-error" role="alert" id="form-error"></p></form>`;
 dialog.classList.toggle('wide-dialog',wide);dialog.showModal();
 $('#edit-form').addEventListener('input',()=>{dirty=true;$('#dirty-indicator').textContent='Alterações ainda não salvas';});
 $('#edit-form').addEventListener('submit',async ev=>{
  ev.preventDefault();const button=$('[type=submit]',ev.target);button.disabled=true;$('#form-error').textContent='';
  try{const result=await onSave(new FormData(ev.target));if(result===false)return;dirty=false;dialog.close();toast('Registro salvo.');}catch(err){$('#form-error').textContent=err.message;report(err);}finally{button.disabled=false;}
 });
 $('#delete-record')?.addEventListener('click',safely(async()=>{if(!confirm('Excluir este registro? A gravação anterior ficará disponível para restauração.'))return;await onDelete();dirty=false;dialog.close();toast('Registro excluído.');}));
}
function readDialog(title,body){const dialog=$('#editor');if(dialog.open)dialog.close();dirty=false;dialog.classList.add('wide-dialog');$('#dialog-content').innerHTML=`<header class="dialog-header"><div><span class="eyebrow">ARQUIVOS DA CAMPANHA</span><h2>${e(title)}</h2></div><button class="quiet close-dialog" aria-label="Fechar">×</button></header><div class="dialog-body">${body}</div>`;dialog.showModal();}
function closeDialog(){if(dirty&&!confirm('Descartar as alterações não salvas?'))return;dirty=false;$('#editor').close();}
function value(data,name,max=200000,required=false){const v=String(data.get(name)||'').trim();if(v.length>max)throw new Error(`Campo ${name} excede o limite de ${max} caracteres.`);if(required&&!v)throw new Error('Preencha todos os campos obrigatórios.');return v;}
const locOptions=()=>[['','Local não informado'],...campaign().locations.map(l=>[l.id,l.name])];
const mapOptions=()=>campaign().maps.map(m=>[m.id,m.name]);

function editCharacter(id){
 const existing=campaign().characters.find(ch=>ch.id===id);const ch=clone(existing||emptyCharacter());
 const attrs=ATTRIBUTES.map(a=>field(a,`attr-${a}`,ch.attributes[a]??'',{type:'number'})).join('');
 const body=`<div class="form-two">${field('Nome *','name',ch.name,{required:true,max:140})}${field('Função','role',ch.role,{max:500})}${field('Idade / anotação','age',ch.age,{max:100})}${field('Rank / registro público','rank',ch.rank,{max:140})}${selectField('Local atual','locationId',ch.locationId,locOptions())}${field('Facção','faction',ch.faction,{max:200})}</div>${fileField(ch.image?'Substituir imagem (opcional)':'Imagem da ficha','image')}${ch.image?'<p class="muted">A imagem atual será mantida se nenhum arquivo for selecionado.</p>':''}<div class="form-two">${field('Lealdade','loyalty',ch.loyalty,{max:500})}${selectField('Posicionar também no mapa','pinMapId','',[['','Manter posições / não adicionar'],...mapOptions()])}</div><p class="muted">Escolher um local posiciona a ficha perto dele. Mover livremente no atlas altera só as coordenadas, não o local escrito.</p><div class="attribute-form">${attrs}</div><small class="muted">Campo vazio = desconhecido. Até 9.999.999; não inferimos atributos não informados.</small>${field('Resumo e história','summary',ch.summary,{type:'textarea',rows:8})}${field('Relações e contexto','relations',ch.relations,{type:'textarea',rows:3})}${field('Notas do mestre','notes',ch.notes,{type:'textarea',rows:3})}`;
 formDialog(existing?'Editar personagem':'Novo personagem',body,async data=>{
   const image=data.get('image');const updated={...ch,name:value(data,'name',140,true),role:value(data,'role',500),age:value(data,'age',100),rank:value(data,'rank',140),locationId:value(data,'locationId',100),faction:value(data,'faction',200),loyalty:value(data,'loyalty',500),summary:value(data,'summary'),relations:value(data,'relations'),notes:value(data,'notes')};
   for(const a of ATTRIBUTES){const v=value(data,`attr-${a}`,10);updated.attributes[a]=v===''?null:Number(v);}
   if(image?.size){updated.image=await readImage(image);updated.portrait='';}
   await commit(`Ficha de ${updated.name} ${existing?'atualizada':'criada'}`,c=>{
    if(existing)c.characters[c.characters.findIndex(v=>v.id===ch.id)]=updated;else c.characters.push(updated);
    if(updated.locationId!==ch.locationId)positionAtLocation(c,updated,updated.locationId);
    const mid=value(data,'pinMapId',100);if(mid&&!updated.positions[mid])updated.positions[mid]={x:50,y:50};
   });ui.selectedId=updated.id;
 },{wide:true,onDelete:existing?()=>commit(`Personagem ${ch.name} excluído`,c=>removeCharacter(c,ch.id)):null});
}
function showCharacter(id){
 const c=campaign(),ch=c.characters.find(v=>v.id===id);if(!ch)return;
 readDialog(ch.name,`<div class="full-character"><div>${ch.image?`<a href="${e(ch.image)}" target="_blank" rel="noopener" title="Abrir imagem inteira">${avatar(ch,'full-card')}</a>`:avatar(ch,'full-card')}<p class="muted">${ch.image?'Clique na ficha para ampliar a imagem original.':'Retrato ainda não fornecido.'}</p></div><div><div class="section-line">${badge(ch.role||'Personagem')}<button data-edit-character="${e(id)}">Editar ficha</button></div><p class="location-line">${icon('pin')}${e(c.locations.find(l=>l.id===ch.locationId)?.name||'Local desconhecido')}</p><dl class="facts"><dt>Idade</dt><dd>${e(ch.age||'Não informada')}</dd><dt>Rank</dt><dd>${e(ch.rank||'Não informado')}</dd><dt>Facção</dt><dd>${e(ch.faction||'Não informada')}</dd><dt>Lealdade</dt><dd>${e(ch.loyalty||'Não registrada')}</dd></dl><div class="attribute-display">${ATTRIBUTES.map(a=>`<div><small>${e(a)}</small><strong>${ch.attributes[a]===null?'?':ch.attributes[a].toLocaleString('pt-BR')}</strong></div>`).join('')}</div><h3>História e estado atual</h3><div class="prose">${e(ch.summary||'Sem resumo.')}</div><h3>Relações</h3><div class="prose">${e(ch.relations||'Nenhuma relação registrada.')}</div>${ch.notes?`<h3>Notas do mestre</h3><div class="prose master-note">${e(ch.notes)}</div>`:''}<h3>Capítulos vinculados</h3>${c.chapters.filter(v=>v.characterIds.includes(id)).map(v=>`<button class="chapter-link" data-chapter="${e(v.id)}">${icon('book')}${e(v.title)}</button>`).join('')||'<p class="muted">Ainda sem capítulos vinculados.</p>'}<div class="button-row"><button data-locate-character="${e(id)}">Ver no atlas</button><button class="quiet" data-remove-pin="${e(id)}">Retirar do mapa ativo</button></div></div></div>`);
}
function editChapter(id){
 const old=campaign().chapters.find(v=>v.id===id);const ch=clone(old||{id:uid(),title:'',period:'',status:'Rascunho',body:'',characterIds:[]});
 formDialog(old?'Editar capítulo':'Novo capítulo',`${field('Título *','title',ch.title,{required:true,max:200})}<div class="form-two">${field('Período na história','period',ch.period,{max:100})}${selectField('Estado','status',ch.status,['Rascunho','Em andamento','Concluído'].map(v=>[v,v]))}</div>${field('Texto do capítulo','body',ch.body,{type:'textarea',rows:18})}<fieldset class="character-checks"><legend>Vincular personagens</legend>${campaign().characters.map(v=>`<label><input type="checkbox" name="characters" value="${e(v.id)}" ${ch.characterIds.includes(v.id)?'checked':''}>${e(v.name)}</label>`).join('')}</fieldset>`,async data=>{
  const updated={...ch,title:value(data,'title',200,true),period:value(data,'period',100),status:value(data,'status',100),body:value(data,'body'),characterIds:data.getAll('characters')};
  ui.chapterId=ch.id;await commit(`Capítulo ${updated.title} salvo`,c=>{if(old)c.chapters[c.chapters.findIndex(v=>v.id===id)]=updated;else c.chapters.push(updated);});
 },{wide:true,onDelete:old?()=>commit(`Capítulo ${ch.title} excluído`,c=>{c.chapters=c.chapters.filter(v=>v.id!==id);}):null});
}
function editRecord(key,id){
 const old=campaign()[key].find(v=>v.id===id);const row=old||{id:uid(),title:'',status:key==='lore'?'Cânone':'Em andamento',body:''};
 const label={lore:'registro do compêndio',threads:'trama',factions:'facção'}[key];
 formDialog(`Editar ${label}`,`${field('Título *','title',row.title,{required:true,max:200})}${field('Estado / categoria','status',row.status,{max:100})}${field('Conteúdo e contexto','body',row.body,{type:'textarea',rows:13})}${key==='threads'?'<p class="muted">Use o estado “Resolvido” para retirar esta trama da contagem de pendências.</p>':''}`,async data=>{const updated={...row,title:value(data,'title',200,true),status:value(data,'status',100),body:value(data,'body')};await commit(`${updated.title} atualizado`,c=>{if(old)c[key][c[key].findIndex(v=>v.id===row.id)]=updated;else c[key].push(updated);});},{wide:true,onDelete:old?()=>commit(`${row.title} excluído`,c=>{c[key]=c[key].filter(v=>v.id!==row.id);}):null});
}
function editCampaign(isNew=false){
 const c=isNew?emptyCampaign(''):campaign();
 formDialog(isNew?'Nova campanha':'Identidade da campanha',`${field('Nome *','name',c.name,{required:true,max:140})}${field('Subtítulo','subtitle',c.subtitle,{max:500})}${field('Dia e hora na história','day',c.day,{max:140})}${isNew?'<p class="muted">O novo universo começa vazio e independente de Caldris. Adicione seu mapa e personagens depois de criar.</p>':''}`,async data=>{const name=value(data,'name',140,true);await commit(`Campanha ${name} configurada`,(current,next)=>{const target=isNew?c:current;Object.assign(target,{name,subtitle:value(data,'subtitle',500),day:value(data,'day',140)});if(isNew){next.campaigns.push(target);activeCampaignId=target.id;ui.mapId='';ui.chapterId='';ui.selectedId='';}});if(isNew)location.hash='universo';});
}
function editMap(id){
 const old=campaign().maps.find(m=>m.id===id);const map=old||{id:uid(),name:'',image:''};
 formDialog(old?'Editar mapa':'Adicionar mapa',`${field('Nome do mapa *','name',map.name,{required:true,max:140})}${fileField(old?'Substituir imagem (opcional)':'Imagem do mapa *','image')}<p class="muted">Coordenadas são percentuais. Ao substituir a imagem, revise as posições e localidades existentes.</p>`,async data=>{
 const file=data.get('image');const image=file?.size?await readImage(file):map.image;if(!image)throw new Error('Selecione uma imagem para o mapa.');
 await commit(`Mapa ${value(data,'name',140,true)} salvo`,c=>{const updated={...map,name:value(data,'name',140,true),image};if(old)c.maps[c.maps.findIndex(v=>v.id===id)]=updated;else c.maps.push(updated);});ui.mapId=map.id;
 },{onDelete:old?()=>commit(`Mapa ${map.name} excluído`,c=>{const ids=c.locations.filter(l=>l.mapId===id).map(l=>l.id);for(const ch of c.characters){delete ch.positions[id];if(ids.includes(ch.locationId))ch.locationId='';}c.locations=c.locations.filter(l=>l.mapId!==id);c.maps=c.maps.filter(m=>m.id!==id);}):null});
}
function editLocation(id){
 if(!campaign().maps.length){toast('Adicione um mapa antes de criar localidades.');return;}
 const old=campaign().locations.find(l=>l.id===id);const l=old||{id:uid(),name:'',mapId:ui.mapId,x:50,y:50,description:''};
 formDialog(old?'Editar localidade':'Nova localidade',`${field('Nome *','name',l.name,{required:true,max:140})}${selectField('Mapa','mapId',l.mapId,mapOptions())}<div class="form-two">${field('X · 0 a 100%','x',l.x,{type:'number'})}${field('Y · 0 a 100%','y',l.y,{type:'number'})}</div>${field('Contexto da localidade','description',l.description,{type:'textarea',rows:6})}<p class="muted">Origem: canto superior esquerdo. Editar a localidade não move automaticamente personagens já posicionados.</p>`,async data=>{
  const updated={...l,name:value(data,'name',140,true),mapId:value(data,'mapId',100),x:Number(value(data,'x',20,true)),y:Number(value(data,'y',20,true)),description:value(data,'description')};
  await commit(`Localidade ${updated.name} salva`,c=>{if(old)c.locations[c.locations.findIndex(v=>v.id===id)]=updated;else c.locations.push(updated);});
 },{onDelete:old?()=>commit(`Localidade ${l.name} excluída`,c=>{c.characters.filter(ch=>ch.locationId===id).forEach(ch=>ch.locationId='');c.locations=c.locations.filter(v=>v.id!==id);}):null});
 const form=$('#edit-form');for(const name of ['x','y']){form.elements[name].max='100';form.elements[name].step='0.1';}
}
function showLocation(id){const c=campaign(),l=c.locations.find(v=>v.id===id);readDialog(l.name,`<p class="prose">${e(l.description)}</p><h3>Personagens neste local</h3><div class="linked-characters">${c.characters.filter(ch=>ch.locationId===id).map(ch=>`<button class="character-chip" data-open-character="${e(ch.id)}">${avatar(ch)}${e(ch.name)}</button>`).join('')||'<p class="muted">Nenhum personagem vinculado.</p>'}</div><button data-edit-location="${e(id)}">Editar localidade</button>`);}
function editMatch(id){
 const old=campaign().tournament.matches.find(m=>m.id===id);const m=old||{id:uid(),round:'Classificatórias',a:'',b:'',winner:'',notes:''};
 const options=[['','A definir'],...campaign().characters.map(ch=>[ch.id,ch.name])];
 formDialog('Confronto do campeonato',`${field('Etapa','round',m.round,{max:100})}<div class="form-two">${selectField('Participante A','a',m.a,options)}${selectField('Participante B','b',m.b,options)}</div>${selectField('Resultado','winner',m.winner,[['','Aguardando resultado'],['empate','Empate'],...options.slice(1)])}${field('Notas da luta','notes',m.notes,{type:'textarea',rows:5,max:5000})}`,async data=>{const updated={...m,round:value(data,'round',100),a:value(data,'a',100),b:value(data,'b',100),winner:value(data,'winner',100),notes:value(data,'notes',5000)};if(updated.a&&updated.a===updated.b)throw new Error('Escolha participantes diferentes.');if(updated.winner&&!['empate',updated.a,updated.b].includes(updated.winner))throw new Error('O vencedor deve ser um dos participantes.');if(updated.winner&&(!updated.a||!updated.b))throw new Error('Defina os dois participantes antes de registrar um resultado.');await commit('Confronto atualizado',c=>{if(old)c.tournament.matches[c.tournament.matches.findIndex(v=>v.id===id)]=updated;else c.tournament.matches.push(updated);});},{onDelete:old?()=>commit('Confronto excluído',c=>{c.tournament.matches=c.tournament.matches.filter(v=>v.id!==id);}):null});
}
async function exportBackup(){
 toast('Preparando backup com todas as imagens…');const backup=clone(state);const cache=new Map();
 async function embed(src){if(!src||src.startsWith('data:'))return src;if(cache.has(src))return cache.get(src);const response=await fetch(src);if(!response.ok)throw new Error(`Imagem não encontrada para o backup: ${src}`);const blob=await response.blob();const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});cache.set(src,encoded);return encoded;}
 for(const c of backup.campaigns){for(const m of c.maps)m.image=await embed(m.image);for(const ch of c.characters){if(ch.image)ch.image=await embed(ch.image);if(ch.portrait)ch.portrait=await embed(ch.portrait);}}
 validateState(backup);download(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),`caldris-backup-${new Date().toISOString().slice(0,10)}.json`);toast('Backup exportado com textos, posições e imagens.');
}
function importBackup(){
 formDialog('Importar backup',`<label class="field"><span>Arquivo JSON de backup *</span><input type="file" name="backup" accept="application/json,.json" required></label><p>A importação substitui todas as campanhas atuais. Exporte um backup antes de continuar. A gravação anterior também poderá ser restaurada.</p>`,async data=>{
  const file=data.get('backup');if(!file?.size||file.size>80*1024*1024)throw new Error('Selecione um backup JSON com até 80 MB.');
  let parsed;try{parsed=JSON.parse(await file.text());}catch{throw new Error('O arquivo não é um JSON válido.');}validateState(parsed);
  if(!confirm(`Substituir as campanhas atuais por ${parsed.campaigns.length} campanha(s) do backup?`))return false;
  await commit('Backup importado',(_c,next)=>{next.campaigns=parsed.campaigns;next.schemaVersion=SCHEMA_VERSION;activeCampaignId=parsed.campaigns[0].id;ui.mapId='';ui.chapterId='';ui.selectedId='';});
 },{submit:'Validar e importar'});
}
async function storageInfo(){const estimate=await navigator.storage?.estimate?.();const persistent=await navigator.storage?.persisted?.();const el=$('#storage-info');if(el)el.textContent=`${estimate?`${((estimate.usage||0)/1048576).toFixed(1)} MB usados · `:''}${persistent?'Armazenamento persistente concedido.':'Persistência depende do navegador. Mantenha backups externos.'}`;}
function help(){readDialog('Seu guia do atlas',`<div class="help-grid"><section><h3>1. Explore o mapa</h3><p>Arraste os retratos para ajustar suas posições. Passe o mouse para ampliar a ficha. Clique para destacar e use “Abrir ficha completa”. As setas do teclado movem um marcador focado.</p></section><section><h3>2. Escreva sua crônica</h3><p>Em Capítulos, crie ou edite textos, marque o estado e vincule personagens. Use “Salvar alterações” antes de fechar. Também é possível baixar cada capítulo em Markdown.</p></section><section><h3>3. Amplie seu universo</h3><p>Adicione imagens e contexto nas fichas. Em Universo e backups, crie campanhas independentes, carregue outros mapas e defina localidades por coordenadas percentuais.</p></section><section><h3>4. Preserve os arquivos</h3><p>Os dados são salvos neste navegador pelo IndexedDB. Não há sincronização automática. Exporte o backup JSON completo para guardar imagens e histórias. Em outro dispositivo ou endereço, importe esse arquivo.</p></section></div><div class="master-note"><strong>Estado inicial</strong><p>Dia 26 da Lua Pálida, 02h. Quatro capítulos concluídos e um rascunho. Posições são aproximadas; o campeonato ainda é uma proposta. Dúvidas do cânone ficam em Tramas e mistérios. Os resumos não reproduzem o compêndio palavra por palavra.</p></div><a class="button" href="./caldris-linux.zip" download>↓ Baixar projeto Linux com documentação</a>`);}
const actions={
 'new-character':()=>editCharacter(), 'new-chapter':()=>editChapter(), 'new-lore':()=>editRecord('lore'), 'new-factions':()=>editRecord('factions'), 'new-threads':()=>editRecord('threads'),
 'new-campaign':()=>editCampaign(true),'edit-campaign':()=>editCampaign(),'new-map':()=>editMap(),'new-location':()=>editLocation(),'new-match':()=>editMatch(),backup:exportBackup,import:importBackup,
 'edit-rules':()=>formDialog('Regulamento do campeonato',field('Regras e planejamento','rules',campaign().tournament.rules,{type:'textarea',rows:18}),async data=>commit('Regulamento atualizado',c=>{c.tournament.rules=value(data,'rules');}),{wide:true}),
 persistent:async()=>{const granted=await navigator.storage?.persist?.();toast(granted?'Armazenamento persistente concedido.':'O navegador não concedeu persistência. Continue exportando backups.');await storageInfo();},
 restore:async()=>{const previous=await repository.read('previous');if(!previous)throw new Error('Ainda não há uma gravação anterior para restaurar.');validateState(previous);if(!confirm('Restaurar o estado anterior de todas as campanhas?'))return;await commit('Gravação anterior restaurada',(_c,next)=>{next.campaigns=previous.campaigns;activeCampaignId=next.campaigns[0].id;ui.mapId='';});toast('Gravação anterior restaurada.');},
 'delete-campaign':async()=>{if(state.campaigns.length===1)throw new Error('Crie outra campanha antes de excluir a última.');if(!confirm(`Excluir toda a campanha “${campaign().name}”, incluindo textos e personagens?`))return;await commit('Campanha excluída',(c,next)=>{next.campaigns=next.campaigns.filter(v=>v.id!==c.id);activeCampaignId=next.campaigns[0].id;ui.mapId='';});}
};
document.addEventListener('click',safely(async ev=>{
 const target=ev.target.closest('button,a');if(!target)return;
 if(target.classList.contains('close-dialog'))return closeDialog();
 const d=target.dataset;
 if(d.action&&actions[d.action])return actions[d.action]();
 if(d.editCharacter!==undefined)return editCharacter(d.editCharacter);
 if(d.openCharacter!==undefined)return showCharacter(d.openCharacter);
 if(d.chapter!==undefined){ui.chapterId=d.chapter;if($('#editor').open)closeDialog();location.hash='capitulos';render();return;}
 if(d.editChapter!==undefined)return editChapter(d.editChapter);
 if(d.exportChapter!==undefined){const ch=campaign().chapters.find(v=>v.id===d.exportChapter);download(new Blob([`# ${ch.title}\n\n${ch.period} · ${ch.status}\n\n${ch.body}\n`],{type:'text/markdown;charset=utf-8'}),'capitulo.md');return;}
 if(d.editRecord!==undefined){const [key,id]=d.editRecord.split(':');return editRecord(key,id);}
 if(d.editMap!==undefined)return editMap(d.editMap);
 if(d.editLocation!==undefined)return editLocation(d.editLocation);
 if(d.match!==undefined)return editMatch(d.match);
 if(d.locateCharacter!==undefined){const ch=campaign().characters.find(v=>v.id===d.locateCharacter);const mid=Object.keys(ch.positions)[0];if(!mid)throw new Error('Este personagem está sem marcador. Edite a ficha e selecione “Posicionar também no mapa” ou escolha um local atual.');ui.mapId=mid;ui.selectedId=ch.id;closeDialog();location.hash='mapa';render();return;}
 if(d.removePin!==undefined){await commit('Marcador retirado do mapa ativo',c=>{delete c.characters.find(ch=>ch.id===d.removePin).positions[ui.mapId];});closeDialog();}
}));
$('#editor').addEventListener('cancel',ev=>{ev.preventDefault();closeDialog();});
$('#backup-button').addEventListener('click',safely(exportBackup));
$('#help-button').addEventListener('click',help);$('#storage-button').addEventListener('click',()=>{location.hash='universo';});
$('#mobile-menu').addEventListener('click',()=>document.body.classList.toggle('menu-open'));
$('#campaign-select').addEventListener('change',ev=>{activeCampaignId=ev.target.value;ui.mapId='';ui.selectedId='';ui.chapterId='';ui.query='';render();});
window.addEventListener('hashchange',()=>{ui.query='';document.body.classList.remove('menu-open');if(state)render();});
window.addEventListener('beforeunload',ev=>{if(dirty||busy){ev.preventDefault();ev.returnValue='';}});
window.addEventListener('scroll',()=>$('#hover-card').hidden=true,true);
window.addEventListener('unhandledrejection',ev=>{report(ev.reason);});
async function start(){
 try{
  await repository.open();const stored=await repository.read();
  if(stored){state=validateState(stored);}else{state=seedState();state.revision=await repository.save(state,0);}
  if(globalThis.BroadcastChannel){channel=new BroadcastChannel('caldris-atlas');channel.onmessage=ev=>{if(ev.data.revision>state.revision){status('Outra aba alterou o arquivo · recarregue',true);toast('Há alterações em outra aba. Recarregue para ver a versão atual.',true);}};}
  status('● Salvo neste navegador');render();
 }catch(err){logError('startup_failed',err);$('#main').innerHTML=`<section class="panel startup-error"><h1>Não foi possível abrir o arquivo</h1><p>${e(err.message)}</p><p>Verifique se o armazenamento está permitido para este endereço. Seus dados existentes não foram apagados.</p><button id="retry">Tentar novamente</button></section>`;$('#retry').onclick=()=>location.reload();status('Arquivo indisponível',true);}
}
start();
