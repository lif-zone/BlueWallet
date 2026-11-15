// react-native-context-menu-view for web: an HTML popup menu.
// Props: actions, title, onPress (a menu item was chosen), onCancel,
// dropdownMenuMode, disabled, style.
// The menu opens on a click in dropdownMenuMode, otherwise on a long press
// or a right click. A plain click is left to the parent (eg. a Pressable).
// onPress gets {nativeEvent: {index, indexPath, name}}, as on Android.
import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import {menu_show} from 'bw-web/menu.js';

const long_press_ms = 500;

export default function ContextMenuView(props){
  let {children, style, disabled} = props;
  let container = useRef(null);
  let props_ref = useRef(props);
  props_ref.current = props;
  useEffect(()=>{
    let node = container.current;
    if (!node || disabled)
      return;
    let timer, click_skip;
    let open = (x, y)=>{
      let {actions, title, onPress, onCancel} = props_ref.current;
      menu_show({x, y, title, actions, on_cancel: onCancel,
        on_select: (path, action)=>onPress?.({nativeEvent: {
          index: path.at(-1), indexPath: path, name: action.title}})});
    };
    let on_click = event=>{
      // the click that ends a long press must not reach the parent
      if (click_skip){
        click_skip = false;
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      if (!props_ref.current.dropdownMenuMode)
        return;
      event.stopPropagation();
      let rect = node.getBoundingClientRect();
      open(rect.left, rect.bottom+4);
    };
    let on_contextmenu = event=>{
      event.preventDefault();
      event.stopPropagation();
      open(event.clientX, event.clientY);
    };
    let on_pointerdown = event=>{
      if (event.button || props_ref.current.dropdownMenuMode)
        return;
      click_skip = false;
      let {clientX: x, clientY: y} = event;
      timer = setTimeout(()=>{
        click_skip = true;
        open(x, y);
      }, long_press_ms);
    };
    let on_pointerend = ()=>clearTimeout(timer);
    node.addEventListener('click', on_click, true);
    node.addEventListener('contextmenu', on_contextmenu);
    node.addEventListener('pointerdown', on_pointerdown);
    node.addEventListener('pointerup', on_pointerend);
    node.addEventListener('pointerleave', on_pointerend);
    node.addEventListener('pointercancel', on_pointerend);
    return ()=>{
      clearTimeout(timer);
      node.removeEventListener('click', on_click, true);
      node.removeEventListener('contextmenu', on_contextmenu);
      node.removeEventListener('pointerdown', on_pointerdown);
      node.removeEventListener('pointerup', on_pointerend);
      node.removeEventListener('pointerleave', on_pointerend);
      node.removeEventListener('pointercancel', on_pointerend);
    };
  }, [disabled]);
  return React.createElement(View, {style, ref: container}, children);
}
