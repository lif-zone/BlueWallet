// The Ark packages (@arkade-os/sdk, @arkade-os/boltz-swap) are big, and
// BlueWallet imports them at start, from files every start needs. On web
// they are loaded only when needed:
// - package.json points the two names to small facade packages
//   (web/stubs/arkade-os-sdk, web/stubs/arkade-os-boltz-swap). A facade
//   exports the same names as the real package, as placeholders.
// - ark_load() loads the real packages (bw-arkade-sdk, bw-arkade-boltz-swap
//   in package.json), and the facades replace their exports by the real
//   ones. Importers see the new values: ES module exports are live.
// - web/main.tsx makes an Ark wallet wait for ark_load() before it
//   initializes, which is the moment the packages are needed.
let facades = [];
let wait;
let loaded = false;

export const ark_loaded = ()=>loaded;

// load(): imports the real module. apply(real): the facade sets its exports
export function facade_add(load, apply){
  let facade = {load, apply};
  facades.push(facade);
  if (loaded)
    facade_load(facade);
}

async function facade_load(facade){
  facade.apply(await facade.load());
}

export function ark_load(){
  return wait ||= (async()=>{
    let t = performance.now();
    try {
      await Promise.all(facades.map(facade_load));
    } catch(e){
      wait = undefined; // the next call tries again
      throw e;
    }
    loaded = true;
    console.log('ark packages loaded in '+Math.round(performance.now()-t)
      +'ms');
  })();
}

function not_loaded(name){
  ark_load().catch(e=>console.warn('ark load failed', e));
  return Error('Ark is not loaded yet ('+name+'). Try again in a moment');
}

// an export of a facade, until the real one is there: any use of it starts
// the loading, and fails with a clear error
export function placeholder(name){
  return new Proxy(function(){}, {
    get(target, prop){
      if (typeof prop=='symbol' || prop=='then')
        return;
      throw not_loaded(name+'.'+prop);
    },
    apply(){
      throw not_loaded(name+'()');
    },
    construct(){
      throw not_loaded('new '+name);
    },
  });
}

// a class that the application instantiates at the top of a module, before
// the real one can be there: `new` gives an object that creates the real
// instance when its first used. get(): the real class, once loaded.
// Before that a method call waits for the loading (so it returns a promise).
export function placeholder_class(name, get){
  return new Proxy(function(){}, {
    construct(target, args){
      let inst;
      let inst_get = ()=>inst ||= new (get())(...args);
      if (get())
        return inst_get();
      return new Proxy({}, {
        get(target, prop){
          if (typeof prop=='symbol' || prop=='then')
            return;
          if (get()){
            let v = inst_get()[prop];
            return typeof v=='function' ? v.bind(inst_get()) : v;
          }
          return async(...a)=>{
            await ark_load();
            return await inst_get()[prop](...a);
          };
        },
      });
    },
    get(target, prop){
      if (typeof prop=='symbol' || prop=='then')
        return;
      throw not_loaded(name+'.'+prop);
    },
    apply(){
      throw not_loaded(name+'()');
    },
  });
}

// the realm schemas of a real package, for a schema list that the
// application builds at the top of a module: one entry that web/stubs/realm.js
// replaces by the real schemas when the realm is opened. get(): the real
// schema list, once loaded
export function lazy_schemas(name, get){
  return [{__lazy_schemas: ()=>{
    let schemas = get();
    if (!schemas)
      throw not_loaded(name);
    return schemas;
  }}];
}
