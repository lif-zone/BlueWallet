// react-native-secure-key-store for web: kept in IndexedDB. A browser
// has no OS keychain, so this is no more protected than AsyncStorage.
import {storage} from 'bw-web/storage.js';

export const ACCESSIBLE = {
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  ALWAYS: 'ALWAYS',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
};
const store = storage('@SecureKeyStore:');
export default {
  set: (key, value)=>store.set(key, value),
  // the native module rejects when the key does not exist
  get: async key=>{
    let value = await store.get(key);
    if (value==null)
      throw Error('key not found: '+key);
    return value;
  },
  remove: key=>store.remove(key),
};
