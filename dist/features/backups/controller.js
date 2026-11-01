import {clone,escapeHTML as e} from '../../shared/primitives.js';
import {MAX_BACKUP_MB,MAX_BACKUP_BYTES} from './policy.js';
import {$,field,download} from '../../shared/ui.js';

/** @param {import("../../shared/contracts.js").FeatureContext} ctx */
export function createController(ctx) {
const {campaign,commit,ui,formDialog,readDialog,closeDialog,value,toast,render,report}=ctx;
const {validateState,migrateState,SCHEMA_VERSION,repository}=ctx;
async function exportBackup(){
 toast('Preparando backup com todas as imagens…');const backup=clone(ctx.state());const cache=new Map();
 async function embed(src){if(!src||src.startsWith('data:'))return src;if(cache.has(src))return cache.get(src);const response=await fetch(src);if(!response.ok)throw new Error(`Imagem não encontrada para o backup: ${src}`);const blob=await response.blob();const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});cache.set(src,encoded);return encoded;}
 for(const c of backup.campaigns){for(const m of c.maps)m.image=await embed(m.image);for(const ch of c.characters){if(ch.image)ch.image=await embed(ch.image);if(ch.portrait)ch.portrait=await embed(ch.portrait);}}
 validateState(backup);const file=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});if(file.size>MAX_BACKUP_BYTES)throw new Error(`O backup excede ${MAX_BACKUP_MB} MB. Reduza as imagens ou a quantidade de campanhas antes de exportar.`);download(file,`caldris-backup-${new Date().toISOString().slice(0,10)}.json`);toast('Backup exportado com textos, posições e imagens.');
}

function importBackup(){
 formDialog('Importar backup',`<label class="field"><span>Arquivo JSON de backup *</span><input type="file" name="backup" accept="application/json,.json" required></label><p>A importação substitui todas as campanhas atuais. Exporte um backup antes de continuar. A gravação anterior também poderá ser restaurada.</p>`,async data=>{
  const file=data.get('backup');if(!file?.size||file.size>MAX_BACKUP_BYTES)throw new Error(`Selecione um backup JSON com até ${MAX_BACKUP_MB} MB.`);
  let parsed;try{parsed=JSON.parse(await file.text());}catch{throw new Error('O arquivo não é um JSON válido.');}parsed=migrateState(parsed);
  if(!confirm(`Substituir as campanhas atuais por ${parsed.campaigns.length} campanha(s) do backup?`))return false;
  await commit('Backup importado',(_c,next)=>{next.campaigns=parsed.campaigns;next.schemaVersion=SCHEMA_VERSION;ctx.activateCampaign(parsed.campaigns[0].id);ui.mapId='';ui.chapterId='';ui.selectedId='';});
 },{submit:'Validar e importar'});
}

async function storageInfo(){const estimate=await navigator.storage?.estimate?.();const persistent=await navigator.storage?.persisted?.();const el=$('#storage-info');if(el)el.textContent=`${estimate?`${((estimate.usage||0)/1048576).toFixed(1)} MB usados · `:''}${persistent?'Armazenamento persistente concedido.':'Persistência depende do navegador. Mantenha backups externos.'}`;}

function help(){readDialog('Seu guia do atlas',`<div class="help-grid"><section><h3>1. Explore o mapa</h3><p>Aponte para uma região para ler seu resumo e ver quem está nela. Clique para abrir o mapa regional; use “Voltar ao mapa do reino” para retornar. Os retratos ampliam a ficha ao apontar. Arrastar um personagem para outra região no mapa do reino transfere seu vínculo; no mapa regional, arrastar ajusta sua posição. As setas movem o marcador focado.</p></section><section><h3>2. Escreva sua crônica</h3><p>Em Capítulos, crie ou edite textos, marque o estado e vincule personagens. Use “Salvar alterações” antes de fechar. Também é possível baixar cada capítulo em Markdown.</p></section><section><h3>3. Amplie seu universo</h3><p>Adicione imagens e contexto nas fichas. Em Universo e backups, edite os resumos e as conexões das regiões ou crie campanhas independentes. Para conectar outro mapa regional, use “Delimitar região”, clique nos vértices do contorno e finalize com a imagem ou um mapa existente.</p></section><section><h3>4. Preserve os arquivos</h3><p>Os dados são salvos neste navegador pelo IndexedDB. Não há sincronização automática. Exporte o backup JSON completo para guardar imagens e histórias. Em outro dispositivo ou endereço, importe esse arquivo.</p></section></div><div class="master-note"><strong>Estado inicial</strong><p>Dia 26 da Lua Pálida, 02h. Quatro capítulos concluídos e um rascunho. Posições são aproximadas; o campeonato ainda é uma proposta. Dúvidas do cânone ficam em Tramas e mistérios. Os resumos não reproduzem o compêndio palavra por palavra.</p></div><a class="button" href="./caldris-linux.zip" download>↓ Baixar projeto Linux com documentação</a>`);}
return {exportBackup,importBackup,storageInfo,help};
}
