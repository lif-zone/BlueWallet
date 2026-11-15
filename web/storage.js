// A small persistent key/value store on IndexedDB, for the React Native
// storage modules (AsyncStorage, preferences, key stores).
// storage(prefix) -> {get, set, remove, keys, clear}. all are async.
// All prefixes share one object store; a key is stored as prefix+key.
import {openDB} from 'idb';

const DB_NAME = 'bluewallet';
const STORE = 'kv';
let db_p;

function db_open(){
  if (db_p)
    return db_p;
  db_p = openDB(DB_NAME, 1, {
    upgrade(db){
      db.createObjectStore(STORE);
    },
  });
  // ask the browser not to evict the wallet data under disk pressure
  persist();
  return db_p;
}

async function persist(){
  try {
    await navigator.storage?.persist?.();
  } catch(e){}
}

export function storage(prefix){
  let range = ()=>IDBKeyRange.bound(prefix, prefix+'￿');
  return {
    get: async key=>{
      let db = await db_open();
      return await db.get(STORE, prefix+key) ?? null;
    },
    set: async(key, value)=>{
      let db = await db_open();
      await db.put(STORE, ''+value, prefix+key);
    },
    remove: async key=>{
      let db = await db_open();
      await db.delete(STORE, prefix+key);
    },
    keys: async()=>{
      let db = await db_open();
      let keys = await db.getAllKeys(STORE, range());
      return keys.map(key=>key.slice(prefix.length));
    },
    clear: async()=>{
      let db = await db_open();
      await db.delete(STORE, range());
    },
  };
}
