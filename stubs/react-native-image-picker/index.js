// react-native-image-picker for web: the browser file picker for images.
import {file_pick, blob_to_base64} from 'bw-web/vfs.js';

export async function launchImageLibrary(options={}, callback){
  let list = await file_pick({accept: 'image/*',
    multiple: options.selectionLimit!=null && options.selectionLimit!=1});
  let res;
  if (!list.length)
    res = {didCancel: true};
  else {
    let assets = [];
    for (let file of list){
      let asset = {uri: URL.createObjectURL(file), fileName: file.name,
        type: file.type, fileSize: file.size};
      if (options.includeBase64)
        asset.base64 = await blob_to_base64(file);
      assets.push(asset);
    }
    res = {assets};
  }
  callback?.(res);
  return res;
}

// a web page has no separate camera app: pick an image instead
export const launchCamera = launchImageLibrary;
