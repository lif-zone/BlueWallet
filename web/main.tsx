import React from 'react';
import {createRoot} from 'react-dom/client';
import './node_env.js';
import {html_elm_frag_append} from 'lif-kernel/util';
declare const $lif: any;

html_elm_frag_append(document.head, `
  <meta name=viewport content='width=device-width, initial-scale=1' />
  <link rel=icon href='lif-kernel/favicon.ico' />
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
    let {default: App} = await import('../App.tsx');
    await require_init();
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
