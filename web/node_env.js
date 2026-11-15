// node env in browser
import compat, {setImmediate, clearImmediate} from 'lif-kernel/compat';
globalThis.global = globalThis;
import buffer from 'buffer';
globalThis.Buffer = buffer.Buffer;
process.env.NODE_BACKEND = 'js';
process.on = ()=>{};
process.argv = [''+globalThis.location];
process.exit = code=>console.warn('process.exit('+(code||0)+')');
globalThis.setImmediate = setImmediate;
globalThis.clearImmediate = clearImmediate;
globalThis.__DEV__ = false;
// require() inside ES modules (bundler style, not valid in the browser):
// - modules: registered by web/main.tsx once loaded, by the path used in
//   the require() call
// - images: return the path, which is served by lif.web_exports
let require_modules = {};
globalThis.require = function(path){
  if (path in require_modules)
    return require_modules[path];
  if (typeof path=='string' && path.match(/\.(png|jpg|jpeg|gif|svg)$/))
    return {uri: path};
  console.warn('require() not supported:', path);
  return {};
};
globalThis.require.register = (path, mod)=>{
  require_modules[path] = mod;
};
