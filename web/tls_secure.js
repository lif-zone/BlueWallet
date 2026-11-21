// The "End-to-end TLS" switch of the web port.
// A TLS connection of the application (the Electrum server) is made over a
// lif-net out node. Off (default): the out node makes the TLS, and sees the
// plain data. On: the TLS is made here, in the browser, and the out node
// sees encrypted bytes only (opt.secure of lif-kernel net/tcpip.js). It is
// off by default since the TLS code takes time to load.
// The switch is not a part of the application: it is drawn here, over the
// page, while the Electrum Server screen of Settings is open.
import {tcpip_opt} from 'lif-kernel/tcpip';

// the choice is in localStorage: it must be known before the first
// connection
const KEY = 'bw_tls_secure';
// the last part of the address of the page, at the Electrum Server screen
const SCREEN = 'ElectrumSettings';

// the open TLS sockets (web/stubs/react-native-tcp-socket.js)
export const tls_socks = new Set();

export function tls_secure_get(){
  try {
    return localStorage.getItem(KEY)=='1';
  } catch(e){
    return false;
  }
}

export function tls_secure_set(on){
  on = !!on;
  try {
    if (on)
      localStorage.setItem(KEY, '1');
    else
      localStorage.removeItem(KEY);
  } catch(e){}
  if (tcpip_opt.secure==on)
    return;
  tcpip_opt.secure = on;
  // the open connections were made the other way: closed, and the
  // application connects again
  for (let sock of [...tls_socks])
    sock.destroy();
}

tcpip_opt.secure = tls_secure_get();

// The switch
let elm;
function elm_create(){
  let style = document.createElement('style');
  style.textContent = `
    .bw-tls { position: fixed; right: 16px; bottom: 16px; z-index: 1000;
      width: min(420px, calc(100vw - 32px)); display: flex;
      align-items: center; gap: 12px; padding: 12px 16px;
      border-radius: 12px; background: #fff; color: #0c2550;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); font-size: 14px; }
    .bw-tls-text { flex: 1; min-width: 0; }
    .bw-tls-title { font-weight: 600; }
    .bw-tls-note { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .bw-tls-switch { flex: none; width: 44px; height: 24px; padding: 0;
      border: none; border-radius: 12px; background: #9aa0aa;
      position: relative; transition: background 0.15s; }
    .bw-tls-switch::after { content: ''; position: absolute; top: 2px;
      left: 2px; width: 20px; height: 20px; border-radius: 50%;
      background: #fff; transition: left 0.15s; }
    .bw-tls-switch[aria-checked=true] { background: #0070ff; }
    .bw-tls-switch[aria-checked=true]::after { left: 22px; }
    @media (prefers-color-scheme: dark) {
      .bw-tls { background: #1c1c1e; color: #fff; }
    }
  `;
  document.head.appendChild(style);
  elm = document.createElement('div');
  elm.className = 'bw-tls';
  let text = document.createElement('div');
  text.className = 'bw-tls-text';
  let title = document.createElement('div');
  title.className = 'bw-tls-title';
  title.textContent = 'End-to-end TLS';
  let note = document.createElement('div');
  note.className = 'bw-tls-note';
  note.textContent = 'TLS is made in this browser: the relay node sees '
    +'only encrypted data. Slower to connect.';
  text.append(title, note);
  let btn = document.createElement('button');
  btn.className = 'bw-tls-switch';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-label', 'End-to-end TLS');
  btn.setAttribute('aria-checked', ''+tls_secure_get());
  btn.onclick = ()=>{
    tls_secure_set(!tls_secure_get());
    btn.setAttribute('aria-checked', ''+tls_secure_get());
  };
  elm.append(text, btn);
}

function update(){
  let show = location.pathname.split('/').pop()==SCREEN;
  if (show && !elm)
    elm_create();
  if (!elm || show==elm.isConnected)
    return;
  if (show)
    document.body.appendChild(elm);
  else
    elm.remove();
}

// the application changes the address of the page when a screen opens
for (let fn of ['pushState', 'replaceState']){
  let orig = history[fn];
  history[fn] = function(...args){
    let ret = orig.apply(this, args);
    update();
    return ret;
  };
}
addEventListener('popstate', update);
update();
