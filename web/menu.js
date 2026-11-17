// HTML popup menu, used by react-native-context-menu-view on web.
// menu_show({x, y, title, actions, on_select, on_cancel})
// actions: [{title, subtitle, destructive, disabled, selected, actions}]
//   an action with actions is a group: its children are listed under it
// on_select(path): path is the index path of the chosen action
let style_added;
function style_add(){
  if (style_added)
    return;
  style_added = true;
  let style = document.createElement('style');
  style.textContent = `
    .rn-menu { position: fixed; inset: auto; margin: 0; padding: 4px 0;
      border: none; border-radius: 10px; background: Canvas;
      color: CanvasText; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      min-width: 180px; max-width: min(320px, calc(100vw - 16px));
      max-height: calc(100vh - 16px); overflow-y: auto;
      font-family: inherit; font-size: 15px; }
    .rn-menu .rn-menu-title { padding: 6px 14px; font-size: 12px;
      opacity: 0.6; }
    .rn-menu button { display: block; width: 100%; border: none;
      background: none; padding: 9px 14px; text-align: start;
      font: inherit; color: inherit; cursor: pointer; }
    .rn-menu button:hover:not(:disabled) {
      background: rgba(128, 128, 128, 0.15); }
    .rn-menu button:disabled { opacity: 0.4; cursor: default; }
    .rn-menu button.rn-menu-destructive { color: #ff3b30; }
    .rn-menu button.rn-menu-selected { position: relative;
      padding-inline-end: 36px; }
    .rn-menu button.rn-menu-selected::after { content: '\\2713';
      position: absolute; inset-inline-end: 14px; top: 50%;
      transform: translateY(-50%); }
    .rn-menu .rn-menu-subtitle { display: block; font-size: 12px;
      opacity: 0.6; }
    .rn-menu .rn-menu-group { border-top: 1px solid
      rgba(128, 128, 128, 0.3); }
    .rn-menu .rn-menu-group button { padding-inline-start: 24px; }
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

let menu_close;
export function menu_show({x, y, title, actions, on_select, on_cancel}){
  style_add();
  menu_close?.();
  let menu = document.createElement('div');
  menu.className = 'rn-menu';
  menu.popover = 'manual';
  let close = selected=>{
    if (menu_close!=close)
      return;
    menu_close = undefined;
    document.removeEventListener('pointerdown', on_pointerdown, true);
    document.removeEventListener('keydown', on_keydown, true);
    window.removeEventListener('blur', on_dismiss);
    window.removeEventListener('resize', on_dismiss);
    globalThis.navigation?.removeEventListener('currententrychange',
      on_dismiss);
    menu.remove();
    if (!selected)
      on_cancel?.();
  };
  let on_dismiss = ()=>close();
  let on_pointerdown = event=>{
    if (!menu.contains(event.target))
      close();
  };
  let on_keydown = event=>{
    if (event.key!='Escape')
      return;
    event.preventDefault();
    close();
  };
  let items_add = (parent, _actions, path)=>{
    _actions.forEach((action, i)=>{
      let _path = [...path, i];
      if (action.actions?.length){
        let group = elm_add(parent, 'div', 'rn-menu-group');
        if (action.title)
          elm_add(group, 'div', 'rn-menu-title', action.title);
        items_add(group, action.actions, _path);
        return;
      }
      let cls = [];
      if (action.destructive)
        cls.push('rn-menu-destructive');
      if (action.selected)
        cls.push('rn-menu-selected');
      let button = elm_add(parent, 'button', cls.join(' '), action.title);
      if (action.subtitle)
        elm_add(button, 'span', 'rn-menu-subtitle', action.subtitle);
      button.disabled = !!action.disabled;
      button.onclick = ()=>{
        close(true);
        on_select(_path, action);
      };
    });
  };
  if (title)
    elm_add(menu, 'div', 'rn-menu-title', title);
  items_add(menu, actions||[], []);
  document.body.appendChild(menu);
  menu.showPopover();
  // keep the menu inside the window
  let rect = menu.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(x, innerWidth-rect.width-8))+'px';
  menu.style.top = Math.max(8, Math.min(y, innerHeight-rect.height-8))+'px';
  menu_close = close;
  document.addEventListener('pointerdown', on_pointerdown, true);
  document.addEventListener('keydown', on_keydown, true);
  window.addEventListener('blur', on_dismiss);
  window.addEventListener('resize', on_dismiss);
  // the screen under the menu went away (eg. the browser Back button)
  globalThis.navigation?.addEventListener('currententrychange', on_dismiss);
}
