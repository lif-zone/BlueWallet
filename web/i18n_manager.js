// React Native I18nManager for web: right-to-left layout.
// As on React Native, the direction is fixed when the application starts:
// forceRTL() records the choice, and it takes effect on the next start
// (page load), where its applied by `dir` on the document.
// On a phone the user is asked to restart the application. On web a restart
// is a page reload, so forceRTL() does it itself when the direction changes.
// The choice is in localStorage, since isRTL must be known synchronously
// at start.
const KEY = 'i18n_force_rtl';
let reloading;

function flag_get(){
  try {
    return localStorage.getItem(KEY)=='1';
  } catch(e){
    return false;
  }
}

const isRTL = flag_get();
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

function forceRTL(rtl){
  try {
    if (rtl)
      localStorage.setItem(KEY, '1');
    else
      localStorage.removeItem(KEY);
  } catch(e){}
  rtl = !!rtl;
  // reload only when the choice was stored: the next start then has the
  // right direction, so it cannot reload again
  if (rtl==isRTL || flag_get()!=rtl || reloading)
    return;
  reloading = true;
  location.reload();
}

export default {
  isRTL,
  doLeftAndRightSwapInRTL: true,
  // RTL is allowed whenever its forced
  allowRTL(){},
  forceRTL,
  swapLeftAndRightInRTL(){},
  getConstants: ()=>({isRTL, doLeftAndRightSwapInRTL: true}),
};
