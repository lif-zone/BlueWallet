// AsyncStorage for web: kept in IndexedDB.
import {storage} from 'bw-web/storage.js';

const store = storage('@AsyncStorage:');

const AsyncStorage = {
  getItem: key=>store.get(key),
  setItem: (key, value)=>store.set(key, value),
  removeItem: key=>store.remove(key),
  mergeItem: async(key, value)=>{
    let existing = await store.get(key);
    if (existing)
      value = JSON.stringify({...JSON.parse(existing), ...JSON.parse(value)});
    await store.set(key, value);
  },
  clear: ()=>store.clear(),
  getAllKeys: ()=>store.keys(),
  multiGet: async keys=>{
    let res = [];
    for (let key of keys)
      res.push([key, await store.get(key)]);
    return res;
  },
  multiSet: async pairs=>{
    for (let [key, value] of pairs)
      await store.set(key, value);
  },
  multiRemove: async keys=>{
    for (let key of keys)
      await store.remove(key);
  },
  multiMerge: async pairs=>{
    for (let [key, value] of pairs)
      await AsyncStorage.mergeItem(key, value);
  },
};

export default AsyncStorage;
