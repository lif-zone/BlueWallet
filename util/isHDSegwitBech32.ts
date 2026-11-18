import { HDSegwitBech32Wallet } from '../class/wallets/hd-segwit-bech32-wallet';
import { TWallet } from '../class/wallets/types';

/**
 * True for a BIP84 wallet (HD, native segwit): the one of Bitcoin, or the one of another coin that is built on it.
 * The other wallet types that extend it (SLIP39, Electrum seed) are not included.
 */
export function isHDSegwitBech32(wallet?: TWallet | null): wallet is HDSegwitBech32Wallet {
  if (!wallet) return false;
  return wallet.type === HDSegwitBech32Wallet.type || (wallet instanceof HDSegwitBech32Wallet && !!wallet.coin);
}
