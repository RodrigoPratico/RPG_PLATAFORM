/** Validate the static application and produce its self-contained Linux download.
 * No install step, network calls or third-party packages are required.
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { seedState } from '../dist/seed.js';
import { validateState } from '../dist/model.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const target = resolve(dist, 'caldris-linux.zip');
const ignored = new Set(['__pycache__', '.git', '.openai', '.vercel', '.env']);

async function walk(directory) {
  const paths = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    if (ignored.has(entry.name) || entry.name.endsWith('.pyc')) continue;
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Link simbólico não permitido: ${relative(root,path)}`);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (path !== target) paths.push(path);
  }
  return paths;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP/DEFLATE using standard Node modules. Dates are fixed for reproducibility. */
async function createZip(paths) {
  const local = [], central = [];
  let offset = 0;
  for (const path of paths) {
    const data = await readFile(path), compressed = deflateRawSync(data);
    const name = Buffer.from(`caldris-atlas/${relative(root,path).replaceAll('\\','/')}`);
    const crc = crc32(data), header = Buffer.alloc(30), directory = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20,4);
    header.writeUInt16LE(0x800,6); header.writeUInt16LE(8,8); header.writeUInt16LE(33,12);
    header.writeUInt32LE(crc,14); header.writeUInt32LE(compressed.length,18);
    header.writeUInt32LE(data.length,22); header.writeUInt16LE(name.length,26);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20,4); directory.writeUInt16LE(20,6);
    directory.writeUInt16LE(0x800,8); directory.writeUInt16LE(8,10); directory.writeUInt16LE(33,14);
    directory.writeUInt32LE(crc,16); directory.writeUInt32LE(compressed.length,20);
    directory.writeUInt32LE(data.length,24); directory.writeUInt16LE(name.length,28);
    directory.writeUInt32LE(offset,42);
    local.push(header,name,compressed); central.push(directory,name);
    offset += header.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(paths.length,8); end.writeUInt16LE(paths.length,10);
  end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
  await writeFile(target,Buffer.concat([...local,directory,end]));
}

try {
  const seed = validateState(seedState());
  const required = new Set(['index.html','app.js','styles.css','model.js','repository.js','seed.js','ui.js','views.js','map.js','assets/emblem.svg']);
  for (const c of seed.campaigns) {
    for (const map of c.maps) required.add(map.image);
    for (const ch of c.characters) {
      if (ch.image) required.add(ch.image);
      if (ch.portrait) required.add(ch.portrait);
    }
  }
  for (const path of required) {
    if (!(await stat(resolve(dist,path))).isFile()) throw new Error(`Arquivo estático ausente: ${path}`);
  }
  const paths = ['README.md','Makefile','serve.py','config.toml','package.json','CHANGELOG.md','vercel.json'].map(path=>resolve(root,path));
  for (const directory of ['dist','scripts','tests','docs']) paths.push(...await walk(resolve(root,directory)));
  await createZip(paths.sort());
  console.log(JSON.stringify({event:'build_complete',staticFiles:required.size,linuxPackageBytes:(await stat(target)).size,output:'dist'}));
} catch (error) {
  console.error(JSON.stringify({event:'build_failed',message:error.message}));
  process.exitCode = 1;
}
