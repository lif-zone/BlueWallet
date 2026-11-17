// @arkade-os/sdk for web: a facade. The real package (bw-arkade-sdk in
// package.json) is loaded only when an Ark wallet needs it: see
// web/arkade.js. The names are the ones BlueWallet imports.
import {facade_add, placeholder} from 'bw-web/arkade.js';

export let Wallet = placeholder('Wallet');
export let SingleKey = placeholder('SingleKey');
export let RestDelegatorProvider = placeholder('RestDelegatorProvider');
export let RestArkProvider = placeholder('RestArkProvider');
export let RestIndexerProvider = placeholder('RestIndexerProvider');
export let ContractManager = placeholder('ContractManager');
export let VtxoManager = placeholder('VtxoManager');
export let DelegateVtxo = placeholder('DelegateVtxo');
export let TxType = placeholder('TxType');
export let networks = placeholder('networks');
// types in the real package: no value
export let ExtendedCoin, ArkTransaction;

facade_add(()=>import('bw-arkade-sdk'), real=>{
  ({Wallet, SingleKey, RestDelegatorProvider, RestArkProvider,
    RestIndexerProvider, ContractManager, VtxoManager, DelegateVtxo, TxType,
    networks} = real);
});
