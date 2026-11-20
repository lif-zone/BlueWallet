// The LIF coin in the app: its wallet type, its option on the Add Wallet
// screen, and its wallet in Import Wallet. Imported by class/wallet-types.ts.
import {registerWalletType, registerAddWalletOption,
  registerMnemonicImporter} from '../class/wallet-registry.ts';
import triggerHapticFeedback, {HapticFeedbackTypes}
  from '../blue_modules/hapticFeedback.ts';
import loc from '../loc/index.ts';
import {HDLifWallet} from './hd_lif_wallet.ts';

registerWalletType({
  type: HDLifWallet.type,
  load: json=>HDLifWallet.fromJson(json),
});

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
  create: async({label, addWallet, saveToDisk, navigate})=>{
    let wallet = new HDLifWallet();
    wallet.setLabel(label||loc.wallets.details_title);
    await wallet.generate();
    addWallet(wallet);
    await saveToDisk();
    triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
    navigate('PleaseBackup', {walletID: wallet.getID()});
  },
});

// Import Wallet: a mnemonic may be of a LIF wallet
registerMnemonicImporter((mnemonic, passphrase)=>{
  let wallet = new HDLifWallet();
  wallet.setSecret(mnemonic);
  if (passphrase)
    wallet.setPassphrase(passphrase);
  return [wallet];
});
