import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Linking, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

import BlueButtonLink from '../../components/BlueButtonLink';
import BlueFormLabel from '../../components/BlueFormLabel';
import BlueText from '../../components/BlueText';
import { getAddWalletOptions, TAddWalletContext, TAddWalletOption } from '../../class/wallet-registry';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { useTheme } from '../../components/themes';
import WalletButton, { ButtonDetails } from '../../components/WalletButton';
import loc from '../../loc';
import { Chain } from '../../models/bitcoinUnits';
import { useStorage } from '../../hooks/context/useStorage';
import { getLNDHub } from '../../helpers/lndHub';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing20, BlueSpacing40 } from '../../components/BlueSpacing';
import './addWalletOptions';
import { hexToUint8Array } from '../../blue_modules/uint8array-extras';
import { resetScanWasBBQR } from '../../helpers/scan-qr.ts';

interface State {
  isLoading: boolean;
  walletBaseURI: string;
  selectedIndex: number;
  label: string;
  selectedWalletType: string;
}

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_WALLET_BASE_URI: 'SET_WALLET_BASE_URI',
  SET_SELECTED_INDEX: 'SET_SELECTED_INDEX',
  SET_LABEL: 'SET_LABEL',
  SET_SELECTED_WALLET_TYPE: 'SET_SELECTED_WALLET_TYPE',
} as const;
type ActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];

type TAction =
  | { type: typeof ActionTypes.SET_LOADING; payload: boolean }
  | { type: typeof ActionTypes.SET_WALLET_BASE_URI | typeof ActionTypes.SET_LABEL; payload: string }
  | { type: typeof ActionTypes.SET_SELECTED_INDEX; payload: number }
  | { type: typeof ActionTypes.SET_SELECTED_WALLET_TYPE; payload: string };

const initialState: State = {
  isLoading: true,
  walletBaseURI: '',
  selectedIndex: 0,
  label: '',
  selectedWalletType: Chain.ONCHAIN,
};

const walletReducer = (state: State, action: TAction): State => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_WALLET_BASE_URI:
      return { ...state, walletBaseURI: action.payload };
    case ActionTypes.SET_SELECTED_INDEX:
      return { ...state, selectedIndex: action.payload, selectedWalletType: Chain.ONCHAIN };
    case ActionTypes.SET_LABEL:
      return { ...state, label: action.payload };
    case ActionTypes.SET_SELECTED_WALLET_TYPE:
      return { ...state, selectedWalletType: action.payload };
    default:
      return state;
  }
};

type NavigationProps = NativeStackNavigationProp<AddWalletStackParamList, 'AddWallet'>;

type RouteProps = RouteProp<AddWalletStackParamList, 'AddWallet'>;

