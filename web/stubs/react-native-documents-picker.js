// @react-native-documents/picker for web: the browser file picker, and a
// download for saving. Picked files are put in the in-memory file system
// (bw-web/vfs.js), so react-native-fs can read them by uri.
import {vfs_write, vfs_read, file_pick, download} from 'bw-web/vfs.js';

export const types = {allFiles: '*/*', images: 'image/*',
  plainText: 'text/plain', pdf: 'application/pdf', json: 'application/json',
  csv: 'text/csv'};
export const errorCodes = {OPERATION_CANCELED: 'OPERATION_CANCELED',
  IN_PROGRESS: 'IN_PROGRESS', UNABLE_TO_OPEN_FILE_TYPE:
  'UNABLE_TO_OPEN_FILE_TYPE'};

function error_canceled(){
  let err = Error('user canceled the document picker');
  err.code = errorCodes.OPERATION_CANCELED;
  return err;
}

export async function pick({type, allowMultiSelection}={}){
  // the browser picker always lets the user choose "all files", and file
  // types like .psbt have no reliable mime type: do not filter
  let list = await file_pick({multiple: allowMultiSelection});
  if (!list.length)
    throw error_canceled();
  return list.map(file=>{
    let uri = 'file://'+encodeURI('/caches/picked/'+Date.now()+'-'+file.name);
    vfs_write(uri, file);
    return {uri, name: file.name, type: file.type||null, size: file.size,
      nativeType: file.type||null, hasRequestedType: true, error: null};
  });
}

export async function keepLocalCopy({files}){
  return files.map(file=>({status: 'success', sourceUri: file.uri,
    localUri: file.uri}));
}

export async function saveDocuments({sourceUris, fileName, mimeType}){
  let res = [];
  for (let uri of sourceUris){
    let blob = await vfs_read(uri);
    if (mimeType)
      blob = new Blob([blob], {type: mimeType});
    let name = fileName||uri.split('/').pop();
    download(blob, name);
    res.push({uri, name, error: null});
  }
  return res;
}

export const isErrorWithCode = err=>!!err?.code;
export default {pick, saveDocuments, keepLocalCopy, types, errorCodes,
  isErrorWithCode};
