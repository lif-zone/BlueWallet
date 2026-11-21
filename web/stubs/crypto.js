import {sha256} from '@noble/hashes/sha256';
import {hmac} from '@noble/hashes/hmac';
import {pbkdf2} from '@noble/hashes/pbkdf2';

function to_bytes(data){
  if (typeof data=='string')
    return new TextEncoder().encode(data);
  return new Uint8Array(data);
}

class Hash {
  constructor(algo){
    if (algo!='sha256')
      throw Error('crypto stub: only sha256 supported, got '+algo);
    this._data = [];
  }
  update(data){
    if (typeof data=='string')
      data = new TextEncoder().encode(data);
    else if (data instanceof Uint8Array)
      ;
    else if (Buffer.isBuffer(data))
      data = new Uint8Array(data);
    this._data.push(data);
    return this;
  }
  digest(enc){
    let total = 0;
    for (let d of this._data)
      total += d.length;
    let buf = new Uint8Array(total);
    let off = 0;
    for (let d of this._data){
      buf.set(d, off);
      off += d.length;
    }
    let hash = sha256(buf);
    if (enc=='hex')
      return Array.from(hash).map(b=>b.toString(16).padStart(2, '0')).join('');
    return Buffer.from(hash);
  }
}

export function createHash(algo){
  return new Hash(algo);
}

class Hmac {
  constructor(algo, key){
    if (algo!='sha256')
      throw Error('crypto stub: only sha256 supported, got '+algo);
    this._hmac = hmac.create(sha256, to_bytes(key));
  }
  update(data){
    this._hmac.update(to_bytes(data));
    return this;
  }
  digest(enc){
    let hash = Buffer.from(this._hmac.digest());
    return enc ? hash.toString(enc) : hash;
  }
}

// used by slip39 (SLIP39 shares)
export function createHmac(algo, key){
  return new Hmac(algo, key);
}

export function pbkdf2Sync(password, salt, iterations, keylen, digest){
  if (digest!='sha256')
    throw Error('crypto stub: only sha256 supported, got '+digest);
  return Buffer.from(pbkdf2(sha256, to_bytes(password), to_bytes(salt),
    {c: iterations, dkLen: keylen}));
}

export function randomBytes(size){
  let buf = new Uint8Array(size);
  crypto.getRandomValues(buf);
  return Buffer.from(buf);
}

export default {createHash, createHmac, pbkdf2Sync, randomBytes};
