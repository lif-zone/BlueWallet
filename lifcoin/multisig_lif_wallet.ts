// Multisig vault on the LIF network: BlueWallet's vault, with the LIF
// network, Electrum client and derivation paths.
// The keys of the cosigners are written as in a Bitcoin vault (xpub, Ypub,
// Zpub: the prefix says the kind of address). A LIF vault is told from a
// Bitcoin one by the coin type of its derivation path.
import {MultisigHDWallet} from '../class/wallets/multisig-hd-wallet.ts';
import {lif_wallet_class} from './lif_wallet.ts';
import {LIF_COIN_TYPE} from './network.ts';

export class LifMultisigWallet extends lif_wallet_class(MultisigHDWallet, {
  type: 'HDlifMultisig',
  typeReadable: 'LIF Multisig Vault',
}){
  static PATH_NATIVE_SEGWIT = `m/48'/${LIF_COIN_TYPE}'/0'/2'`;
  static PATH_WRAPPED_SEGWIT = `m/48'/${LIF_COIN_TYPE}'/0'/1'`;
  // BIP45 has no coin type: the LIF one is added to it
  static PATH_LEGACY = `m/45'/${LIF_COIN_TYPE}'`;

  // true for the derivation path of a LIF vault
  static owns_path(path: string): boolean {
    return path.startsWith(`m/48'/${LIF_COIN_TYPE}'/`) ||
      path.startsWith(LifMultisigWallet.PATH_LEGACY);
  }

  // the base class tells the kind of address by the Bitcoin paths
  setDerivationPath(path: string){
    super.setDerivationPath(path);
    if (path==LifMultisigWallet.PATH_NATIVE_SEGWIT)
      this.setNativeSegwit();
    else if (path==LifMultisigWallet.PATH_WRAPPED_SEGWIT)
      this.setWrappedSegwit();
    else if (path==LifMultisigWallet.PATH_LEGACY)
      this.setLegacy();
  }
}
