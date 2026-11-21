import assert from 'assert';

import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import { registerAddWalletOption, TAddWalletContext } from '../../class/wallet-registry';
import { HDLegacyP2PKHWallet } from '../../class/wallets/hd-legacy-p2pkh-wallet';
import { HDSegwitBech32Wallet } from '../../class/wallets/hd-segwit-bech32-wallet';
import { HDTaprootWallet } from '../../class/wallets/hd-taproot-wallet';
import { LightningArkWallet } from '../../class/wallets/lightning-ark-wallet.ts';
import { LightningCustodianWallet } from '../../class/wallets/lightning-custodian-wallet';
import presentAlert from '../../components/Alert';
import { buttonDetails } from '../../components/WalletButton';
import { errorMessage } from '../../helpers/errorMessage';
import loc from '../../loc';
import { Chain } from '../../models/bitcoinUnits';

/**
 * The options of the Add Wallet screen: its buttons, and what Create does for each.
 * Another wallet type adds its own with registerAddWalletOption().
 */

const index2walletType: Record<number, { text: string; subtitle: string; walletType: string }> = {
  0: { subtitle: 'p2wpkh/HD', text: `${loc.multisig.native_segwit_title}`, walletType: HDSegwitBech32Wallet.type },
  1: { subtitle: 'p2pkh/HD', text: `${loc.multisig.legacy_title}`, walletType: HDLegacyP2PKHWallet.type },
  2: { subtitle: 'p2tr/HD', text: 'Taproot', walletType: HDTaprootWallet.type },
  3: {
    // lightning
    subtitle: LightningCustodianWallet.subtitleReadable,
    text: LightningCustodianWallet.typeReadable,
    walletType: LightningCustodianWallet.type,
  },
};

const createOnchainWallet = async ({ label, entropy, selectedIndex, addWallet, saveToDisk, navigate, goBack }: TAddWalletContext) => {
  let w: HDSegwitBech32Wallet | HDLegacyP2PKHWallet | HDTaprootWallet;

  for (let c = 0; c < Object.values(index2walletType).length; c++) {
    if (c === selectedIndex) {
      switch (index2walletType[c].walletType) {
        case HDTaprootWallet.type:
          w = new HDTaprootWallet();
          w.setLabel(label || loc.wallets.details_title);
          break;
        case HDLegacyP2PKHWallet.type:
          w = new HDLegacyP2PKHWallet();
          w.setLabel(label || loc.wallets.details_title);
          break;
        case HDSegwitBech32Wallet.type:
          w = new HDSegwitBech32Wallet();
          w.setLabel(label || loc.wallets.details_title);
          break;
      }
    }
  }

  assert(w!, 'Internal error: could not decide which wallet to create');

  if (entropy) {
    try {
      await w.generateFromEntropy(entropy);
    } catch (e) {
      console.log(String(e));
      presentAlert({ message: String(e) });
      return;
    }
  } else {
    await w.generate();
  }
  addWallet(w);
  await saveToDisk();

  triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
  if (w.type === HDLegacyP2PKHWallet.type || w.type === HDSegwitBech32Wallet.type || w.type === HDTaprootWallet.type) {
    navigate('PleaseBackup', {
      walletID: w.getID(),
    });
  } else {
    goBack();
  }
};

const createLightningWallet = async ({ label, walletBaseURI, setIsLoading, addWallet, saveToDisk, navigate }: TAddWalletContext) => {
  const wallet = new LightningCustodianWallet();
  wallet.setLabel(label || loc.wallets.details_title);

  try {
    const lndhub = walletBaseURI?.trim();
    if (lndhub) {
      const isValidNodeAddress = await LightningCustodianWallet.isValidNodeAddress(lndhub);
      if (isValidNodeAddress) {
        wallet.setBaseURI(lndhub);
        await wallet.init();
      } else {
        throw new Error('The provided node address is not valid LNDHub node.');
      }
    }
    await wallet.createAccount();
    await wallet.authorize();
  } catch (Err) {
    setIsLoading(false);
    console.warn('lnd create failure', Err);
    if (errorMessage(Err)) {
      return presentAlert({ message: errorMessage(Err) });
    } else {
      return presentAlert({ message: loc.wallets.add_lndhub_error });
    }
    // giving app, not adding anything
  }

  await wallet.generate();
  addWallet(wallet);
  await saveToDisk();

  triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
  navigate('PleaseBackupLNDHub', {
    walletID: wallet.getID(),
  });
};

const createLightningArkWallet = async ({ label, setIsLoading, addWallet, saveToDisk, navigate }: TAddWalletContext) => {
  const wallet = new LightningArkWallet();
  wallet.setLabel(label || loc.wallets.details_title);
  try {
    await wallet.generate();
  } catch (Err) {
    setIsLoading(false);
    console.warn('lightning ark create failure', Err);
    return presentAlert({ message: errorMessage(Err) });
  }

  addWallet(wallet);
  await saveToDisk();

  triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
  navigate('PleaseBackupLNDHub', {
    walletID: wallet.getID(),
  });
};

registerAddWalletOption({
  id: Chain.ONCHAIN,
  order: 10,
  testID: 'ActivateBitcoinButton',
  button: buttonDetails.Bitcoin,
  keepsEntropy: true,
  usesKindMenu: true,
  create: createOnchainWallet,
});

registerAddWalletOption({
  id: 'VAULT',
  order: 20,
  testID: 'ActivateVaultButton',
  button: buttonDetails.Vault,
  create: ({ label, setIsLoading, navigate }) => {
    setIsLoading(false);
    navigate('WalletsAddMultisig', { walletLabel: label.trim().length > 0 ? label : loc.multisig.default_label });
  },
});

registerAddWalletOption({
  id: 'ARK',
  order: 30,
  testID: 'ActivateLightningArkButton',
  button: buttonDetails.LightningArk,
  // hidden: shown after 20 presses on the Bitcoin button
  isVisible: ({ pressCount }) => pressCount(Chain.ONCHAIN) >= 20,
  create: createLightningArkWallet,
});

registerAddWalletOption({
  id: Chain.OFFCHAIN,
  order: 40,
  testID: 'ActivateLightningButton',
  button: buttonDetails.Lightning,
  asksLndHub: true,
  isVisible: ({ selectedId, hasStoredLndHub }) => selectedId === Chain.OFFCHAIN || hasStoredLndHub,
  isCreateDisabled: ({ walletBaseURI }) => (walletBaseURI ?? '').trim().length === 0,
  create: createLightningWallet,
});
