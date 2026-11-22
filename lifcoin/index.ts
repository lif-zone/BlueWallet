// The LIF coin in the app: its wallet type, its option on the Add Wallet
// screen, and its wallet in Import Wallet. Imported by class/wallet-types.ts.
import {registerWalletType, registerAddWalletOption,
  registerMnemonicImporter, registerWifImporter, registerWatchOnlyImporter,
  registerMultisigWallet, registerSeedImporter}
  from '../class/wallet-registry.ts';
import triggerHapticFeedback, {HapticFeedbackTypes}
  from '../blue_modules/hapticFeedback.ts';
import loc from '../loc/index.ts';
import presentAlert from '../components/Alert.ts';
import {HDLifWallet, HDLifLegacyWallet, HDLifTaprootWallet,
  hd_lif_wallets} from './hd_lif_wallet.ts';
import {key_lif_wallets} from './key_lif_wallet.ts';
import {LifWatchOnlyWallet, lif_watch_only_wallets}
  from './watch_lif_wallet.ts';
import {LifMultisigWallet} from './multisig_lif_wallet.ts';
import {seed_lif_wallets, lif_seed_wallets} from './seed_lif_wallet.ts';

for (let LifWallet of [...hd_lif_wallets, ...key_lif_wallets,
  ...seed_lif_wallets])
{
  registerWalletType({
    type: LifWallet.type,
    load: json=>LifWallet.fromJson(json),
  });
}

// the kinds of wallet of the menu of the Add Wallet screen, by its order:
// Native SegWit, Legacy, Taproot
const add_wallet_kinds = [HDLifWallet, HDLifLegacyWallet, HDLifTaprootWallet];

registerAddWalletOption({
  id: 'LIF',
  // after Bitcoin
  order: 15,
  testID: 'ActivateLifButton',
  button: {
    image: {uri: import.meta.resolve('./lifcoin.png')},
    title: 'Lifcoin',
    explain: 'LIF wallet, on the LIF network',
    borderColorActive: 'newBlue',
  },
  // entropy the user provided (dice rolls) is mixed into the new wallet
  keepsEntropy: true,
  usesKindMenu: true,
  create: async({label, entropy, selectedIndex, addWallet, saveToDisk,
    navigate})=>
  {
    let LifWallet = add_wallet_kinds[selectedIndex]||HDLifWallet;
    let wallet = new LifWallet();
    wallet.setLabel(label||loc.wallets.details_title);
    if (entropy){
      try {
        await wallet.generateFromEntropy(entropy);
      } catch(e){
        console.log(''+e);
        presentAlert({message: ''+e});
        return;
      }
    }
    else
      await wallet.generate();
    addWallet(wallet);
    await saveToDisk();
    triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
    navigate('PleaseBackup', {walletID: wallet.getID()});
  },
});

// Import Wallet: a mnemonic may be of a LIF wallet
registerMnemonicImporter((mnemonic, passphrase)=>hd_lif_wallets.map(
  LifWallet=>{
    let wallet = new LifWallet();
    wallet.setSecret(mnemonic);
    if (passphrase)
      wallet.setPassphrase(passphrase);
    return wallet;
  }));

// Import Wallet: a private key (WIF) may be of a LIF single-address wallet
registerWifImporter(wif=>key_lif_wallets.map(LifWallet=>{
  let wallet = new LifWallet();
  wallet.setSecret(wif);
  return wallet;
}));

registerWalletType({
  type: LifWatchOnlyWallet.type,
  load: json=>{
    let wallet = LifWatchOnlyWallet.fromJson(json);
    wallet.init();
    if (wallet.isHd() && !wallet.isXpubValid())
      return;
    return wallet;
  },
});

// Import Wallet: an address or an extended public key may be of a LIF
// watch-only wallet
registerWatchOnlyImporter(lif_watch_only_wallets);

// Multisig vault: its own option on the Add Wallet screen, which opens the
// screens that create a vault. Import Wallet tells a LIF vault by its path.
registerWalletType({
  type: LifMultisigWallet.type,
  load: json=>LifMultisigWallet.fromJson(json),
});

registerMultisigWallet({
  id: LifMultisigWallet.type,
  Wallet: LifMultisigWallet,
  ownsPath: LifMultisigWallet.owns_path,
});

registerAddWalletOption({
  id: 'LIF_VAULT',
  // after the Bitcoin vault
  order: 25,
  testID: 'ActivateLifVaultButton',
  button: {
    image: {uri: import.meta.resolve('./lifcoin.png')},
    title: 'Lifcoin Multisig Vault',
    explain: 'LIF multisig vault, for large amounts',
    borderColorActive: 'foregroundColor',
  },
  create: ({label, setIsLoading, navigate})=>{
    setIsLoading(false);
    navigate('WalletsAddMultisig', {
      walletLabel: label.trim()||'LIF '+loc.multisig.default_label,
      multisigId: LifMultisigWallet.type,
    });
  },
});

// Import Wallet: an Electrum seed or SLIP39 shares may be of a LIF wallet
registerSeedImporter(lif_seed_wallets);
