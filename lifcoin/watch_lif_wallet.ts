// Watch-only wallet on the LIF network: of one address, or of an extended
// public key (Lpub). BlueWallet's watch-only wallet, with the LIF network,
// Electrum client and HD wallet classes.
import {WatchOnlyWallet} from '../class/wallets/watch-only-wallet.ts';
import {lif_wallet_class} from './lif_wallet.ts';
import {HDLifWallet, HDLifLegacyWallet, HDLifP2SHWallet,
  HDLifTaprootWallet, lpub_of} from './hd_lif_wallet.ts';

// the kinds of address an Lpub may be of. The first is the default
const hd_kinds = {
  p2wpkh: HDLifWallet,
  p2pkh: HDLifLegacyWallet,
  'p2sh(p2wpkh)': HDLifP2SHWallet,
  p2tr: HDLifTaprootWallet,
};

export class LifWatchOnlyWallet extends lif_wallet_class(WatchOnlyWallet, {
  type: 'lifWatchOnly',
  typeReadable: 'LIF Watch-only',
}){
  _hdWalletClasses(){
    return hd_kinds;
  }

  isHd(){
    return this.secret.startsWith('Lpub');
  }
}

// The LIF watch-only wallets a text may be of: an address (lif1..., or a
// 1... / 3... one, which is written the same on Bitcoin), or an extended
// public key (Lpub..., or an xpub..., which may be of any network). A key
// does not say its kind of address: one wallet of each kind.
export function lif_watch_only_wallets(text: string): LifWatchOnlyWallet[] {
  text = text.trim().replace(/^lifcoin:/i, '');
  if (/^lif1/i.test(text))
    text = text.toLowerCase();
  if (!/^(Lpub|xpub)[1-9A-HJ-NP-Za-km-z]+$/.test(text)){
    let wallet = new LifWatchOnlyWallet();
    wallet.setSecret(text);
    return wallet.valid() ? [wallet] : [];
  }
  let lpub: string;
  try {
    lpub = lpub_of(text);
  } catch(e){
    return [];
  }
  let wallets = [];
  for (let [kind, HDWallet] of Object.entries(hd_kinds)){
    let wallet = new LifWatchOnlyWallet();
    wallet.setSecret(lpub);
    if (!wallet.isXpubValid())
      return [];
    wallet.segwitType = kind;
    // also makes the ID of the wallet differ by kind
    wallet._derivationPath = HDWallet.derivationPath;
    wallet.init();
    wallets.push(wallet);
  }
  return wallets;
}
