// The LIF coin network (lifcoin). As Bitcoin, with another genesis block:
// only the bech32 prefix and the extended key versions differ in a wallet.
// From lif-coin/lib/protocol/networks.js.
import * as bitcoin from 'bitcoinjs-lib';

export const lif_network: bitcoin.Network = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'lif',
  bip32: {
    public: 0x5d6413db, // Lpub
    private: 0x5d631e9c,
  },
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
};

// The value of one LIF in USD, until the network gives a price: a later
// price update sets lif_coin.price.rate.
export const LIF_USD_DEFAULT = 0.01;

// how LIF amounts are shown: 1 LIF is 100,000,000 sats. And its price
export const lif_coin = {
  units: {BTC: 'LIF', sats: 'sats'},
  price: {currency: 'USD', rate: LIF_USD_DEFAULT},
};

// BIP44 coin type: m/84'/1842'/0'
export const LIF_COIN_TYPE = 1842;

// the Electrum server of the LIF node, as a lifnet topic
// (lif:net/lifcoin/electrum)
export const LIF_ELECTRUM_TOPIC = 'lifcoin/electrum';

// The usual fee on LIF is about 5000 sat/vbyte (50 LIF per MB), which is the
// highest that bitcoinjs-lib accepts by default.
export const LIF_MAX_FEE_RATE = 1000000;
