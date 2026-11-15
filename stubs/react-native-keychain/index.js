// react-native-keychain for web: kept in localStorage. A browser has no OS
// keychain, so this is no more protected than AsyncStorage.
import {storage} from 'bw-web/storage.js';

const store = storage('@Keychain:');
const service_get = options=>
  (typeof options=='string' ? options : options?.service)||'default';

export async function setGenericPassword(username, password, options){
  let service = service_get(options);
  store.set(service, JSON.stringify({username, password}));
  return {service, storage: 'localStorage'};
}

export async function getGenericPassword(options){
  let service = service_get(options);
  let value = store.get(service);
  if (!value)
    return false;
  return {service, storage: 'localStorage', ...JSON.parse(value)};
}

export async function resetGenericPassword(options){
  store.remove(service_get(options));
  return true;
}

export const ACCESSIBLE = {};
export const ACCESS_CONTROL = {};
export const AUTHENTICATION_TYPE = {};
export const SECURITY_LEVEL = {};
export const STORAGE_TYPE = {};
export default {setGenericPassword, getGenericPassword, resetGenericPassword,
  ACCESSIBLE, ACCESS_CONTROL, AUTHENTICATION_TYPE, SECURITY_LEVEL,
  STORAGE_TYPE};
