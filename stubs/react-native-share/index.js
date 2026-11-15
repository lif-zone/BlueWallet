// react-native-share for web. A file or an image is saved as a download
// (or handed to the system share sheet where the browser has one). A text
// message goes to the share sheet, or to the clipboard.
import {vfs_read, download} from 'bw-web/vfs.js';

const extensions = {'image/png': '.png', 'image/jpeg': '.jpg',
  'text/plain': '.txt', 'application/json': '.json', 'text/csv': '.csv',
  'application/pdf': '.pdf'};

async function share_url(url, {filename, type, saveToFiles}){
  let blob = await vfs_read(url);
  if (type && blob.type!=type)
    blob = new Blob([blob], {type});
  let name = filename;
  if (!name && !/^(blob|data):/.test(url))
    name = decodeURI(url).split('/').pop().replace(/^\d+-/, '');
  name ||= 'file';
  if (!/\.[a-z0-9]+$/i.test(name))
    name += extensions[blob.type]||'';
  let file = new File([blob], name, {type: blob.type});
  if (!saveToFiles && navigator.canShare?.({files: [file]}))
    return await navigator.share({files: [file]});
  download(blob, name);
}

const Share = {
  open: async(options={})=>{
    let urls = options.urls||(options.url ? [options.url] : []);
    try {
      for (let url of urls)
        await share_url(url, options);
      if (!urls.length && options.message){
        if (navigator.share)
          await navigator.share({title: options.title, text: options.message});
        else
          await navigator.clipboard.writeText(options.message);
      }
    } catch(e){
      // closing the share sheet is not an error, unless asked for
      if (e.name!='AbortError')
        throw e;
      if (options.failOnCancel!==false)
        throw Error('User did not share');
      return {success: false, dismissedAction: true};
    }
    return {success: true};
  },
  isPackageInstalled: async()=>({isInstalled: false}),
};
export default Share;
