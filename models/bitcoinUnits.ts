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
};

/**
 * True when amounts of the coin have a value in the currency of the user. Only Bitcoin has one: its the only coin
 * with a price source. The amounts of another coin are shown without a value in currency.
 */
export const coinHasFiat = (coin?: TCoin): boolean => !coin;

export const Chain = {
  ONCHAIN: 'ONCHAIN',
  OFFCHAIN: 'OFFCHAIN',
} as const;
export type Chain = (typeof Chain)[keyof typeof Chain];
