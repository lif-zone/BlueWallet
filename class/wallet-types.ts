/**
 * Every wallet type of the app. Importing a wallet module registers it (see wallet-registry.ts),
 * so this is the place where a wallet type is added to the app.
 */
import './wallets/legacy-wallet';
import './wallets/segwit-bech32-wallet';
import './wallets/segwit-p2sh-wallet';
import './wallets/taproot-wallet';
import './wallets/watch-only-wallet';
import './wallets/hd-legacy-p2pkh-wallet';
import './wallets/hd-segwit-p2sh-wallet';
import './wallets/hd-segwit-bech32-wallet';
import './wallets/hd-taproot-wallet';
import './wallets/hd-legacy-breadwallet-wallet';
import './wallets/hd-legacy-electrum-seed-p2pkh-wallet';
import './wallets/hd-segwit-electrum-seed-p2wpkh-wallet';
import './wallets/hd-aezeed-wallet';
import './wallets/slip39-wallets';
import './wallets/multisig-hd-wallet';
import './wallets/lightning-custodian-wallet';
import './wallets/lightning-ark-wallet.ts';
