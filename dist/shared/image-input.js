/** Decode and re-encode images to reject unsupported files and keep storage bounded. */
export async function readImage(file) {
  if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Envie uma imagem PNG, JPEG ou WebP.');
  if (file.size>15*1024*1024) throw new Error('A imagem deve ter até 15 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    if (bitmap.width*bitmap.height>60000000) throw new Error('Imagem muito grande: limite de 60 megapixels.');
    const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)); const canvas=document.createElement('canvas');
    canvas.width=Math.round(bitmap.width*scale); canvas.height=Math.round(bitmap.height*scale);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp',0.9);
  } finally {bitmap.close();}
}
