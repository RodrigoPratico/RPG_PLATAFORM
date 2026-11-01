import {$} from './ui.js';
import {escapeHTML as e} from './primitives.js';
export function createDialogs({report,toast,safely}) {
 let dirty=false;
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
function closeDialog(){if(dirty&&!confirm('Descartar as alterações não salvas?'))return false;dirty=false;$('#editor').close();return true;}
 return {formDialog,readDialog,closeDialog,hasUnsavedChanges:()=>dirty};
}
