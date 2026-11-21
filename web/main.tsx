import React from 'react';
import {createRoot} from 'react-dom/client';
import './node_env.js';
import {html_elm_frag_append} from 'lif-kernel/util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getLocales} from 'react-native-localize';
import {resolveLangCodeFromRnLocales} from '../loc/resolveDeviceLangCode';
import loc_requires from './loc_requires.json' with {type: 'json'};
// a dayjs locale file registers itself in dayjs when loaded: dayjs must be
// loaded before the first one (loc_load)
import 'dayjs';
import {texts as toast_texts} from './toast.js';
import {ark_load} from './arkade.js';
// the "End-to-end TLS" switch, on the Electrum Server screen
import './tls_secure.js';
declare const $lif: any;

// the BlueWallet application icon (the Android launcher icon), in place of
// the icon of the page that loaded us
for (let link of document.querySelectorAll('link[rel~=icon]'))
  link.remove();
const icon_url = import.meta.resolve(
  '../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');

html_elm_frag_append(document.head, `
  <meta name=viewport content='width=device-width, initial-scale=1' />
  <link rel=icon type=image/png sizes=192x192 href='${icon_url}' />
  <link rel=stylesheet href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' />
  <link rel=stylesheet href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css' />
  <link rel=stylesheet href='https://fonts.googleapis.com/icon?family=Material+Icons' />
  <link rel=stylesheet href='https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.4.47/css/materialdesignicons.min.css' />
  <style>
    @font-face { font-family: 'Ionicons'; font-style: normal; font-weight: 400;
      src: url('https://cdn.jsdelivr.net/npm/@react-native-vector-icons/ionicons@13.1.5/fonts/Ionicons.ttf') format('truetype'); }
    @font-face { font-family: 'Entypo'; font-style: normal; font-weight: 400;
      src: url('https://cdn.jsdelivr.net/npm/@react-native-vector-icons/entypo@13.1.5/fonts/Entypo.ttf') format('truetype'); }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, 'Helvetica Neue', Arial, sans-serif; }
    #root { display: flex; flex-direction: column; height: 100%; }
    #root > div { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    [class*="css-text-"] { overflow: hidden; }
    button { cursor: pointer; }
    input, textarea { font-family: inherit; }
  </style>
`);

function LoadingApp(){
  return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', flexDirection: 'column'}}>
    <div style={{fontSize: 24, fontWeight: 'bold', marginBottom: 16}}>BlueWallet Web</div>
    <div id='bw-loading-text' style={{fontSize: 14, opacity: 0.6}}>Loading…</div>
  </div>;
}

