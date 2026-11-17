// @arkade-os/boltz-swap/repositories/realm for web: a facade, loaded only
// when needed: see web/arkade.js.
import {facade_add, placeholder, lazy_schemas} from 'bw-web/arkade.js';

let real;
// BlueWallet builds its schema list at the top of a module: stubs/realm
// resolves this entry when the realm is opened
export const BoltzRealmSchemas = lazy_schemas('BoltzRealmSchemas',
  ()=>real?.BoltzRealmSchemas);
export let RealmSwapRepository = placeholder('RealmSwapRepository');
export let BoltzSwapSchema = placeholder('BoltzSwapSchema');

facade_add(()=>import('bw-arkade-boltz-swap/repositories/realm'), _real=>{
  real = _real;
  ({RealmSwapRepository, BoltzSwapSchema} = real);
});
