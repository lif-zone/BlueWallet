// react-native-default-preference for web: settings kept in localStorage.
import {storage} from 'bw-web/storage.js';

const store = storage('@DefaultPreference:');
const DefaultPreference = {
  get: async key=>store.get(key),
  set: async(key, value)=>store.set(key, value),
  clear: async key=>store.remove(key),
  getMultiple: async keys=>keys.map(key=>store.get(key)),
  setMultiple: async obj=>{
    for (let key in obj)
      store.set(key, obj[key]);
  },
  clearMultiple: async keys=>keys.forEach(key=>store.remove(key)),
  getAll: async()=>Object.fromEntries(
    store.keys().map(key=>[key, store.get(key)])),
  clearAll: async()=>store.keys().forEach(key=>store.remove(key)),
  setName: async()=>{},
  getName: async()=>'',
};
export default DefaultPreference;
