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

// what a descriptor says of its key: the kind of address
const desc_kinds: Record<string, string> = {
  'wpkh(': 'p2wpkh',
  'pkh(': 'p2pkh',
  'sh(wpkh(': 'p2sh(p2wpkh)',
  'tr(': 'p2tr',
};
// and what the first step of its path says (m/84'/...)
const purpose_kinds: Record<string, string> = {
  "84'": 'p2wpkh',
  "44'": 'p2pkh',
  "49'": 'p2sh(p2wpkh)',
  "86'": 'p2tr',
};

// An extended public key, as text: bare (Lpub...), with its origin
// ([fingerprint/path]Lpub...), or in a descriptor
// (wpkh([fingerprint/path]Lpub.../0/*)#checksum), which is how the "Wallet
// XPUB" screen shows it. An xpub... may be of any network: accepted too.
function key_parse(text: string){
  let m = text.match(new RegExp('^(wpkh\\(|pkh\\(|sh\\(wpkh\\(|tr\\()?'+
    "(?:\\[([0-9a-fA-F]{8})((?:/\\d+['hH]?)+)\\])?"+
    '((?:Lpub|xpub)[1-9A-HJ-NP-Za-km-z]+)'+
    '(?:/[\\d<>;*/]+)?\\)*(?:#[0-9a-z]+)?$'));
  if (!m)
    return;
  let [, fn, fingerprint, path, key] = m;
  if (path)
    path = 'm'+path.replace(/[hH]/g, "'");
  let kind = fn ? desc_kinds[fn] :
    path ? purpose_kinds[path.split('/')[1]] : undefined;
  return {kind, fingerprint, path, key};
}

// The LIF watch-only wallets a text may be of: an address (lif1..., or a
// 1... / 3... one, which is written the same on Bitcoin), or an extended
// public key (see key_parse). A bare key does not say its kind of address:
// one wallet of each kind. A descriptor, or a path, says it: one wallet.
export function lif_watch_only_wallets(text: string): LifWatchOnlyWallet[] {
  text = text.trim().replace(/^lifcoin:/i, '').replace(/\?.*$/, '');
  if (/^lif1/i.test(text))
    text = text.toLowerCase();
  let parsed = key_parse(text);
  if (!parsed){
    // base setSecret() reads a descriptor as one of Bitcoin's keys
    if (/[(\[]/.test(text))
      return [];
    let wallet = new LifWatchOnlyWallet();
    wallet.setSecret(text);
    return wallet.valid() ? [wallet] : [];
  }
  let lpub: string;
  try {
    lpub = lpub_of(parsed.key);
  } catch(e){
    return [];
  }
  let wallets = [];
  for (let [kind, HDWallet] of Object.entries(hd_kinds)){
    if (parsed.kind && parsed.kind!=kind)
      continue;
    let wallet = new LifWatchOnlyWallet();
    wallet.setSecret(lpub);
    if (!wallet.isXpubValid())
      return [];
    wallet.segwitType = kind;
    // also makes the ID of the wallet differ by kind
    wallet._derivationPath = parsed.path||HDWallet.derivationPath;
    if (parsed.fingerprint)
      wallet.setMasterFingerprintFromHex(parsed.fingerprint);
    wallet.init();
    wallets.push(wallet);
  }
  return wallets;
}
