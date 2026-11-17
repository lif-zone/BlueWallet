// react-native-keychain for web: kept in IndexedDB. A browser has no OS
// keychain, so this is no more protected than AsyncStorage.
import {storage} from 'bw-web/storage.js';

const store = storage('@Keychain:');
const service_get = options=>
  (typeof options=='string' ? options : options?.service)||'default';

export async function setGenericPassword(username, password, options){
  let service = service_get(options);
  await store.set(service, JSON.stringify({username, password}));
  return {service, storage: 'IndexedDB'};
}

export async function getGenericPassword(options){
  let service = service_get(options);
  let value = await store.get(service);
  if (!value)
    return false;
  return {service, storage: 'IndexedDB', ...JSON.parse(value)};
}

export async function resetGenericPassword(options){
  await store.remove(service_get(options));
  return true;
}

// a browser has no secure hardware: null, as on iOS, lets the caller keep
// its default
export async function getSecurityLevel(){
  return null;
}

const names = (...list)=>Object.fromEntries(list.map(name=>[name, name]));
export const ACCESSIBLE = names('WHEN_UNLOCKED', 'AFTER_FIRST_UNLOCK',
  'ALWAYS', 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  'WHEN_UNLOCKED_THIS_DEVICE_ONLY', 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY');
export const ACCESS_CONTROL = names('USER_PRESENCE', 'BIOMETRY_ANY',
  'BIOMETRY_CURRENT_SET', 'DEVICE_PASSCODE', 'APPLICATION_PASSWORD',
  'BIOMETRY_ANY_OR_DEVICE_PASSCODE', 'BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE');
export const AUTHENTICATION_TYPE = names('DEVICE_PASSCODE_OR_BIOMETRICS',
  'BIOMETRICS');
export const SECURITY_LEVEL = names('SECURE_SOFTWARE', 'SECURE_HARDWARE',
  'ANY');
export const STORAGE_TYPE = names('AES_CBC', 'AES_GCM', 'AES_GCM_NO_AUTH',
  'RSA');
export default {setGenericPassword, getGenericPassword, resetGenericPassword,
  getSecurityLevel, ACCESSIBLE, ACCESS_CONTROL, AUTHENTICATION_TYPE, SECURITY_LEVEL,
  STORAGE_TYPE};
