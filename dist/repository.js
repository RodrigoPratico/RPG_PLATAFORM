import { validateState } from './model.js';
/** IndexedDB repository: all campaigns and rollback snapshot commit in one transaction. */
export class CampaignRepository {
  #db;
  async open() {
    if (!globalThis.indexedDB) throw new Error('Este navegador não oferece IndexedDB. Abra em Firefox ou Chromium com armazenamento permitido.');
    this.#db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('caldris-atlas',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('archive');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      r.onblocked=()=>reject(new Error('Feche as outras abas do atlas e tente novamente.'));
    });
    this.#db.onversionchange=()=>this.#db.close();
    return this;
  }
  async read(key='state') {
    return new Promise((resolve,reject)=>{const r=this.#db.transaction('archive').objectStore('archive').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  }
  async save(state, expectedRevision) {
    validateState(state);
    return new Promise((resolve,reject)=>{
      const tx=this.#db.transaction('archive','readwrite'); const store=tx.objectStore('archive');
      let failure; const current=store.get('state');
      current.onsuccess=()=>{
        const prior=current.result;
        if (expectedRevision!==undefined && (prior?.revision||0)!==expectedRevision) {failure=new Error('Outra aba alterou os arquivos. Recarregue esta página antes de editar.');tx.abort();return;}
        if (prior) store.put(prior,'previous');
        store.put({...state,revision:(prior?.revision||0)+1},'state');
      };
      tx.oncomplete=()=>resolve((expectedRevision||0)+1);
      tx.onabort=()=>reject(failure||tx.error||new Error('Não foi possível concluir a gravação.'));
      tx.onerror=()=>{};
    });
  }
}
export function logError(event,error) {console.error(JSON.stringify({time:new Date().toISOString(),level:'error',event,message:error?.message||String(error)}));}
/** Decode and re-encode images to reject unsupported files and keep storage bounded. */
export async function readImage(file) {
  if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Envie uma imagem PNG, JPEG ou WebP.');
  if (file.size>15*1024*1024) throw new Error('A imagem deve ter até 15 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    if (bitmap.width*bitmap.height>60000000) throw new Error('Imagem muito grande: limite de 60 megapixels.');
    const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)); const canvas=document.createElement('canvas');
    canvas.width=Math.round(bitmap.width*scale); canvas.height=Math.round(bitmap.height*scale);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp',0.9);
  } finally {bitmap.close();}
}
