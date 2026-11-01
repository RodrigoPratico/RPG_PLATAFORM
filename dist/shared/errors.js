export function logError(event,error) {console.error(JSON.stringify({time:new Date().toISOString(),level:'error',event,message:error?.message||String(error)}));}
