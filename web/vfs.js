// Files for the web port: React Native code writes and reads files by path
// (react-native-fs) and hands paths to the share and document picker
// modules. On web the "files" are kept in memory, and leave or enter the
// page through a download or a file picker.
let files = new Map();

// 'file:///caches/a%20b.txt' -> '/caches/a b.txt'
export function vfs_path(path){
  path = ''+path;
  if (path.startsWith('file://'))
    path = decodeURI(path.slice(7));
  return path;
}

export function vfs_write(path, blob){
  files.set(vfs_path(path), blob);
}

// a path written before, or a blob:/data: url
export async function vfs_read(path){
  if (/^(blob|data):/.test(path))
    return await (await fetch(path)).blob();
  let blob = files.get(vfs_path(path));
  if (!blob)
    throw Error('ENOENT: no such file or directory: '+path);
  return blob;
}

export function vfs_exists(path){
  return files.has(vfs_path(path));
}

export function vfs_unlink(path){
  files.delete(vfs_path(path));
}

export function vfs_list(dir){
  dir = vfs_path(dir).replace(/\/*$/, '/');
  return [...files.keys()].filter(path=>path.startsWith(dir));
}

export function bytes_to_base64(bytes){
  let s = '';
  for (let i=0; i<bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i+0x8000));
  return btoa(s);
}

export function base64_to_bytes(base64){
  return Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
}

export async function blob_to_base64(blob){
  return bytes_to_base64(new Uint8Array(await blob.arrayBuffer()));
}

// save a blob to the user's disk
export function download(blob, name){
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = name||'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

// open the browser file picker. returns the chosen File list, empty when
// the user cancelled
export function file_pick({accept, multiple}={}){
  return new Promise(resolve=>{
    let input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    if (accept)
      input.accept = accept;
    input.multiple = !!multiple;
    let done = list=>{
      input.remove();
      resolve(list);
    };
    input.addEventListener('change', ()=>done([...input.files]));
    input.addEventListener('cancel', ()=>done([]));
    document.body.appendChild(input);
    input.click();
  });
}
