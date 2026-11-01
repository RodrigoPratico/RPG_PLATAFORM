/** Explicit composition: routes, commands and public services belong to their feature. */
export class FeatureRegistry {
 #features=new Map();#routes=new Map();#actions=new Map();#commands=new Map();
 register(feature){
  if(!feature?.id||this.#features.has(feature.id))throw new Error('Funcionalidade duplicada ou inválida: '+feature?.id);
  const routeIds=new Set();
  for(const route of feature.routes||[]){if(!route.id||this.#routes.has(route.id)||routeIds.has(route.id))throw new Error('Rota duplicada ou inválida: '+route.id);routeIds.add(route.id);}
  for(const name of Object.keys(feature.actions||{}))if(this.#actions.has(name))throw new Error('Ação duplicada: '+name);
  for(const name of Object.keys(feature.commands||{}))if(this.#commands.has(name))throw new Error('Comando duplicado: '+name);
  this.#features.set(feature.id,feature);
  for(const route of feature.routes||[])this.#routes.set(route.id,{...route,featureId:feature.id});
  for(const [name,handler] of Object.entries(feature.actions||{}))this.#actions.set(name,handler);
  for(const [name,handler] of Object.entries(feature.commands||{}))this.#commands.set(name,handler);
  return feature;
 }
 service(id){return this.#features.get(id)?.services;}
 has(id){return this.#features.has(id);}
 features(){return [...this.#features.values()];}
 routes(){return [...this.#routes.values()];}
 route(id){return this.#routes.get(id);}
 action(name){return this.#actions.get(name);}
 command(name){return this.#commands.get(name);}
 async handle(data,event){
  if(data.action&&this.#actions.has(data.action)){await this.#actions.get(data.action)();return true;}
  for(const [name,handler] of this.#commands)if(data[name]!==undefined){await handler(data[name],event);return true;}
  return false;
 }
}