class ErrorBoundary extends React.Component<{children: any}, {error: any}> {
  constructor(props: any){
    super(props);
    this.state = {error: null};
  }
  static getDerivedStateFromError(error: any){
    return {error};
  }
  componentDidCatch(error: any, info: any){
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }
  render(){
    if (this.state.error){
      return <div style={{padding: 32}}>
        <div style={{fontSize: 24, color: '#e74c3c'}}>Render Error</div>
        <pre style={{fontSize: 12, whiteSpace: 'pre-wrap'}}>{this.state.error.message+'\n'+this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

let _root = document.body.appendChild(document.createElement('div'));
_root.id = 'root';
let root = createRoot(_root);
root.render(<LoadingApp />);

// modules that BlueWallet loads with require() inside ES modules
async function require_init(){
  let req: any = (globalThis as any).require;
  // class/wallets/legacy-wallet.ts: late load, circular import
  req.register('./hd-segwit-bech32-wallet',
    await import('../class/wallets/hd-segwit-bech32-wallet.ts'));
  // screen/settings/ReleaseNotes.tsx: release-notes.json is a native build
  // output, skipped on web
  req.register('../../release-notes', '');
  // blue_modules/BlueElectrum.ts: late load, circular import
  req.register('../class/wallets/segwit-bech32-wallet',
    await import('../class/wallets/segwit-bech32-wallet.ts'));
  req.register('../class/wallets/segwit-p2sh-wallet',
    await import('../class/wallets/segwit-p2sh-wallet.ts'));
  req.register('../class/wallets/legacy-wallet',
    await import('../class/wallets/legacy-wallet.ts'));
  req.register('../class/wallets/taproot-wallet',
    await import('../class/wallets/taproot-wallet.ts'));
}

// loc/index.ts loads the strings of a language (require('./xx.json')) and
// its date locale (require('dayjs/locale/xx')) at the moment the language
// is applied. web/loc_requires.json (web/loc_requires_gen.mjs) tells which
// files a language needs.
let loc_loading: Record<string, Promise<void>> = {};
function loc_load(lang: string){
  return loc_loading[lang] ||= (async()=>{
    let req: any = (globalThis as any).require;
    let json = (loc_requires.json as any)[lang];
    let dayjs = (loc_requires.dayjs as any)[lang];
    try {
      if (json){
        let res = await fetch(new URL('../loc/'+json.slice(2),
          import.meta.url));
        req.register(json, await res.json());
      }
      if (dayjs){
        req.register(dayjs, await import(
          new URL('../.lif.imp/'+dayjs+'?imp', import.meta.url).href));
      }
    } catch(e){
      console.warn('failed loading language', lang, e);
    }
  })();
}

// the languages loc/index.ts may apply at start: the saved one, and the
// ones it detects from the browser
async function loc_init_early(){
  let locales = getLocales();
  let langs = new Set([await AsyncStorage.getItem('lang'),
    resolveLangCodeFromRnLocales(locales), locales[0]?.languageCode]);
  await Promise.all([...langs].map(lang=>lang && loc_load(lang)));
}

// the other languages, for a change of language in Settings: one by one in
// the background. A language that is chosen before it got loaded shows in
// English until the next start.
async function loc_init_all(){
  for (let lang of Object.keys(loc_requires.json))
    await loc_load(lang);
}

// The Ark packages are loaded only when an Ark wallet is used
// (web/arkade.js). Everything an Ark wallet does with them starts with its
// init(), so init() first waits for them.
async function ark_init(){
  let {LightningArkWallet} =
    await import('../class/wallets/lightning-ark-wallet.ts');
  let init = LightningArkWallet.prototype.init;
  LightningArkWallet.prototype.init = async function(this: any){
    await ark_load();
    return await init.call(this);
  };
}

// modules that are loaded with require() at the top of a module, so they
// must be there before the application is imported
async function require_init_early(){
  let req: any = (globalThis as any).require;
  // blue_modules/BlueElectrum.ts: the electrum client, and its sockets. On
  // React Native 'net' and 'tls' are both react-native-tcp-socket
  let tcp_socket = (await import('react-native-tcp-socket')).default;
  req.register('net', tcp_socket);
  req.register('tls', tcp_socket);
  req.register('electrum-client', (await import('electrum-client')).default);
  // screen/settings/About.tsx: current-branch.json is a native build output
  // (the git branch of the build)
  req.register('../../current-branch.json', 'master');
  // animations
  await Promise.all([
    ['../img/txblock.json', '../img/txblock.json'],
    ['../../img/pending.json', '../img/pending.json'],
    ['../../img/bluenice.json', '../img/bluenice.json'],
    ['../../img/msvault.json', '../img/msvault.json'],
  ].map(async([path, file])=>{
    let res = await fetch(new URL(file, import.meta.url));
    req.register(path, await res.json());
  }));
}

(async()=>{
  let last: number|null = null;
  let diff = 0;
  let iv = setInterval(async()=>{
    let stats = await $lif.boot.kernel_stats();
    let all = stats?.fetch?.all;
    if (all==null || all==last)
      return;
    if (last==null)
      diff = all;
    last = all;
    let txt = document.getElementById('bw-loading-text');
    if (txt)
      txt.textContent = 'Loading… '+(all-diff);
  }, 200);
  try {
    await require_init_early();
    await loc_init_early();
    let {default: App} = await import('../App.tsx');
    await require_init();
    await ark_init();
    let loc = (await import('../loc/index.ts')).default;
    toast_texts.copied = ()=>loc._.copied;
    loc_init_all();
    clearInterval(iv);
    root.render(<ErrorBoundary><App /></ErrorBoundary>);
  } catch(e){
    clearInterval(iv);
    console.error('App load error:', e);
    root.render(<div style={{padding: 32}}>
      <div style={{fontSize: 24, color: '#e74c3c'}}>Load Error</div>
      <pre style={{fontSize: 12, whiteSpace: 'pre-wrap'}}>{e.message+'\n'+e.stack}</pre>
    </div>);
  }
})();
