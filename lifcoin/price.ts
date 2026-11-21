// The price of LIF, from the network. Sets lif_coin.price.rate: the value of
// one LIF in USD. The app converts it to the currency of the user.
// The server answers as Coinbase does for Bitcoin:
// {"data":{"amount":"0.01","base":"LIF","currency":"USD"}}
import AsyncStorage from '@react-native-async-storage/async-storage';
import {lif_coin} from './network.ts';

const LIF_PRICE_URL =
  'https://lifnet.com/.lif.net/coinbase/v2/prices/LIF-USD/spot';
// the last price that was fetched: used at start, until the first answer
const LIF_PRICE_KEY = 'lif_price_usd';
const UPDATE_MS = 10*60*1000;
const TIMEOUT_MS = 15*1000;

let last_try = 0;
// a price was fetched since the start
let fetched = false;

function price_valid(rate: number): boolean {
  return Number.isFinite(rate) && rate>0;
}

async function price_fetch(): Promise<number> {
  let res = await fetch(LIF_PRICE_URL,
    {signal: AbortSignal.timeout(TIMEOUT_MS)});
  if (!res.ok)
    throw new Error('LIF price: HTTP '+res.status);
  let json = await res.json();
  let {amount, base, currency} = json?.data||{};
  let rate = Number(amount);
  if (base!='LIF' || currency!=lif_coin.price.currency || !price_valid(rate))
    throw new Error('LIF price: invalid answer');
  return rate;
}

// Fetches the price, at most once in 10 minutes. Does not wait and does not
// throw: on a failure the price stays as it was.
export function lif_price_update(){
  let now = Date.now();
  if (now-last_try<UPDATE_MS)
    return;
  last_try = now;
  (async()=>{
    try {
      let rate = await price_fetch();
      lif_coin.price.rate = rate;
      fetched = true;
      await AsyncStorage.setItem(LIF_PRICE_KEY, ''+rate);
    } catch(e){
      console.log(''+e);
    }
  })();
}

// at start: the last known price, then a fresh one
(async()=>{
  try {
    let rate = Number(await AsyncStorage.getItem(LIF_PRICE_KEY));
    if (price_valid(rate) && !fetched)
      lif_coin.price.rate = rate;
  } catch(e){
    console.log(''+e);
  }
})();
lif_price_update();
