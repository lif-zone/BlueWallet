// react-native-localize for web: from the browser's language settings.
const rtl = ['ar', 'he', 'fa', 'ur'];

function locale_get(tag){
  let locale;
  try {
    locale = new Intl.Locale(tag).maximize();
  } catch(e){
    locale = {language: 'en', region: 'US'};
  }
  return {languageCode: locale.language, countryCode: locale.region||'US',
    languageTag: tag, isRTL: rtl.includes(locale.language)};
}

export const getLocales = ()=>{
  let tags = navigator.languages?.length ? navigator.languages
    : [navigator.language||'en-US'];
  return tags.map(locale_get);
};

export const findBestLanguageTag = tags=>{
  for (let locale of getLocales()){
    let tag = tags.find(t=>t.toLowerCase()==locale.languageTag.toLowerCase())
      || tags.find(t=>t.split(/[-_]/)[0].toLowerCase()==locale.languageCode);
    if (tag)
      return {languageTag: tag, isRTL: locale.isRTL};
  }
};

export const getNumberFormatSettings = ()=>{
  let parts = new Intl.NumberFormat(navigator.language)
    .formatToParts(1234567.8);
  let part = type=>parts.find(p=>p.type==type)?.value;
  return {decimalSeparator: part('decimal')||'.',
    groupingSeparator: part('group')||','};
};

export const getCountry = ()=>getLocales()[0].countryCode;
export const getCurrencies = ()=>['USD'];
export const getCalendar = ()=>'gregorian';
export const getTemperatureUnit = ()=>'celsius';
export const getTimeZone = ()=>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
export const uses24HourClock = ()=>
  !new Intl.DateTimeFormat(navigator.language, {hour: 'numeric'})
    .resolvedOptions().hour12;
export const addEventListener = ()=>({remove: ()=>{}});
export const removeEventListener = ()=>{};
