/** Check explicit local ES module imports without evaluating browser code. */
import {readFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';

export async function collectModuleGraph(directory,entry='app.js') {
 const root=resolve(directory),graph=new Map(),visiting=new Set();
 async function visit(name){
  if(visiting.has(name))throw new Error('Dependência circular entre módulos: '+name);
  if(graph.has(name))return;
  visiting.add(name);
  const source=await readFile(resolve(root,name),'utf8');
  const imports=[...source.matchAll(/(?:\bimport\s+(?:[^'";]+?\s+from\s+)?|\bexport\s+[^'";]*?\s+from\s+)["']([^"']+)["']/g)].map(match=>match[1]);
  const dependencies=[];
  for(const specifier of imports){
   if(!specifier.startsWith('.'))throw new Error('Dependência externa inesperada: '+specifier+' em '+name);
   const target=relative(root,resolve(root,dirname(name),specifier)).replaceAll('\\','/');
   if(target.startsWith('../')||!target.endsWith('.js'))throw new Error('Importação fora da aplicação: '+specifier);
   dependencies.push(target);await visit(target);
  }
  visiting.delete(name);graph.set(name,{source,dependencies});
 }
 await visit(entry);return graph;
}
