// Clipboard for web, on navigator.clipboard.
import {toast_show, texts} from 'bw-web/toast.js';

// navigator.clipboard may never answer (a window without focus, a
// permission prompt left open): give up after a moment
const TIMEOUT = 2000;
function limit(promise){
  return Promise.race([promise, new Promise((resolve, reject)=>
    setTimeout(()=>reject(new Error('clipboard timeout')), TIMEOUT))]);
}

// false when reading would open the browser's permission prompt
async function read_granted(){
  try {
    let status = await navigator.permissions.query({name: 'clipboard-read'});
    return status.state=='granted';
  } catch(e){
    // a browser without this permission name (Firefox, Safari)
    return false;
  }
}

const Clipboard = {
  // the user asked for it (Paste): the permission prompt may show, and
  // takes the time it takes
  getString: async()=>{
    try { return await navigator.clipboard.readText(); }
    catch(e){ return ''; }
  },
  // a short popup tells the user, as Android does by itself.
  // not when clearing the clipboard (empty text)
  setString: async text=>{
    try {
      await limit(navigator.clipboard.writeText(text));
      if (text)
        toast_show(texts.copied());
    } catch(e){
      console.warn('clipboard write failed', e);
    }
  },
  // the app asks by itself (Import Wallet, before it clears the clipboard):
  // never opens the permission prompt, never waits long
  hasString: async()=>{
    try {
      if (!await read_granted())
        return false;
      let text = await limit(navigator.clipboard.readText());
      return !!text;
    } catch(e){ return false; }
  },
  hasURL: async()=>false,
  hasNumber: async()=>false,
  hasWebURL: async()=>false,
  getImage: async()=>null,
  setImage: ()=>{},
  addListener: ()=>({remove:()=>{}}),
  removeAllListeners: ()=>{},
};
export default Clipboard;
