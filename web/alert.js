// React Native Alert for web: an HTML <dialog> popup.
// Alert.alert(title, message, buttons, options)
// buttons: [{text, onPress, style: 'default'|'cancel'|'destructive'}]
// options: {cancelable, onDismiss}
let style_added;
function style_add(){
  if (style_added)
    return;
  style_added = true;
  let style = document.createElement('style');
  style.textContent = `
    dialog.rn-alert { border: none; border-radius: 14px; padding: 0;
      width: min(320px, calc(100vw - 48px)); background: Canvas;
      color: CanvasText; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: inherit; }
    dialog.rn-alert::backdrop { background: rgba(0, 0, 0, 0.4); }
    dialog.rn-alert .rn-alert-body { padding: 20px 16px; text-align: center; }
    dialog.rn-alert .rn-alert-title { font-size: 17px; font-weight: 600; }
    dialog.rn-alert .rn-alert-message { font-size: 14px; margin-top: 6px;
      white-space: pre-wrap; overflow-wrap: anywhere; }
    dialog.rn-alert .rn-alert-buttons { display: flex;
      border-top: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-alert .rn-alert-buttons.rn-alert-column {
      flex-direction: column; }
    dialog.rn-alert button { flex: 1; border: none; background: none;
      padding: 12px 8px; font-size: 16px; color: #007aff; cursor: pointer;
      font-family: inherit; }
    dialog.rn-alert button + button {
      border-left: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-alert .rn-alert-column button + button { border-left: none;
      border-top: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-alert button:hover { background: rgba(128, 128, 128, 0.12); }
    dialog.rn-alert button.rn-alert-cancel { font-weight: 600; }
    dialog.rn-alert button.rn-alert-destructive { color: #ff3b30; }
  `;
  document.head.appendChild(style);
}

function elm_add(parent, tag, cls, text){
  let elm = document.createElement(tag);
  if (cls)
    elm.className = cls;
  if (text!=null)
    elm.textContent = text;
  parent.appendChild(elm);
  return elm;
}

function alert(title, message, buttons, options){
  style_add();
  if (!buttons?.length)
    buttons = [{text: 'OK'}];
  let dialog = document.createElement('dialog');
  dialog.className = 'rn-alert';
  let body = elm_add(dialog, 'div', 'rn-alert-body');
  if (title)
    elm_add(body, 'div', 'rn-alert-title', ''+title);
  if (message)
    elm_add(body, 'div', 'rn-alert-message', ''+message);
  let row = elm_add(dialog, 'div', 'rn-alert-buttons');
  if (buttons.length>2)
    row.classList.add('rn-alert-column');
  let close = ()=>{
    dialog.close();
    dialog.remove();
  };
  for (let button of buttons){
    let cls = '';
    if (button.style=='cancel')
      cls = 'rn-alert-cancel';
    else if (button.style=='destructive')
      cls = 'rn-alert-destructive';
    let elm = elm_add(row, 'button', cls, button.text||'OK');
    elm.onclick = ()=>{
      close();
      button.onPress?.();
    };
  }
  // Escape key or click outside: press the cancel button if there is one,
  // otherwise dismiss only a cancelable alert
  let dismiss = ()=>{
    let cancel = buttons.find(b=>b.style=='cancel');
    if (cancel){
      close();
      cancel.onPress?.();
      return;
    }
    if (!options?.cancelable)
      return;
    close();
    options.onDismiss?.();
  };
  dialog.addEventListener('cancel', event=>{
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener('click', event=>{
    if (event.target==dialog)
      dismiss();
  });
  document.body.appendChild(dialog);
  dialog.showModal();
}

export default class Alert {
  static alert(title, message, buttons, options){
    alert(title, message, buttons, options);
  }
}
