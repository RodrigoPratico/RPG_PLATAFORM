import {text,requireValue,list} from '../../shared/validation.js';
export function validateChapters(c) {list(c.chapters,'chapters');
    for (const row of c.chapters) {
      requireValue(text(row.title, 200) && row.title.trim() && text(row.body) && text(row.period, 100) && ['Rascunho','Em andamento','Concluído'].includes(row.status), 'Capítulo inválido.');
      requireValue(Array.isArray(row.characterIds) && row.characterIds.every(id=>c.characters.some(ch=>ch.id===id)), 'Vínculo de capítulo inválido.');
    }

}
