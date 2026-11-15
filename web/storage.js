// A small persistent key/value store on localStorage, for the React Native
// modules that keep settings and keys outside AsyncStorage.
// storage(prefix) -> {get, set, remove, keys}. values are strings
export function storage(prefix){
  return {
    get: key=>{
      try {
        return localStorage.getItem(prefix+key);
      } catch(e){
        return null;
      }
    },
    set: (key, value)=>{
      try {
        localStorage.setItem(prefix+key, ''+value);
      } catch(e){
        console.warn('storage set failed', e);
      }
    },
    remove: key=>{
      try {
        localStorage.removeItem(prefix+key);
      } catch(e){}
    },
    keys: ()=>{
      let res = [];
      try {
        for (let i=0; i<localStorage.length; i++){
          let key = localStorage.key(i);
          if (key.startsWith(prefix))
            res.push(key.slice(prefix.length));
        }
      } catch(e){}
      return res;
    },
  };
}
