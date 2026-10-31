/** @typedef {{id:string,name:string,characters:Array,chapters:Array,maps:Array,locations:Array,factions:Array,threads:Array,lore:Array,tournament:object}} Campaign */
export const SCHEMA_VERSION = 1;
export const uid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // getRandomValues is available on HTTP development origins as well as HTTPS.
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const clone = (value) => structuredClone(value);
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));
export const ATTRIBUTES = ['Força', 'Agilidade', 'Vitalidade', 'Inteligência', 'Destreza'];
/** User text is always inserted as text or escaped HTML, never interpreted as markup. */
export function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function safeImage(src) {
  if (typeof src !== 'string') return '';
  if (/^assets\/[a-zA-Z0-9._-]+\.(webp|png|jpg|jpeg)$/.test(src)) return src;
  if (/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src) && src.length < 22000000) return src;
  return '';
}
const text = (value, max = 200000) => typeof value === 'string' && value.length <= max;
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function list(value, name, max = 5000) { requireValue(Array.isArray(value) && value.length <= max, `Lista inválida: ${name}.`); const ids = new Set(); for (const row of value) {requireValue(row && typeof row.id==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(row.id) && !['constructor','prototype'].includes(row.id) && !ids.has(row.id), `Identificadores inválidos em ${name}.`); ids.add(row.id);} }
/** Validate the entire backup before allowing an atomic replacement. */
export function validateState(state) {
  requireValue(state && state.schemaVersion === SCHEMA_VERSION, 'Versão de arquivo incompatível. Esperado: 1.');
  requireValue(Number.isSafeInteger(state.revision) && state.revision>=0, 'Revisão de arquivo inválida.');
  list(state.campaigns, 'campanhas', 100); requireValue(state.campaigns.length > 0, 'É necessário ter uma campanha.');
  for (const c of state.campaigns) {
    requireValue(text(c.name, 140) && c.name.trim(), 'Nome de campanha inválido.');
    requireValue(text(c.subtitle, 500) && text(c.day, 140), 'Metadados inválidos.');
    requireValue(text(c.updatedAt,100) && Number.isFinite(Date.parse(c.updatedAt)), 'Data da campanha inválida.');
    if(c.history!==undefined)requireValue(Array.isArray(c.history) && c.history.length<=60 && c.history.every(h=>h && text(h.description,500) && text(h.date,100) && Number.isFinite(Date.parse(h.date))), 'Histórico inválido.');
    for (const key of ['characters','chapters','maps','locations','factions','threads','lore']) list(c[key], key);
    for (const m of c.maps) requireValue(text(m.name, 140) && !!safeImage(m.image), 'Imagem ou nome de mapa inválido.');
    for (const ch of c.characters) {
      requireValue(text(ch.name, 140) && ch.name.trim() && text(ch.role, 500) && text(ch.summary) && text(ch.notes) && text(ch.relations) && text(ch.age, 100) && text(ch.rank, 140) && text(ch.faction, 200) && text(ch.loyalty, 500), 'Ficha de personagem inválida.');
      requireValue(ch.image === '' || !!safeImage(ch.image), 'Imagem de personagem inválida.');
      requireValue(!ch.portrait || !!safeImage(ch.portrait), 'Miniatura de personagem inválida.');
      requireValue(ch.positions && typeof ch.positions === 'object' && !Array.isArray(ch.positions), 'Posições inválidas.');
      for (const [mapId, p] of Object.entries(ch.positions)) requireValue(c.maps.some(m=>m.id===mapId) && p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=100 && p.y>=0 && p.y<=100, 'Coordenada fora do mapa.');
      requireValue(ch.attributes && ATTRIBUTES.every(a=>ch.attributes[a] === null || (Number.isInteger(ch.attributes[a]) && ch.attributes[a]>=0 && ch.attributes[a]<=9999999)), 'Atributos inválidos.');
      requireValue(ch.locationId === '' || c.locations.some(l=>l.id===ch.locationId), 'Localidade de personagem inexistente.');
    }
    for (const row of c.chapters) {
      requireValue(text(row.title, 200) && row.title.trim() && text(row.body) && text(row.period, 100) && ['Rascunho','Em andamento','Concluído'].includes(row.status), 'Capítulo inválido.');
      requireValue(Array.isArray(row.characterIds) && row.characterIds.every(id=>c.characters.some(ch=>ch.id===id)), 'Vínculo de capítulo inválido.');
    }
    for (const row of c.locations) requireValue(text(row.name, 140) && text(row.description) && c.maps.some(m=>m.id===row.mapId) && Number.isFinite(row.x) && Number.isFinite(row.y) && row.x>=0 && row.x<=100 && row.y>=0 && row.y<=100, 'Localidade inválida.');
    for (const key of ['factions','threads','lore']) for (const row of c[key]) requireValue(text(row.title, 200) && row.title.trim() && text(row.body) && text(row.status, 100), `Registro inválido: ${key}.`);
    requireValue(c.tournament && text(c.tournament.rules) && Array.isArray(c.tournament.matches) && c.tournament.matches.length<=1000, 'Torneio inválido.');
    list(c.tournament.matches,'confrontos',1000);
    for (const m of c.tournament.matches) requireValue(text(m.id,100) && text(m.round,100) && text(m.a,100) && text(m.b,100) && [m.a,m.b].every(id=>id===''||c.characters.some(ch=>ch.id===id)) && ['',m.a,m.b,'empate'].includes(m.winner) && text(m.notes,5000), 'Confronto inválido.');
  }
  return state;
}
export function emptyCampaign(name) {
  return {id:uid(),name,subtitle:'Um novo mundo está esperando.',day:'Dia 1',characters:[],chapters:[],maps:[],locations:[],factions:[],threads:[],lore:[],tournament:{rules:'',matches:[]},updatedAt:new Date().toISOString()};
}
export function emptyCharacter() {
  return {id:uid(),name:'',role:'',age:'',rank:'',image:'',summary:'',notes:'',relations:'',faction:'',loyalty:'',locationId:'',positions:{},attributes:Object.fromEntries(ATTRIBUTES.map(a=>[a,null]))};
}
export function removeCharacter(campaign, id) {
  campaign.characters = campaign.characters.filter(c=>c.id!==id);
  for (const chapter of campaign.chapters) chapter.characterIds = chapter.characterIds.filter(v=>v!==id);
  campaign.tournament.matches = campaign.tournament.matches.filter(m=>m.a!==id && m.b!==id);
}
export function positionAtLocation(campaign, character, locationId) {
  character.locationId=locationId;
  const loc=campaign.locations.find(l=>l.id===locationId);
  if (loc) { const n=campaign.characters.filter(c=>c.id!==character.id && c.locationId===locationId).length; character.positions[loc.mapId]={x:clamp(loc.x+(n%3-1)*3.2),y:clamp(loc.y+Math.floor(n/3)*5)}; }
}
