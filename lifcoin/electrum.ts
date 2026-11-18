// Electrum client of the LIF network: what a wallet needs from an Electrum
// client (TWalletElectrum of class/wallets/legacy-wallet.ts), as
// blue_modules/BlueElectrum.ts gives for Bitcoin.
// The server is the LIF node itself, reached as a lifnet topic: no out node
// and no TCP connection is involved.
import * as bitcoin from 'bitcoinjs-lib';
import {lifnet} from 'lif-kernel/lifnet';
import type {ElectrumHistory, ElectrumTransaction}
  from '../blue_modules/BlueElectrum.ts';
import type {Utxo} from '../class/wallets/types.ts';
import {lif_network, LIF_ELECTRUM_TOPIC} from './network.ts';

const CLIENT_NAME = 'bluewallet-lif';
const PROTOCOL = '1.4';
const CONNECT_TIMEOUT = 10000;
// requests sent together
const BATCH = 50;

type Tip = {height: number; time: number};

let rpc: any;
let connecting: Promise<any>|undefined;
// the last block
let tip: Tip = {height: 0, time: 0};
// what does not change: the hex of a transaction, the block of a confirmed
// transaction, the time of a block
let tx_hex_cache: Record<string, string> = {};
let tx_height_cache: Record<string, number> = {};
let block_time_cache: Record<number, number> = {};

const hex_enc = (buf: Uint8Array)=>
  [...buf].map(b=>b.toString(16).padStart(2, '0')).join('');

// the time of a block is in its 80 byte header, at byte 68
function header_time(hex: string): number {
  let b = hex.slice(68*2, 72*2).match(/../g)!.map(h=>parseInt(h, 16));
  return (b[0] | b[1]<<8 | b[2]<<16 | b[3]<<24)>>>0;
}

function tip_set(header: {height: number; hex: string}){
  if (!header?.hex)
    return;
  tip = {height: header.height, time: header_time(header.hex)};
  block_time_cache[tip.height] = tip.time;
}

async function connect(){
  let res = await lifnet.connect(LIF_ELECTRUM_TOPIC, null, {
    timeout: CONNECT_TIMEOUT,
    sock_init: (sock: any)=>{
      // a new block
      sock.method('blockchain.headers.subscribe',
        (params: any)=>tip_set(params?.[0]||params));
      sock.on('close', ()=>{
        if (rpc==sock)
          rpc = undefined;
      });
    },
  });
  if (res?.error || !res?.sock)
    throw Error('LIF electrum: '+(res?.error||'connect failed'));
  let sock = res.sock;
  await sock.T_call('server.version', [CLIENT_NAME, PROTOCOL]);
  tip_set(await sock.T_call('blockchain.headers.subscribe', []));
  return rpc = sock;
}

async function conn(){
  if (rpc)
    return rpc;
  if (!connecting){
    connecting = (async()=>{
      try {
        return await connect();
      } finally {
        connecting = undefined;
      }
    })();
  }
  return await connecting;
}

async function call(method: string, params: any[]){
  let sock = await conn();
  try {
    return await sock.T_call(method, params);
  } catch(e: any){
    throw Error('LIF electrum '+method+': '+(e?.message||e?.error||
      JSON.stringify(e)));
  }
}

// fn(item) for all items, BATCH at a time
async function batch<T, R>(items: T[], fn: (item: T)=>Promise<R>){
  let res: R[] = [];
  for (let i=0; i<items.length; i+=BATCH)
    res.push(...await Promise.all(items.slice(i, i+BATCH).map(fn)));
  return res;
}

// electrum asks by the hash of the output script of an address
function address_sh(address: string): string {
  let script = bitcoin.address.toOutputScript(address, lif_network);
  return hex_enc(new Uint8Array(bitcoin.crypto.sha256(script)).reverse());
}

async function block_time(height: number): Promise<number> {
  if (block_time_cache[height])
    return block_time_cache[height];
  let hex = await call('blockchain.block.header', [height]);
  return block_time_cache[height] = header_time(hex);
}

