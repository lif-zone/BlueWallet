// HD wallets (BIP39 mnemonic) on the LIF network: BlueWallet's HD wallets,
// with the LIF network, paths and Electrum client.
import b58 from 'bs58check';
import {HDSegwitBech32Wallet}
  from '../class/wallets/hd-segwit-bech32-wallet.ts';
import {HDLegacyP2PKHWallet}
  from '../class/wallets/hd-legacy-p2pkh-wallet.ts';
import {HDSegwitP2SHWallet} from '../class/wallets/hd-segwit-p2sh-wallet.ts';
import {HDTaprootWallet} from '../class/wallets/hd-taproot-wallet.ts';
import {lif_network, LIF_COIN_TYPE} from './network.ts';
import {lif_wallet_class} from './lif_wallet.ts';

const XPUB_VERSION = 0x0488b21e;

// an extended public key, with other version bytes
export function xpub_version_set(xpub: string, version: number): string {
  let data = b58.decode(xpub);
  let res = new Uint8Array(data.length);
  res.set(data);
  new DataView(res.buffer).setUint32(0, version);
  return b58.encode(res);
}

// an extended public key, as its written on LIF: Lpub...
export function lpub_of(xpub: string): string {
  return xpub_version_set(xpub, lif_network.bip32.public);
}

// The base class keeps its extended public key as an xpub or a ypub, which
// say the kind of address on Bitcoin. LIF has one prefix, Lpub: its the one
// shown for every kind. The base class reads a key of any prefix.
function lpub_class<T extends new(...args: any[])=>any>(Base: T){
  return class extends Base {
    getXpub(){
      return lpub_of(super.getXpub());
    }
  };
}

// Native SegWit (BIP84), lif1q... addresses: the default LIF wallet
export class HDLifWallet extends lif_wallet_class(HDSegwitBech32Wallet, {
  type: 'HDlif',
  typeReadable: 'LIF HD SegWit (BIP84)',
  derivationPath: `m/84'/${LIF_COIN_TYPE}'/0'`,
}){
  // the base class keeps its extended public key as a zpub: here its an
  // Lpub
  _xpubToZpub(xpub: string): string {
    return lpub_of(xpub);
  }

  _zpubToXpub(lpub: string): string {
    return xpub_version_set(lpub, XPUB_VERSION);
  }
}

// Legacy (BIP44), 1... addresses
export class HDLifLegacyWallet extends lpub_class(lif_wallet_class(
  HDLegacyP2PKHWallet, {
  type: 'HDlifLegacy',
  typeReadable: 'LIF HD Legacy (BIP44 P2PKH)',
  derivationPath: `m/44'/${LIF_COIN_TYPE}'/0'`,
})){}

// SegWit wrapped in P2SH (BIP49), 3... addresses
export class HDLifP2SHWallet extends lpub_class(lif_wallet_class(
  HDSegwitP2SHWallet, {
  type: 'HDlifP2SH',
  typeReadable: 'LIF HD SegWit (BIP49 P2SH)',
  derivationPath: `m/49'/${LIF_COIN_TYPE}'/0'`,
})){}

// Taproot (BIP86), lif1p... addresses
export class HDLifTaprootWallet extends lpub_class(lif_wallet_class(
  HDTaprootWallet, {
  type: 'HDlifTaproot',
  typeReadable: 'LIF HD Taproot (BIP86)',
  derivationPath: `m/86'/${LIF_COIN_TYPE}'/0'`,
})){}

// the kinds of LIF HD wallet. The first is the default
export const hd_lif_wallets = [HDLifWallet, HDLifLegacyWallet,
  HDLifP2SHWallet, HDLifTaprootWallet];
