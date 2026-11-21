export const BitcoinUnit = {
  BTC: 'BTC',
  SATS: 'sats',
  LOCAL_CURRENCY: 'local_currency',
  MAX: 'MAX',
} as const;
export type BitcoinUnit = (typeof BitcoinUnit)[keyof typeof BitcoinUnit];

/**
 * The coin of a network, when it is not Bitcoin: how its amounts are shown.
 * A wallet tells its coin (`wallet.coin`). The units stay the same kinds: `BitcoinUnit.BTC` is one coin,
 * `BitcoinUnit.SATS` its smallest part.
 */
export type TCoin = {
  /** the names of its units, as shown to the user */
  units: { [BitcoinUnit.BTC]: string; [BitcoinUnit.SATS]: string };
  /**
   * The value of one coin, in one currency (`currency` is the key of a FiatUnit, for example 'USD').
   * The coin may update `rate` at any time. A coin without it has no value in currency.
   */
  price?: { currency: string; rate: number };
  /** The scheme of its payment links: `<uriScheme>:<address>?amount=...`. A coin without it uses 'bitcoin'. */
  uriScheme?: string;
};

export const Chain = {
  ONCHAIN: 'ONCHAIN',
  OFFCHAIN: 'OFFCHAIN',
} as const;
export type Chain = (typeof Chain)[keyof typeof Chain];
