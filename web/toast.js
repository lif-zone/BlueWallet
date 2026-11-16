// A small popup for short messages ("Copied to clipboard"): shows at the
// bottom of the page and goes away by itself.
// toast_show(message, {ms})
// Also the React Native ToastAndroid: ToastAndroid.show(message, duration)
// texts of toasts that the stubs show. The application sets them to its
// own translated strings (web/main.tsx)
export const texts = {copied: ()=>'Copied to clipboard'};

let style_added;
function style_add(){
  if (style_added)
    return;
  style_added = true;
  let style = document.createElement('style');
  style.textContent = `
    .rn-toast { position: fixed; inset: auto auto 64px 50%; margin: 0;
      transform: translateX(-50%); border: none; border-radius: 20px;
      padding: 10px 18px; max-width: calc(100vw - 48px);
      background: rgba(40, 40, 40, 0.92); color: #fff; font-size: 14px;
      font-family: inherit; text-align: center; overflow-wrap: anywhere;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); pointer-events: none;
      opacity: 0; transition: opacity 0.2s; }
    .rn-toast.rn-toast-on { opacity: 1; }
  `;
  document.head.appendChild(style);
}

let cur;
function toast_hide(toast){
  clearTimeout(toast.timer);
  toast.elm.remove();
  if (cur==toast)
    cur = null;
}

export function toast_show(message, {ms=2000}={}){
  style_add();
  // one toast at a time: a new one replaces the one showing
  if (cur)
    toast_hide(cur);
  let elm = document.createElement('div');
  elm.className = 'rn-toast';
  elm.textContent = ''+message;
  elm.setAttribute('role', 'status');
  // a popover is in the top layer: shows also above an open <dialog>
  elm.popover = 'manual';
  document.body.appendChild(elm);
  elm.showPopover();
  let toast = cur = {elm};
  requestAnimationFrame(()=>elm.classList.add('rn-toast-on'));
  toast.timer = setTimeout(()=>{
    elm.classList.remove('rn-toast-on');
    toast.timer = setTimeout(()=>toast_hide(toast), 200);
  }, ms);
}

const SHORT = 2000, LONG = 3500;
export const ToastAndroid = {
  SHORT, LONG, TOP: 0, BOTTOM: 1, CENTER: 2,
  show: (message, duration)=>toast_show(message, {ms: duration||SHORT}),
  showWithGravity: (message, duration)=>
    toast_show(message, {ms: duration||SHORT}),
  showWithGravityAndOffset: (message, duration)=>
    toast_show(message, {ms: duration||SHORT}),
};
