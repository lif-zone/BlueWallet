// react-native-draggable-flatlist for web: a FlatList whose rows can be
// reordered with the mouse (HTML drag and drop).
// onDragEnd({from, to, data}) gets the reordered data, as on native.
import React, {useRef, useState} from 'react';
import {FlatList} from 'react-native';

export default function DraggableFlatList({data, renderItem, onDragBegin,
  onDragEnd, containerStyle, style, activationDistance, ...props})
{
  let from = useRef(null);
  let [active, set_active] = useState(null);
  let [over, set_over] = useState(null);
  let end = ()=>{
    from.current = null;
    set_active(null);
    set_over(null);
  };
  let render = ({item, index})=>React.createElement('div', {
    draggable: true,
    style: {display: 'flex', flexDirection: 'column',
      opacity: active==index ? 0.5 : 1,
      borderTop: over==index && active!=index ? '2px solid #007aff'
        : '2px solid transparent'},
    onDragStart: event=>{
      // cancelled by something inside the row (a sideways swipe of a
      // Swipeable): not a reorder
      if (event.defaultPrevented)
        return;
      from.current = index;
      event.dataTransfer.effectAllowed = 'move';
      set_active(index);
      onDragBegin?.(index);
    },
    onDragOver: event=>{
      if (from.current==null)
        return;
      event.preventDefault();
      set_over(index);
    },
    onDrop: event=>{
      event.preventDefault();
      let _from = from.current;
      end();
      if (_from==null)
        return;
      let list = [...data];
      list.splice(index, 0, ...list.splice(_from, 1));
      onDragEnd?.({from: _from, to: index, data: list});
    },
    onDragEnd: end,
  }, renderItem({item, index, getIndex: ()=>index, drag: ()=>{},
    isActive: active==index}));
  return React.createElement(FlatList, {...props, data, renderItem: render,
    style: [containerStyle, style]});
}
export const ScaleDecorator = ({children})=>children;
export const ShadowDecorator = ({children})=>children;
export const OpacityDecorator = ({children})=>children;
export const NestableScrollContainer = ({children})=>children;
export const NestableDraggableFlatList = DraggableFlatList;
