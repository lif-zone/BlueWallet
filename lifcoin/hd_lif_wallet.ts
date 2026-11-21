// HD wallet (BIP39 mnemonic, BIP84 native segwit) on the LIF network.
// BlueWallet's HD SegWit wallet, with the LIF network, path and Electrum
// client.
import b58 from 'bs58check';
import {HDSegwitBech32Wallet}
  from '../class/wallets/hd-segwit-bech32-wallet.ts';
import type {TWalletElectrum} from '../class/wallets/legacy-wallet.ts';
import {lif_network, lif_coin, LIF_COIN_TYPE, LIF_MAX_FEE_RATE}
  from './network.ts';
import * as lif_electrum from './electrum.ts';
import {lif_price_update} from './price.ts';

const XPUB_VERSION = 0x0488b21e;

// an extended public key, with other version bytes
function xpub_version_set(xpub: string, version: number): string {
  let data = b58.decode(xpub);
  let res = new Uint8Array(data.length);
  res.set(data);
  new DataView(res.buffer).setUint32(0, version);
  return b58.encode(res);
}

export class HDLifWallet extends HDSegwitBech32Wallet {
  static readonly type = 'HDlif';
  static readonly typeReadable = 'LIF HD SegWit (BIP84)';
  // @ts-ignore: override
  public readonly type = HDLifWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = HDLifWallet.typeReadable;
  static readonly derivationPath = `m/84'/${LIF_COIN_TYPE}'/0'`;

  get electrum(): TWalletElectrum {
    return lif_electrum as unknown as TWalletElectrum;
  }

  get network(){
    return lif_network;
  }

  get coin(){
    // keeps the price fresh, while LIF amounts are shown
    lif_price_update();
    return lif_coin;
  }

  _newPsbt(){
    let psbt = super._newPsbt();
    psbt.setMaximumFeeRate(LIF_MAX_FEE_RATE);
    return psbt;
  }

  // the base class keeps its extended public key as a zpub: here its an
  // Lpub
  _xpubToZpub(xpub: string): string {
    return xpub_version_set(xpub, lif_network.bip32.public);
  }

  _zpubToXpub(lpub: string): string {
    return xpub_version_set(lpub, XPUB_VERSION);
  }

  // An address of the older kinds (1..., 3...) is written the same on
  // Bitcoin and on LIF: one copied from a Bitcoin wallet would be paid by
  // mistake. Its accepted, after the user confirms.
  addressWarning(address: string): string|undefined {
    if (address.trim().toLowerCase().startsWith(this.bech32Prefix))
      return;
    if (!this.isAddressValid(address))
      return;
    return 'This is not a lif1 address. Addresses of this kind are written '
      +'the same on Bitcoin and on LIF. Send only if you know that it is a '
      +'LIF address: if it is a Bitcoin address, the owner may not be able '
      +'to reach these coins. Send to this address?';
  }

  // Bitcoin only
  allowBIP47(){
    return false;
  }

  allowSilentPaymentSend(): boolean {
    return false;
  }

  allowPayJoin(){
    return false;
  }
}
