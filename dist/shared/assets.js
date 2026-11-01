/** Relative, nested asset paths only. Original case, spaces and accents are preserved. */
export function safeImage(src) {
 if(typeof src!=='string')return '';
 if(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src)&&src.length<22000000)return src;
 if(!src.startsWith('assets/')||src.length>700||!/^assets\/[\p{L}\p{M}\p{N} _().–\/-]+\.(png|webp|jpe?g)$/iu.test(src))return '';
 if(src.split('/').some(part=>!part||part==='.'||part==='..'||part.trim()!==part))return '';
 return src;
}
export function assetURL(src) { const valid=safeImage(src); return valid.startsWith('assets/')?valid.split('/').map(encodeURIComponent).join('/'):valid; }
