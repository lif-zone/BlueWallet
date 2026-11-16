// React Native I18nManager for web: right-to-left layout.
// As on React Native, the direction is fixed when the application starts:
// forceRTL() only records the choice, and it takes effect on the next start
// (page load), where its applied by `dir` on the document.
// The choice is in localStorage, since isRTL must be known synchronously
// at start.
const KEY = 'i18n_force_rtl';

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
