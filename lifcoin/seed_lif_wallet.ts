// HD wallets on the LIF network of a seed that is not a BIP39 mnemonic: an
// Electrum seed, or SLIP39 shares. BlueWallet's wallets of these seeds,
// with the LIF network and Electrum client. They are made by Import Wallet
// only.
import {sha256} from '@noble/hashes/sha256';
import {HDSegwitElectrumSeedP2WPKHWallet}
  from '../class/wallets/hd-segwit-electrum-seed-p2wpkh-wallet.ts';
import {HDLegacyElectrumSeedP2PKHWallet}
  from '../class/wallets/hd-legacy-electrum-seed-p2pkh-wallet.ts';
import {SLIP39SegwitBech32Wallet, SLIP39LegacyP2PKHWallet,
  SLIP39SegwitP2SHWallet} from '../class/wallets/slip39-wallets.ts';
import {uint8ArrayToHex} from '../blue_modules/uint8array-extras/index.js';
import {LIF_COIN_TYPE} from './network.ts';
import {lif_wallet_class} from './lif_wallet.ts';
import {lpub_class} from './hd_lif_wallet.ts';

// An Electrum seed has paths without a coin type (m/0', m): the keys are
// the ones of the Bitcoin wallet of the seed.
export class LifElectrumSegwitWallet extends lpub_class(lif_wallet_class(
  HDSegwitElectrumSeedP2WPKHWallet, {
  type: 'HDlifSegwitElectrumSeed',
  typeReadable: 'LIF HD Electrum (BIP32 P2WPKH)',
  derivationPath: "m/0'",
})){}

export class LifElectrumLegacyWallet extends lpub_class(lif_wallet_class(
  HDLegacyElectrumSeedP2PKHWallet, {
  type: 'HDlifLegacyElectrumSeed',
  typeReadable: 'LIF HD Legacy Electrum (BIP32 P2PKH)',
  derivationPath: 'm',
})){}

// The ID of a SLIP39 wallet is made of its shares only: the LIF wallet of
// the same shares has another one, by its kind.
// The base class sets getID on each wallet (not on the class): so its done
// here.
function slip39_lif_class<T extends new(...args: any[])=>any>(Base: T){
  return class extends Base {
    _slip39_id = this.getID;
    getID = ()=>uint8ArrayToHex(sha256(
      this.getSavedType()+this._slip39_id()));
  };
}

export class LifSLIP39SegwitWallet extends slip39_lif_class(lpub_class(
  lif_wallet_class(SLIP39SegwitBech32Wallet, {
  type: 'SLIP39lifSegwitBech32',
  typeReadable: 'LIF SLIP39 SegWit (Bech32)',
  derivationPath: `m/84'/${LIF_COIN_TYPE}'/0'`,
}))){}

export class LifSLIP39LegacyWallet extends slip39_lif_class(lpub_class(
  lif_wallet_class(SLIP39LegacyP2PKHWallet, {
  type: 'SLIP39lifLegacyP2PKH',
  typeReadable: 'LIF SLIP39 Legacy (P2PKH)',
  derivationPath: `m/44'/${LIF_COIN_TYPE}'/0'`,
}))){}

export class LifSLIP39P2SHWallet extends slip39_lif_class(lpub_class(
  lif_wallet_class(SLIP39SegwitP2SHWallet, {
  type: 'SLIP39lifSegwitP2SH',
  typeReadable: 'LIF SLIP39 SegWit (P2SH)',
  derivationPath: `m/49'/${LIF_COIN_TYPE}'/0'`,
}))){}

export const seed_lif_wallets = [LifElectrumSegwitWallet,
  LifElectrumLegacyWallet, LifSLIP39SegwitWallet, LifSLIP39LegacyWallet,
  LifSLIP39P2SHWallet];

// The LIF wallets a seed text is valid for: of one seed format, its default
// kind first.
export function lif_seed_wallets(text: string, passphrase?: string){
  let wallets = [];
  for (let LifWallet of seed_lif_wallets){
    let wallet = new LifWallet();
    try {
      wallet.setSecret(text);
      if (passphrase)
        wallet.setPassphrase(passphrase);
      if (wallet.validateMnemonic())
        wallets.push(wallet);
    } catch(e){}
  }
  return wallets;
}
