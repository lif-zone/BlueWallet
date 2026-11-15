// Clipboard for web, on navigator.clipboard.
import {toast_show} from 'bw-web/toast.js';

const Clipboard = {
  getString: async()=>{
    try { return await navigator.clipboard.readText(); }
    catch(e){ return ''; }
  },
  // a short popup tells the user, as Android does by itself.
  // not when clearing the clipboard (empty text)
  setString: async text=>{
    try {
      await navigator.clipboard.writeText(text);
      if (text)
        toast_show('Copied to clipboard');
    } catch(e){
      console.warn('clipboard write failed', e);
    }
  },
  hasString: async()=>{
    try {
      let text = await navigator.clipboard.readText();
      return text && text.length>0;
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
