// @arkade-os/boltz-swap for web: a facade. The real package
// (bw-arkade-boltz-swap in package.json) is loaded only when an Ark wallet
// needs it: see web/arkade.js. The names are the ones BlueWallet imports.
import {facade_add, placeholder, placeholder_class} from 'bw-web/arkade.js';

let real;
export let ArkadeSwaps = placeholder('ArkadeSwaps');
// blue_modules/arkade-background.ts creates one at the top of the module
export let BoltzSwapProvider = placeholder_class('BoltzSwapProvider',
  ()=>real?.BoltzSwapProvider);
export let SwapManager = placeholder('SwapManager');
export let decodeInvoice = placeholder('decodeInvoice');
export let isChainSwapClaimable = placeholder('isChainSwapClaimable');
export let isChainSwapRefundable = placeholder('isChainSwapRefundable');
export let isReverseSwapClaimable = placeholder('isReverseSwapClaimable');
export let isSubmarineSwapRefundable =
  placeholder('isSubmarineSwapRefundable');
export let isReverseClaimableStatus = placeholder('isReverseClaimableStatus');
export let isReverseSuccessStatus = placeholder('isReverseSuccessStatus');
export let isChainFinalStatus = placeholder('isChainFinalStatus');
export let isReverseFinalStatus = placeholder('isReverseFinalStatus');
export let isSubmarineFinalStatus = placeholder('isSubmarineFinalStatus');
export let updateChainSwapStatus = placeholder('updateChainSwapStatus');
export let updateReverseSwapStatus = placeholder('updateReverseSwapStatus');
export let updateSubmarineSwapStatus =
  placeholder('updateSubmarineSwapStatus');
// types in the real package: no value
export let BoltzSwap, BoltzSubmarineSwap, BoltzReverseSwap, BoltzChainSwap,
  SubmarineRefundOutcome;

facade_add(()=>import('bw-arkade-boltz-swap'), _real=>{
  real = _real;
  ({ArkadeSwaps, BoltzSwapProvider, SwapManager, decodeInvoice,
    isChainSwapClaimable, isChainSwapRefundable, isReverseSwapClaimable,
    isSubmarineSwapRefundable, isReverseClaimableStatus,
    isReverseSuccessStatus, isChainFinalStatus, isReverseFinalStatus,
    isSubmarineFinalStatus, updateChainSwapStatus, updateReverseSwapStatus,
    updateSubmarineSwapStatus} = real);
});
