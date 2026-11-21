// Makes the LIF variant of a BlueWallet wallet class: the same wallet, on the
// LIF network, with the LIF Electrum client and coin.
import type {TWalletElectrum} from '../class/wallets/legacy-wallet.ts';
import {lif_network, lif_coin, LIF_MAX_FEE_RATE} from './network.ts';
import * as lif_electrum from './electrum.ts';
import {lif_price_update} from './price.ts';

type TLifWalletOpt = {
  // as it is saved with each wallet
  type: string;
  typeReadable: string;
  // of an HD wallet
  derivationPath?: string;
};

export function lif_wallet_class<T extends new(...args: any[])=>any>(
  Base: T, opt: TLifWalletOpt)
{
  class LifWallet extends Base {
    static readonly type = opt.type;
    static readonly typeReadable = opt.typeReadable;
    static readonly derivationPath = opt.derivationPath;
    // @ts-ignore: override
    public readonly type = opt.type;
    // @ts-ignore: override
    public readonly typeReadable = opt.typeReadable;

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

    // An address of the older kinds (1..., 3...) is written the same on
    // Bitcoin and on LIF: one copied from a Bitcoin wallet would be paid by
    // mistake. Its accepted, after the user confirms.
    addressWarning(address: string): string|undefined {
      if (address.trim().toLowerCase().startsWith(this.bech32Prefix))
        return;
      if (!this.isAddressValid(address))
        return;
      return 'This is not a lif1 address. Addresses of this kind are '
        +'written the same on Bitcoin and on LIF. Send only if you know '
        +'that it is a LIF address: if it is a Bitcoin address, the owner '
        +'may not be able to reach these coins. Send to this address?';
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
  return LifWallet;
}
