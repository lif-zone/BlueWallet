// load_header.js - the header of the loading screen:
// [BlueWallet icon] BlueWallet [icon of each coin]
// Shown above the "Loading…" of load_progress() of lif-kernel, so its seen
// at once which wallet is loading.

// The icon of each coin of this wallet. A branch that adds a coin adds its
// icon here.
export const load_coin_icons = [
  import.meta.resolve('../img/addWallet/bitcoin@3x.png'),
];

const app_icon = import.meta.resolve(
  '../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');

function icon_elm(src, size){
  let img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'width:'+size+'px;height:'+size+'px';
  return img;
}

// Returns ops: {elm, remove()}, as load_progress() does
export function load_header(){
  let elm = document.createElement('div');
  elm.id = 'bw-load-header';
  elm.style.cssText = 'position:fixed;left:0;width:100%;'
    +'top:calc(50% - 72px);display:flex;align-items:center;'
    +'justify-content:center;gap:10px;font-family:sans-serif;'
    +'font-size:24px;font-weight:bold;color:#0c2550;pointer-events:none;'
    +'z-index:2147483646';
  let app = icon_elm(app_icon, 36);
  app.style.borderRadius = '8px';
  elm.appendChild(app);
  let name = document.createElement('span');
  name.textContent = 'BlueWallet';
  elm.appendChild(name);
  for (let src of load_coin_icons)
    elm.appendChild(icon_elm(src, 28));
  document.body.appendChild(elm);
  let ops = {
    elm,
    remove: function(){
      if (ops.removed)
        return;
      ops.removed = true;
      elm.remove();
    },
  };
  return ops;
}
