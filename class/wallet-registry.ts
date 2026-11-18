import type { ImageSourcePropType } from 'react-native';
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

/**
 * What the Add Wallet screen gives to an option, to decide if it is shown and to create its wallet
 */
export type TAddWalletContext = {
  /** the name the user typed. Empty when none was typed */
  label: string;
  /** `id` of the option that is selected */
  selectedId: string;
  /** how many times the button of an option was pressed */
  pressCount: (id: string) => number;
  /** entropy provided by the user for the new wallet, if any */
  entropy?: Uint8Array;
  /** the kind of on-chain wallet chosen in the menu of the screen */
  selectedIndex: number;
  /** the LNDHub address typed in the screen, or the stored one */
  walletBaseURI: string;
  hasStoredLndHub: boolean;
  setIsLoading: (value: boolean) => void;
  addWallet: (wallet: TWallet) => void;
  saveToDisk: () => Promise<void>;
  navigate: (...args: any[]) => void;
  goBack: () => void;
};

/**
 * A button of the Add Wallet screen, and what Create does when it is the selected one
 */
export type TAddWalletOption = {
  /** also the `selectedWalletType` route param of the screen */
  id: string;
  /** the buttons are shown by ascending order */
  order: number;
  testID: string;
  button: {
    image: ImageSourcePropType;
    title: string;
    explain: string;
    /** a color of the theme */
    borderColorActive: string;
  };
  /** selecting it keeps the entropy the user provided. Otherwise the user is asked to drop it */
  keepsEntropy?: boolean;
  /** default: always shown */
  isVisible?: (context: TAddWalletContext) => boolean;
  /** default: Create is enabled */
  isCreateDisabled?: (context: TAddWalletContext) => boolean;
  create: (context: TAddWalletContext) => void | Promise<void>;
};

const addWalletOptions: Record<string, TAddWalletOption> = {};

export function registerAddWalletOption(option: TAddWalletOption): void {
  addWalletOptions[option.id] = option;
}

export function getAddWalletOptions(): TAddWalletOption[] {
  return Object.values(addWalletOptions).sort((a, b) => a.order - b.order);
}
