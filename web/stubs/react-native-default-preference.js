// react-native-default-preference for web: settings kept in IndexedDB.
import {storage} from 'bw-web/storage.js';

const store = storage('@DefaultPreference:');
const DefaultPreference = {
  get: key=>store.get(key),
  set: (key, value)=>store.set(key, value),
  clear: key=>store.remove(key),
  getMultiple: async keys=>{
    let res = [];
    for (let key of keys)
      res.push(await store.get(key));
    return res;
  },
  setMultiple: async obj=>{
    for (let key in obj)
      await store.set(key, obj[key]);
  },
  clearMultiple: async keys=>{
    for (let key of keys)
      await store.remove(key);
  },
  getAll: async()=>{
    let res = {};
    for (let key of await store.keys())
      res[key] = await store.get(key);
    return res;
  },
  clearAll: ()=>store.clear(),
  setName: async()=>{},
  getName: async()=>'',
};
export default DefaultPreference;
