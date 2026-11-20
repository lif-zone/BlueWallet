// react-native-tcp-socket for web: TCP and TLS sockets over lif-net, on
// lif-kernel net/tcpip.js. The real connection is made by a lif-net out
// node; for TLS, the TLS ends at that node.
// BlueWallet uses this module as both 'net' and 'tls' of nodejs.
import {tcp_sock} from 'lif-kernel/tcpip';
import EventEmitter from 'events';

export class Socket extends tcp_sock {
}

const events = ['connect', 'secureConnect', 'data', 'end', 'error', 'close',
  'timeout'];
const methods = ['write', 'end', 'destroy', 'pause', 'resume', 'setTimeout',
  'setEncoding', 'setKeepAlive', 'setNoDelay', 'ref', 'unref'];

// new TLSSocket(socket, {rejectUnauthorized}): as in react-native-tcp-socket,
// the plain socket is the one that gets connect(), and the TLSSocket is the
// one that is read, written and listened to.
export class TLSSocket extends EventEmitter {
  constructor(socket, opt={}){
    super();
    this.socket = socket;
    socket.opt.tls = true;
    if (opt.rejectUnauthorized!==undefined)
      socket.opt.rejectUnauthorized = opt.rejectUnauthorized;
    for (let event of events)
      socket.on(event, (...args)=>this.emit(event, ...args));
    for (let method of methods){
      this[method] = (...args)=>{
        socket[method](...args);
        return this;
      };
    }
  }
  emit(event, ...args){
    if (event=='error' && !this.listenerCount('error'))
      return false;
    return super.emit(event, ...args);
  }
  connect(...args){
    this.socket.connect(...args);
    return this;
  }
  get remoteAddress(){ return this.socket.remoteAddress; }
  get remotePort(){ return this.socket.remotePort; }
  get destroyed(){ return this.socket.destroyed; }
  getPeerCertificate(){ return {}; }
}

function conn_args(args){
  let [opt, host, cb] = args;
  if (typeof opt!='object')
    opt = {port: opt, host: typeof host=='string' ? host : undefined};
  if (typeof host=='function')
    cb = host;
  return {opt, cb};
}

export function createConnection(...args){
  let {opt, cb} = conn_args(args);
  return new Socket().connect(opt, cb);
}

export function connectTLS(...args){
  let {opt, cb} = conn_args(args);
  let tls = new TLSSocket(new Socket(), opt);
  if (cb)
    tls.once('secureConnect', cb);
  return tls.connect(opt);
}

const ip4_re = /^(\d{1,3}\.){3}\d{1,3}$/;
export const isIPv4 = host=>ip4_re.test(host);
export const isIPv6 = host=>typeof host=='string' && host.includes(':');
export const isIP = host=>isIPv4(host) ? 4 : isIPv6(host) ? 6 : 0;

export default {Socket, TLSSocket, createConnection, connect: createConnection,
  connectTLS, isIP, isIPv4, isIPv6};
