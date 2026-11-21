// Single-address wallets (one private key, WIF) on the LIF network:
// BlueWallet's single-address wallets, with the LIF network and Electrum
// client. They are made by Import Wallet only.
import {LegacyWallet} from '../class/wallets/legacy-wallet.ts';
import {SegwitP2SHWallet} from '../class/wallets/segwit-p2sh-wallet.ts';
import {SegwitBech32Wallet} from '../class/wallets/segwit-bech32-wallet.ts';
import {TaprootWallet} from '../class/wallets/taproot-wallet.ts';
import {lif_wallet_class} from './lif_wallet.ts';

// Native SegWit, a lif1q... address
export class LifSegwitWallet extends lif_wallet_class(SegwitBech32Wallet, {
  type: 'lifSegwitBech32',
  typeReadable: 'LIF SegWit (P2WPKH)',
}){}

// Legacy, a 1... address
export class LifLegacyWallet extends lif_wallet_class(LegacyWallet, {
  type: 'lifLegacy',
  typeReadable: 'LIF Legacy (P2PKH)',
}){}

// SegWit wrapped in P2SH, a 3... address
export class LifP2SHWallet extends lif_wallet_class(SegwitP2SHWallet, {
  type: 'lifSegwitP2SH',
  typeReadable: 'LIF SegWit (P2SH)',
}){}

// Taproot, a lif1p... address
export class LifTaprootWallet extends lif_wallet_class(TaprootWallet, {
  type: 'lifTaproot',
  typeReadable: 'LIF Taproot (P2TR)',
}){}

// the kinds of LIF single-address wallet. The first is the default
export const key_lif_wallets = [LifSegwitWallet, LifLegacyWallet,
  LifP2SHWallet, LifTaprootWallet];
