// realm for web: the part of the Realm API that BlueWallet uses, kept in
// IndexedDB.
//
// Realm reads and writes are synchronous, IndexedDB is not. So:
// - Realm.open() (async) loads all the objects of that realm file into
//   memory. The copy stays for the life of the page, also after close().
// - reads (objectForPrimaryKey, objects, filtered) answer from memory.
// - writes change the memory at once, and are sent to IndexedDB in the
//   background. IndexedDB runs transactions in the order they are created,
//   so a later load always sees the earlier writes.
// All the realm files are in one IndexedDB database, a row per object, with
// the key [path, object type, id].
// Not here: encryption (encryptionKey is ignored), schema versions and
// migrations, listeners, and queries beyond query_parse().
const DB_NAME = 'bluewallet-realm';
const STORE = 'rows';
let db; // IDBDatabase, once open
let ready; // the open, and after it the deletes that waited for it
const files = {}; // path -> {types: {name: Map(id -> object)}}
const row_ids = new WeakMap(); // object -> {name, id}

const req_wait = req=>new Promise((resolve, reject)=>{
  req.onsuccess = ()=>resolve(req.result);
  req.onerror = ()=>reject(req.error);
});

function db_open(){
  return ready ||= (async()=>{
    let req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = ()=>req.result.createObjectStore(STORE);
    db = await req_wait(req);
    db.onversionchange = ()=>{
      db.close();
      db = ready = undefined;
    };
  })();
}

// id of an object that has no primary key. IndexedDB returns the rows
// sorted by key, so the ids grow: objects come back in the order they were
// created. The random part keeps two tabs from making the same id.
let id_seq = 0;
function id_new(){
  return Date.now().toString(36).padStart(9, '0')+'-'+
    (id_seq++).toString(36).padStart(6, '0')+'-'+
    Math.random().toString(36).slice(2, 8);
}

// all the rows of a realm file: arrays sort after strings
const path_range = path=>IDBKeyRange.bound([path], [path, []]);

// ops: [{put: object, key}] or [{del: key}] or [{del_range}].
// Must be called in the same task as the change: the order of IndexedDB
// transactions is the order they are created.
function db_write(ops){
  if (!ops.length)
    return;
  if (!db){
    // not open yet (Realm.deleteFile before any Realm.open): after the open
    ready = db_open().then(()=>db_write(ops));
    return;
  }
  let store = db.transaction(STORE, 'readwrite').objectStore(STORE);
  for (let op of ops){
    if (op.del_range)
      store.delete(op.del_range);
    else if (op.del)
      store.delete(op.del);
    else
      store.put(op.put, op.key);
  }
  store.transaction.onerror = ()=>
    console.warn('realm: write failed', store.transaction.error);
}

async function file_load(path){
  await db_open();
  await ready; // deletes that waited for the open
  if (files[path])
    return files[path];
  let store = db.transaction(STORE).objectStore(STORE);
  let [keys, vals] = await Promise.all([
    req_wait(store.getAllKeys(path_range(path))),
    req_wait(store.getAll(path_range(path)))]);
  if (files[path]) // loaded by another open() in the meantime
    return files[path];
  let file = files[path] = {types: {}};
  keys.forEach(([, name, id], i)=>{
    let obj = vals[i];
    (file.types[name] ||= new Map()).set(id, obj);
    row_ids.set(obj, {name, id});
  });
  return file;
}

