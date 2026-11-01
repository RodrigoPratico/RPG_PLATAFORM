import {text,requireValue,list} from '../../shared/validation.js';
export function validateRecords(c) {for(const key of ['factions','threads','lore'])list(c[key],key);
    for (const key of ['factions','threads','lore']) for (const row of c[key]) requireValue(text(row.title, 200) && row.title.trim() && text(row.body) && text(row.status, 100), `Registro inválido: ${key}.`);
}