function history_set(address: string, history: any[]): ElectrumHistory[] {
  for (let h of history||[]){
    h.address = address;
    if (h.tx_hash && h.height>0)
      tx_height_cache[h.tx_hash] = h.height;
  }
  return history||[];
}

async function balance_get(address: string){
  let balance = await call('blockchain.scripthash.get_balance',
    [address_sh(address)]);
  return {confirmed: +balance.confirmed, unconfirmed: +balance.unconfirmed};
}

export async function getBalanceByAddress(address: string){
  return {...await balance_get(address), addr: address};
}

export async function getTransactionsByAddress(address: string){
  return history_set(address, await call('blockchain.scripthash.get_history',
    [address_sh(address)]));
}

export async function multiGetBalanceByAddress(addresses: string[]){
  let ret = {balance: 0, unconfirmed_balance: 0,
    addresses: {} as Record<string, {confirmed: number; unconfirmed: number}>};
  await batch(addresses, async address=>{
    let balance = await balance_get(address);
    ret.balance += +balance.confirmed;
    ret.unconfirmed_balance += +balance.unconfirmed;
    ret.addresses[address] = balance;
  });
  return ret;
}

export async function multiGetUtxoByAddress(addresses: string[]){
  let ret: Record<string, Utxo[]> = {};
  await batch(addresses, async address=>{
    let unspent = await call('blockchain.scripthash.listunspent',
      [address_sh(address)]);
    ret[address] = unspent.map((u: any)=>({address, txid: u.tx_hash,
      vout: u.tx_pos, height: u.height, value: u.value}));
  });
  return ret;
}

export async function multiGetHistoryByAddress(addresses: string[]){
  let ret: Record<string, ElectrumHistory[]> = {};
  await batch(addresses, async address=>{
    ret[address] = await getTransactionsByAddress(address);
  });
  return ret;
}

async function tx_hex(txid: string): Promise<string> {
  return tx_hex_cache[txid] ||=
    await call('blockchain.transaction.get', [txid, false]);
}

// the block of a transaction: 0 when its not in a block yet
async function tx_height(txid: string): Promise<number> {
  if (tx_height_cache[txid])
    return tx_height_cache[txid];
  // not from a history of ours (a transaction that one of ours spends)
  let tx = await call('blockchain.transaction.get', [txid, true]);
  if (!tx?.confirmations)
    return 0;
  return tx_height_cache[txid] = tip.height-tx.confirmations+1;
}

function script_address(script: Uint8Array): string|undefined {
  try {
    return bitcoin.address.fromOutputScript(script, lif_network);
  } catch(e){}
}

// A transaction as BlueElectrum gives it (the verbose form of an Electrum
// server). Its built here from the hex, since the LIF node gives only a
// part of the fields.
async function tx_verbose(txid: string): Promise<ElectrumTransaction> {
  let hex = await tx_hex(txid);
  let tx = bitcoin.Transaction.fromHex(hex);
  let ret: ElectrumTransaction = {
    txid: tx.getId(),
    hash: tx.getId(),
    version: tx.version,
    size: hex.length/2,
    vsize: tx.virtualSize(),
    weight: tx.weight(),
    locktime: tx.locktime,
    vin: [],
    vout: [],
  };
  for (let inp of tx.ins){
    ret.vin.push({
      txid: hex_enc(new Uint8Array(inp.hash).reverse()),
      vout: inp.index,
      scriptSig: {hex: hex_enc(inp.script), asm: ''},
      txinwitness: inp.witness.map(w=>hex_enc(w)),
      sequence: inp.sequence,
    });
  }
  tx.outs.forEach((out, n)=>{
    let address = script_address(out.script);
    ret.vout.push({
      value: Number(out.value)/1e8,
      n,
      scriptPubKey: {
        asm: '',
        hex: hex_enc(out.script),
        reqSigs: 1,
        type: out.script.length==22 && out.script[0]==0 ?
          'witness_v0_keyhash' : '???',
        addresses: address ? [address] : [],
      },
    });
  });
  let height = await tx_height(txid);
  if (height>0){
    ret.confirmations = Math.max(tip.height-height+1, 1);
    ret.time = ret.blocktime = await block_time(height);
  } else
    ret.confirmations = 0;
  return ret;
}

