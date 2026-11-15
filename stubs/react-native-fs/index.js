// react-native-fs for web: files are kept in memory (bw-web/vfs.js).
import {vfs_write, vfs_read, vfs_exists, vfs_unlink, vfs_list, vfs_path,
  blob_to_base64, base64_to_bytes} from 'bw-web/vfs.js';

const RNFS = {
  DocumentDirectoryPath: '/documents',
  CachesDirectoryPath: '/caches',
  TemporaryDirectoryPath: '/tmp',
  writeFile: async(path, contents, encoding='utf8')=>{
    if (encoding=='base64')
      contents = base64_to_bytes(contents);
    vfs_write(path, new Blob([contents]));
  },
  readFile: async(path, encoding='utf8')=>{
    let blob = await vfs_read(path);
    if (encoding=='base64')
      return await blob_to_base64(blob);
    return await blob.text();
  },
  exists: async path=>vfs_exists(path),
  unlink: async path=>vfs_unlink(path),
  mkdir: async()=>{},
  readDir: async dir=>vfs_list(dir).map(path=>({path,
    name: path.split('/').pop(), isFile: ()=>true, isDirectory: ()=>false})),
  stat: async path=>({path: vfs_path(path), size: (await vfs_read(path)).size,
    isFile: ()=>true, isDirectory: ()=>false}),
  copyFile: async(from, to)=>vfs_write(to, await vfs_read(from)),
  moveFile: async(from, to)=>{
    vfs_write(to, await vfs_read(from));
    vfs_unlink(from);
  },
};
export default RNFS;
