// HTML <dialog> popup, shared by the React Native Alert (web/alert.js) and
// prompt (stubs/react-native-prompt-android).
// dialog_show({title, message, buttons, cancelable, onDismiss, input})
// buttons: [{text, onPress, style: 'default'|'cancel'|'destructive'}]
// input: {type, value, placeholder, inputmode} adds a text field; its value
//   is passed to the pressed button's onPress
let style_added;
function style_add(){
  if (style_added)
    return;
  style_added = true;
  let style = document.createElement('style');
  style.textContent = `
    dialog.rn-dialog { border: none; border-radius: 14px; padding: 0;
      width: min(320px, calc(100vw - 48px)); background: Canvas;
      color: CanvasText; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: inherit; }
    dialog.rn-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
    dialog.rn-dialog .rn-dialog-body { padding: 20px 16px; text-align: center; }
    dialog.rn-dialog .rn-dialog-title { font-size: 17px; font-weight: 600; }
    dialog.rn-dialog .rn-dialog-message { font-size: 14px; margin-top: 6px;
      white-space: pre-wrap; overflow-wrap: anywhere; }
    dialog.rn-dialog input { width: 100%; margin-top: 14px; padding: 8px;
      font-size: 16px; border: 1px solid rgba(128, 128, 128, 0.5);
      border-radius: 6px; background: Field; color: FieldText; }
    dialog.rn-dialog .rn-dialog-buttons { display: flex;
      border-top: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-dialog .rn-dialog-buttons.rn-dialog-column {
      flex-direction: column; }
    dialog.rn-dialog button { flex: 1; border: none; background: none;
      padding: 12px 8px; font-size: 16px; color: #007aff; cursor: pointer;
      font-family: inherit; }
    dialog.rn-dialog button + button {
      border-left: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-dialog .rn-dialog-column button + button { border-left: none;
      border-top: 1px solid rgba(128, 128, 128, 0.35); }
    dialog.rn-dialog button:hover { background: rgba(128, 128, 128, 0.12); }
    dialog.rn-dialog button.rn-dialog-cancel { font-weight: 600; }
    dialog.rn-dialog button.rn-dialog-destructive { color: #ff3b30; }
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

export function dialog_show({title, message, buttons, cancelable, onDismiss,
  input})
{
  style_add();
  if (!buttons?.length)
    buttons = [{text: 'OK'}];
  let dialog = document.createElement('dialog');
  dialog.className = 'rn-dialog';
  let body = elm_add(dialog, 'div', 'rn-dialog-body');
  if (title)
    elm_add(body, 'div', 'rn-dialog-title', ''+title);
  if (message)
    elm_add(body, 'div', 'rn-dialog-message', ''+message);
  let input_elm;
  if (input){
    input_elm = elm_add(body, 'input');
    input_elm.type = input.type||'text';
    input_elm.value = input.value||'';
    input_elm.placeholder = input.placeholder||'';
    input_elm.autocomplete = 'off';
    if (input.inputmode)
      input_elm.inputMode = input.inputmode;
  }
  let row = elm_add(dialog, 'div', 'rn-dialog-buttons');
  if (buttons.length>2)
    row.classList.add('rn-dialog-column');
  let press = button=>{
    let value = input_elm?.value;
    dialog.close();
    dialog.remove();
    if (input_elm)
      button?.onPress?.(value);
    else
      button?.onPress?.();
  };
  for (let button of buttons){
    let cls = '';
    if (button.style=='cancel')
      cls = 'rn-dialog-cancel';
    else if (button.style=='destructive')
      cls = 'rn-dialog-destructive';
    let elm = elm_add(row, 'button', cls, button.text||'OK');
    elm.onclick = ()=>press(button);
  }
  // Escape key or click outside: press the cancel button if there is one,
  // otherwise dismiss only a cancelable dialog
  let dismiss = ()=>{
    let cancel = buttons.find(b=>b.style=='cancel');
    if (cancel)
      return press(cancel);
    if (!cancelable)
      return;
    press();
    onDismiss?.();
  };
  dialog.addEventListener('cancel', event=>{
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener('click', event=>{
    if (event.target==dialog)
      dismiss();
  });
  // Enter in the text field: press the last button that is not cancel
  input_elm?.addEventListener('keydown', event=>{
    if (event.key!='Enter')
      return;
    event.preventDefault();
    press(buttons.findLast(b=>b.style!='cancel'));
  });
  document.body.appendChild(dialog);
  dialog.showModal();
  input_elm?.focus();
}
