// The "End-to-end SSL" switch of the web port (SSL: the name of TLS in the
// application).
// A TLS connection of the application (the Electrum server) is made over a
// lif-net out node. Off (default): the out node makes the TLS, and sees the
// plain data. On: the TLS is made here, in the browser, and the out node
// sees encrypted bytes only (opt.secure of lif-kernel net/tcpip.js). It is
// off by default since the TLS code takes time to load.
// The switch itself: web/tls_secure_view.js.
import {tcpip_opt} from 'lif-kernel/tcpip';

// the choice is in localStorage: it must be known before the first
// connection
const KEY = 'bw_tls_secure';

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
