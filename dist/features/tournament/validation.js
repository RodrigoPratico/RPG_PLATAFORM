import {text,requireValue,list} from '../../shared/validation.js';
export function validateTournament(c) {
    requireValue(c.tournament && text(c.tournament.rules) && Array.isArray(c.tournament.matches) && c.tournament.matches.length<=1000, 'Torneio inválido.');
    list(c.tournament.matches,'confrontos',1000);
    for (const m of c.tournament.matches) requireValue(text(m.id,100) && text(m.round,100) && text(m.a,100) && text(m.b,100) && [m.a,m.b].every(id=>id===''||c.characters.some(ch=>ch.id===id)) && ['',m.a,m.b,'empate'].includes(m.winner) && text(m.notes,5000), 'Confronto inválido.');
}
