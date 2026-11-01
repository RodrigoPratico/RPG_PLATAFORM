/** IndexedDB repository: all campaigns and rollback snapshot commit in one transaction. */
export class CampaignRepository {
  #db;
  #validate;
  constructor(validate) { this.#validate=validate; }
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
    this.#validate(state);
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
