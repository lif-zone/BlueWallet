// @arkade-os/sdk/repositories/realm for web: a facade, loaded only when
// needed: see web/arkade.js.
import {facade_add, placeholder, lazy_schemas} from 'bw-web/arkade.js';

let real;
// BlueWallet builds its schema list, and computes its schema version, at the
// top of a module: these two cannot be replaced later.
// stubs/realm resolves the schemas when the realm is opened, and has no
// schema versions.
export const ArkRealmSchemas = lazy_schemas('ArkRealmSchemas',
  ()=>real?.ArkRealmSchemas);
export const ARK_REALM_SCHEMA_VERSION = 0;
export let RealmWalletRepository = placeholder('RealmWalletRepository');
export let RealmContractRepository = placeholder('RealmContractRepository');
export let RealmIntentRepository = placeholder('RealmIntentRepository');
export const runArkRealmMigrations = (...args)=>
  real?.runArkRealmMigrations(...args);

facade_add(()=>import('bw-arkade-sdk/repositories/realm'), _real=>{
  real = _real;
  ({RealmWalletRepository, RealmContractRepository, RealmIntentRepository}
    = real);
});
