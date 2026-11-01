/** Fast build-time checks for empty or truncated image files, without image libraries. */
export function assertImageBytes(bytes,path) {
 const kind=path.split('.').at(-1).toLowerCase();let valid=false;
 if(kind==='webp')valid=bytes.length>=20&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'&&bytes.readUInt32LE(4)+8===bytes.length;
 else if(kind==='png')valid=bytes.length>=32&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',bytes.length-8,bytes.length-4)==='IEND';
 else if(['jpg','jpeg'].includes(kind))valid=bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217;
 if(!valid)throw new Error('Imagem vazia, truncada ou com assinatura inválida: '+path);
}