// the part of the Realm query language that BlueWallet and the Ark sdk use:
//   field == value, field = value, field != value
//   field IN {value, value}
//   AND (&&), OR (||), and ( )
// value: "str", 'str', a number, true, false, null, or $0.. for an argument
const query_re = /"[^"]*"|'[^']*'|\$\d+|==|!=|=|&&|\|\||[(){},]|[\w.@]+/g;
function query_parse(query, args){
  let fail = ()=>{
    throw Error('realm stub: unsupported query: '+query);
  };
  if (query.replace(query_re, '').trim())
    fail();
  let tokens = query.match(query_re)||[], i = 0;
  let peek = ()=>tokens[i];
  let next = ()=>tokens[i++];
  let is = re=>peek()!==undefined && re.test(peek());
  let value = ()=>{
    let t = next(), m;
    if (t===undefined)
      fail();
    if (m = /^\$(\d+)$/.exec(t))
      return args[+m[1]];
    if (/^["']/.test(t))
      return t.slice(1, -1);
    if (/^(null|nil)$/i.test(t))
      return null;
    if (/^(true|false)$/i.test(t))
      return t.toLowerCase()=='true';
    if (isNaN(+t))
      fail();
    return +t;
  };
  // a missing field is null
  let eq = (a, b)=>b==null ? a==null : a===b;
  let or;
  let prim = ()=>{
    if (peek()=='('){
      next();
      let f = or();
      if (next()!=')')
        fail();
      return f;
    }
    let field = next(), op = next();
    if (!field || !/^[\w.@]+$/.test(field) || !op)
      fail();
    if (op=='==' || op=='='){
      let v = value();
      return obj=>eq(obj[field], v);
    }
    if (op=='!='){
      let v = value();
      return obj=>!eq(obj[field], v);
    }
    if (!/^IN$/i.test(op) || next()!='{')
      fail();
    let vals = [];
    while (peek()!='}'){
      vals.push(value());
      if (peek()==',')
        next();
      else if (peek()!='}')
        fail();
    }
    next();
    return obj=>vals.some(v=>eq(obj[field], v));
  };
  let and = ()=>{
    let fs = [prim()];
    while (is(/^(AND|&&)$/i)){
      next();
      fs.push(prim());
    }
    return fs.length==1 ? fs[0] : obj=>fs.every(f=>f(obj));
  };
  or = ()=>{
    let fs = [and()];
    while (is(/^(OR|\|\|)$/i)){
      next();
      fs.push(and());
    }
    return fs.length==1 ? fs[0] : obj=>fs.some(f=>f(obj));
  };
  let f = or();
  if (i<tokens.length)
    fail();
  return f;
}

class Results extends Array {
  static get [Symbol.species](){ return Array; }
  filtered(query, ...args){
    return Results.from(this.filter(query_parse(query, args)));
  }
  sorted(field, reverse){
    let res = Results.from(this);
    if (typeof field!='string')
      return res;
    res.sort((a, b)=>(a[field]>b[field] ? 1 : a[field]<b[field] ? -1 : 0)
      *(reverse ? -1 : 1));
    return res;
  }
  snapshot(){ return Results.from(this); }
  isEmpty(){ return !this.length; }
}

const UpdateMode = {Never: 'never', Modified: 'modified', All: 'all'};
const path_get = opt=>typeof opt=='string' ? opt : opt?.path||'default.realm';

export default class Realm {
  static UpdateMode = UpdateMode;
  static defaultPath = 'default.realm';
  static async open(opt={}){
    let path = path_get(opt);
    let realm = new Realm(path, opt.schema||[]);
    realm._file = await file_load(path);
    return realm;
  }
  // a realm file may be there without being loaded here, which cannot be
  // known synchronously. true: deleting a missing file does nothing
  static exists(opt){ return true; }
  static deleteFile(opt){
    let path = path_get(opt);
    if (files[path])
      files[path].types = {};
    db_write([{del_range: path_range(path)}]);
  }
  constructor(path, schema){
    this.path = path;
    this.isClosed = false;
    // an entry {__lazy_schemas()} stands for schemas of a package that is
    // loaded later than the list was built (web/arkade.js)
    schema = schema.flatMap(s=>s.__lazy_schemas ? s.__lazy_schemas() : [s]);
    this.schema = schema;
    this._pk = {};
    for (let s of schema){
      s = s.schema||s;
      this._pk[s.name] = s.primaryKey;
    }
    this._ops = null; // the writes of the write() that is running
  }
  _op(op){
    if (this._ops)
      this._ops.push(op);
    else
      db_write([op]);
  }
  _type(name){
    return this._file.types[name] ||= new Map();
  }
  // the changes of fn() go to IndexedDB in one transaction
  write(fn){
    if (this._ops)
      return fn();
    this._ops = [];
    try {
      return fn();
    } finally {
      let ops = this._ops;
      this._ops = null;
      db_write(ops);
    }
  }
  create(name, props, mode){
    let type = this._type(name), pk = this._pk[name];
    let id = pk ? ''+props[pk] : id_new();
    let obj = type.get(id);
    if (obj && (!mode || mode==UpdateMode.Never))
      throw Error('realm stub: '+name+' with primary key '+id+' exists');
    if (obj)
      Object.assign(obj, props);
    else {
      obj = {...props};
      type.set(id, obj);
      row_ids.set(obj, {name, id});
    }
    this._op({put: {...obj}, key: [this.path, name, id]});
    return obj;
  }
  // an object, or a list of objects (the result of objects() / filtered())
  delete(objs){
    if (!objs)
      return;
    for (let obj of Array.isArray(objs) ? [...objs] : [objs]){
      let row = row_ids.get(obj);
      if (!row || !this._type(row.name).delete(row.id))
        continue;
      this._op({del: [this.path, row.name, row.id]});
    }
  }
  deleteAll(){
    this._file.types = {};
    this._op({del_range: path_range(this.path)});
  }
  objects(name){
    return Results.from(this._type(name).values());
  }
  objectForPrimaryKey(name, key){
    return this._type(name).get(''+key) ?? null;
  }
  close(){ this.isClosed = true; }
  addListener(){}
  removeListener(){}
  removeAllListeners(){}
}
