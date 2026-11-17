// @arkade-os/sdk/adapters/expo for web: the Expo providers are the Rest
// providers of the sdk with Expo's fetch, for streaming on React Native.
// A browser streams with the standard fetch, so here they are the Rest
// providers. Loaded only when needed: see web/arkade.js.
import {facade_add, placeholder} from 'bw-web/arkade.js';

export let ExpoArkProvider = placeholder('ExpoArkProvider');
export let ExpoIndexerProvider = placeholder('ExpoIndexerProvider');

facade_add(()=>import('bw-arkade-sdk'), real=>{
  ExpoArkProvider = real.RestArkProvider;
  ExpoIndexerProvider = real.RestIndexerProvider;
});
