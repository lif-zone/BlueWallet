import * as BlueElectrum from '../blue_modules/BlueElectrum';
import type { TWalletElectrum } from '../class/wallets/legacy-wallet';

export enum NetworkTransactionFeeType {
  FAST = 'Fast',
  MEDIUM = 'MEDIUM',
  SLOW = 'SLOW',
  CUSTOM = 'CUSTOM',
}

export class NetworkTransactionFee {
  static StorageKey = 'NetworkTransactionFee';

  /**
   * Where the fees of a network are cached. Bitcoin keeps the key it always had
   */
  static storageKeyFor(network: { bech32: string }): string {
    return network.bech32 === 'bc' ? NetworkTransactionFee.StorageKey : NetworkTransactionFee.StorageKey + '_' + network.bech32;
  }

  public fastestFee: number;
  public mediumFee: number;
  public slowFee: number;

  constructor(fastestFee = 2, mediumFee = 1, slowFee = 1) {
    this.fastestFee = fastestFee;
    this.mediumFee = mediumFee;
    this.slowFee = slowFee;
  }
}

export default class NetworkTransactionFees {
  /**
   * @param electrum the Electrum client of the network to ask (`wallet.electrum`). Default: Bitcoin
   */
  static async recommendedFees(
    electrum: Pick<TWalletElectrum, 'estimateFees' | 'isDisabled'> = BlueElectrum,
  ): Promise<NetworkTransactionFee> {
    try {
      const isDisabled = await electrum.isDisabled();
      if (isDisabled) {
        throw new Error('Electrum is disabled. Dont attempt to fetch fees');
      }
      const response = await electrum.estimateFees();
      if (response.fast === response.medium) {
        // exception, if fees are equal lets bump priority fee + 1 so actual priority tx is above the rest
        if (response.medium === response.slow) {
          // another exception, bump middle one just a bit
          return new NetworkTransactionFee(response.fast + 1, response.medium + 0.5, response.slow);
        }
        return new NetworkTransactionFee(response.fast + 1, response.medium, response.slow);
      }

      if (response.medium === response.slow) {
        // another exception, bump middle one just a bit
        return new NetworkTransactionFee(response.fast, response.medium + 0.5, response.slow);
      }

      return new NetworkTransactionFee(response.fast, response.medium, response.slow);
    } catch (err) {
      console.warn(err);
      return new NetworkTransactionFee(2, 1.5, 1);
    }
  }
}
