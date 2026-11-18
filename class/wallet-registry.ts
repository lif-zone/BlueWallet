import type { TWallet } from './wallets/types';

/**
 * A kind of wallet the app knows. Each wallet class registers its own.
 */
export type TWalletType = {
  /** the `type` of the wallet class, as it is saved with each wallet */
  type: string;
  /**
   * Restores a saved wallet. `json` is the wallet as it was saved, `saved` is the same, parsed.
   * Returns undefined when the saved wallet should not be loaded.
   */
  load: (json: string, saved: Record<string, any>) => TWallet | undefined | Promise<TWallet | undefined>;
};

const walletTypes: Record<string, TWalletType> = {};

export function registerWalletType(walletType: TWalletType): void {
  walletTypes[walletType.type] = walletType;
}

export function getWalletType(type: string): TWalletType | undefined {
  return walletTypes[type];
}

export function getWalletTypes(): TWalletType[] {
  return Object.values(walletTypes);
}
