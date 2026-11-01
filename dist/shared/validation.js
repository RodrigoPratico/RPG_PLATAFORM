export const text = (value, max = 200000) => typeof value === 'string' && value.length <= max;
export function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function list(value, name, max = 5000) { requireValue(Array.isArray(value) && value.length <= max, `Lista inválida: ${name}.`); const ids = new Set(); for (const row of value) {requireValue(row && typeof row.id==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(row.id) && !['constructor','prototype'].includes(row.id) && !ids.has(row.id), `Identificadores inválidos em ${name}.`); ids.add(row.id);} }

export function value(data,name,max=200000,required=false){const v=String(data.get(name)||'').trim();if(v.length>max)throw new Error(`Campo ${name} excede o limite de ${max} caracteres.`);if(required&&!v)throw new Error('Preencha todos os campos obrigatórios.');return v;}