const WalletsAdd: React.FC = () => {
  const { colors } = useTheme();
  const layoutTransition = useMemo(() => Layout.springify().damping(16).stiffness(180), []);

  // State
  const [state, dispatch] = useReducer(walletReducer, initialState);
  // how many times the button of each option was pressed
  const [pressCounts, setPressCounts] = useState<Record<string, number>>({});
  const isLoading = state.isLoading;
  const walletBaseURI = state.walletBaseURI;
  const label = state.label;
  //
  const { addWallet, saveToDisk } = useStorage();
  const route = useRoute<RouteProps>();
  const {
    entropy: entropyHex,
    providedEntropyBytes,
    words,
    selectedIndex: routeSelectedIndex,
    selectedWalletType: routeSelectedWalletType,
  } = route.params || {};
  const selectedIndex = typeof routeSelectedIndex === 'number' ? routeSelectedIndex : state.selectedIndex;
  const selectedWalletType: string = routeSelectedWalletType ?? state.selectedWalletType;
  const entropy = entropyHex ? hexToUint8Array(entropyHex) : undefined;
  const entropyBytesProvided = providedEntropyBytes ?? 0;
  const { navigate, goBack, setParams } = useNavigation<NavigationProps>();
  const stylesHook = {
    advancedText: {
      color: colors.feeText,
    },
    entropyMixedText: {
      color: colors.alternativeTextColor,
    },
    label: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
    noPadding: {
      backgroundColor: colors.elevated,
    },
    root: {
      backgroundColor: colors.elevated,
    },
    lndUri: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
  };

  const hasStoredLndHub = (walletBaseURI ?? '').trim().length > 0;

  const setSelectedWalletType = useCallback(
    (value: string) => {
      setParams({
        selectedWalletType: value,
        selectedIndex,
      });
    },
    [selectedIndex, setParams],
  );

  const confirmResetEntropy = useCallback(
    (newWalletType: string) => {
      if (entropy || words) {
        Alert.alert(
          loc.wallets.add_entropy_reset_title,
          loc.wallets.add_entropy_reset_message,
          [
            {
              text: loc._.cancel,
              style: 'cancel',
            },
            {
              text: loc._.ok,
              style: 'destructive',
              onPress: () => {
                setParams({ entropy: undefined, providedEntropyBytes: undefined, words: undefined });
                setSelectedWalletType(newWalletType);
              },
            },
          ],
          { cancelable: true },
        );
      } else {
        setSelectedWalletType(newWalletType);
      }
    },
    [entropy, setParams, setSelectedWalletType, words],
  );

  useEffect(() => {
    // resetting format of last camera qr scan, in case user will use camera to
    // scan his wallet backup to import wallet
    resetScanWasBBQR();

    getLNDHub()
      .then(url => (url ? setWalletBaseURI(url) : setWalletBaseURI('')))
      .catch(() => setWalletBaseURI(''))
      .finally(() => setIsLoading(false));
  }, []);

  const setIsLoading = (value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: value });
  };

  const setWalletBaseURI = (value: string) => {
    dispatch({ type: 'SET_WALLET_BASE_URI', payload: value });
  };

  const setLabel = (value: string) => {
    dispatch({ type: 'SET_LABEL', payload: value });
  };

  // what the options of the screen get, to decide if they are shown and to create their wallet
  const addWalletContext: TAddWalletContext = {
    label,
    selectedId: selectedWalletType,
    pressCount: id => pressCounts[id] ?? 0,
    entropy,
    selectedIndex,
    walletBaseURI,
    hasStoredLndHub,
    setIsLoading,
    addWallet,
    saveToDisk,
    navigate: navigate as TAddWalletContext['navigate'],
    goBack,
  };
  const addWalletOptions = getAddWalletOptions().filter(option => option.isVisible?.(addWalletContext) ?? true);
  const selectedOption = getAddWalletOptions().find(option => option.id === selectedWalletType);

  const createWallet = async () => {
    setIsLoading(true);
    await selectedOption?.create(addWalletContext);
  };

  const navigateToImportWallet = () => {
    navigate('ImportWallet');
  };

  const handleOnOptionPressed = (option: TAddWalletOption) => {
    setPressCounts(prevState => ({ ...prevState, [option.id]: (prevState[option.id] ?? 0) + 1 }));
    Keyboard.dismiss();
    if (option.keepsEntropy) {
      setSelectedWalletType(option.id);
    } else {
      confirmResetEntropy(option.id);
    }
  };

  const onLearnMorePressed = () => {
    Linking.openURL('https://bluewallet.io/lightning/');
  };

  return (
    <Animated.View layout={layoutTransition} style={styles.flex1}>
      <SafeAreaScrollView
        style={stylesHook.root}
        testID="ScrollView"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets
        automaticallyAdjustsScrollIndicatorInsets
      >
        <BlueSpacing20 />
        <BlueFormLabel>{loc.wallets.add_wallet_name}</BlueFormLabel>
        <View style={[styles.label, stylesHook.label]}>
          <TextInput
            testID="WalletNameInput"
            value={label}
            placeholderTextColor="#81868e"
            placeholder={loc.wallets.add_placeholder}
            onChangeText={setLabel}
            style={styles.textInputCommon}
            editable={!isLoading}
            underlineColorAndroid="transparent"
          />
        </View>
        <BlueFormLabel>{loc.wallets.add_wallet_type}</BlueFormLabel>
        <View style={styles.buttons}>
          {addWalletOptions.map(option => (
            <WalletButton
              key={option.id}
              details={option.button as ButtonDetails}
              testID={option.testID}
              active={selectedWalletType === option.id}
              onPress={() => handleOnOptionPressed(option)}
              size={styles.button}
            />
          ))}
        </View>
        {entropy && entropyBytesProvided > 0 && selectedWalletType === Chain.ONCHAIN ? (
          <View style={styles.entropyMixed} testID="EntropyMixedIndicator">
            <Icon name="dice" type="font-awesome-6" size={16} color={colors.alternativeTextColor} />
            <BlueText style={[styles.entropyMixedText, stylesHook.entropyMixedText]}>
              {loc.formatString(loc.wallets.add_entropy_mixed, { bytes: entropyBytesProvided })}
            </BlueText>
          </View>
        ) : null}
        <View style={styles.advanced}>
          {selectedWalletType === Chain.OFFCHAIN && (
            <>
              <BlueSpacing20 />
              <View style={styles.lndhubTitle}>
                <BlueText>{loc.wallets.add_lndhub}</BlueText>
                <BlueButtonLink title={loc.wallets.learn_more} onPress={onLearnMorePressed} />
              </View>

              <View style={[styles.lndUri, stylesHook.lndUri]}>
                <TextInput
                  value={walletBaseURI}
                  onChangeText={setWalletBaseURI}
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder={loc.wallets.add_lndhub_placeholder}
                  clearButtonMode="while-editing"
                  autoCapitalize="none"
                  textContentType="URL"
                  autoCorrect={false}
                  placeholderTextColor="#81868e"
                  style={styles.textInputCommon}
                  editable={!isLoading}
                  underlineColorAndroid="transparent"
                />
              </View>
            </>
          )}

          <BlueSpacing20 />
          {!isLoading ? (
            <>
              <Button
                testID="Create"
                title={loc.wallets.add_create}
                disabled={!selectedOption || (selectedOption.isCreateDisabled?.(addWalletContext) ?? false)}
                onPress={createWallet}
              />

              <BlueButtonLink
                testID="ImportWallet"
                style={styles.import}
                title={loc.wallets.add_import_wallet}
                onPress={navigateToImportWallet}
              />
              <BlueSpacing40 />
            </>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </SafeAreaScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  label: {
    flexDirection: 'row',
    borderWidth: 1,
    borderBottomWidth: 0.5,
    minHeight: 44,
    height: 44,
    marginHorizontal: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderRadius: 4,
  },
  textInputCommon: {
    flex: 1,
    marginHorizontal: 8,
    color: '#81868e',
    fontSize: 15,
    lineHeight: 19,
  },
  buttons: {
    flexDirection: 'column',
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 0,
    minHeight: 100,
  },
  button: {
    width: '100%',
    height: 'auto',
  },
  advanced: {
    marginHorizontal: 20,
  },
  entropyMixed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  entropyMixedText: {
    flexShrink: 1,
    fontSize: 14,
  },
  lndUri: {
    flexDirection: 'row',
    borderWidth: 1,
    borderBottomWidth: 0.5,
    minHeight: 44,
    height: 44,
    alignItems: 'center',
    marginVertical: 16,
    borderRadius: 4,
  },
  import: {
    marginVertical: 24,
  },
  lndhubTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default WalletsAdd;