// verbose: transactions as objects. Otherwise as hex
export async function multiGetTransactionByTxid(txids: string[],
  verbose: boolean): Promise<any>
{
  txids = [...new Set(txids.filter(txid=>!!txid))];
  let ret: Record<string, any> = {};
  await batch(txids, async txid=>{
    try {
      ret[txid] = verbose ? await tx_verbose(txid) : await tx_hex(txid);
    } catch(e){
      console.warn('LIF electrum: transaction '+txid, e);
    }
  });
  return ret;
}

// what a transaction pays to the miner: what went in, less what went out
async function tx_fee(txid: string): Promise<number> {
  let tx = bitcoin.Transaction.fromHex(await tx_hex(txid));
  let fee = 0;
  for (let inp of tx.ins){
    let prev = bitcoin.Transaction.fromHex(await tx_hex(
      hex_enc(new Uint8Array(inp.hash).reverse())));
    fee += Number(prev.outs[inp.index].value);
  }
  for (let out of tx.outs)
    fee -= Number(out.value);
  return fee;
}

// The transactions of an address that are not in a block yet, with their
// fee. The LIF node has no call for it: they are taken from the history.
export async function getMempoolTransactionsByAddress(address: string){
  let ret: {height: 0; tx_hash: string; fee: number}[] = [];
  for (let h of await getTransactionsByAddress(address)){
    if (h.height>0)
      continue;
    ret.push({height: 0, tx_hash: h.tx_hash, fee: await tx_fee(h.tx_hash)});
  }
  return ret;
}

// drop what is kept of these transactions: the next call asks the node
export async function forgetCachedTransactions(txids: string[]){
  for (let txid of txids){
    delete tx_hex_cache[txid];
    delete tx_height_cache[txid];
  }
}

// the block of a transaction and the last block. null when the
// transaction is not in a block
export async function getConfirmedBlockHeight(txid: string){
  await conn();
  let height = await tx_height(txid);
  if (!(height>0))
    return null;
  return {height, tip: Math.max(tip.height, height)};
}

// the time of each of the blocks, by height. A block that cannot be read
// is left out
export async function getBlockTimestamps(heights: number[]){
  let ret: Record<number, number> = {};
  await batch(heights, async height=>{
    try {
      ret[height] = await block_time(height);
    } catch(e){}
  });
  return ret;
}

// returns the id of the transaction. throws when the node refuses it
export async function broadcastV2(hex: string): Promise<string> {
  return await call('blockchain.transaction.broadcast', [hex]);
}

// the height of the last block, as far as known
export function estimateCurrentBlockheight(): number {
  return tip.height;
}

// The usual fee rate, in sat/vbyte: used when the LIF node cannot be asked
const FEE_RATE_DEFAULT = 5000;

// Fee rates in sat/vbyte for a fast, a medium and a slow confirmation. The
// LIF node has one rate.
export async function estimateFees(){
  let rate = FEE_RATE_DEFAULT;
  try {
    let per_kb = await call('blockchain.estimatefee', [2]);
    if (per_kb>0)
      rate = Math.round(per_kb*1e8/1000);
  } catch(e){
    console.warn('LIF electrum: estimatefee', e);
  }
  return {fast: rate, medium: rate, slow: rate};
}

// true when the LIF node can be reached. Asked before a broadcast
export async function ensureConnected(): Promise<boolean> {
  try {
    await conn();
    return true;
  } catch(e){
    console.warn('LIF electrum: not connected', e);
    return false;
  }
}

// the offline mode of the Settings is for the Bitcoin servers only
export async function isDisabled(): Promise<boolean> {
  return false;
}
