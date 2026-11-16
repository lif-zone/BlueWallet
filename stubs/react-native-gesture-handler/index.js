
import React from 'react';
import {View, TouchableOpacity as RNTouchableOpacity, Pressable, Animated,
  StyleSheet} from 'react-native';
export const GestureHandlerRootView = ({children, style, ...props})=>React.createElement(View, {style, ...props}, children);
export const PanGestureHandler = ({children})=>children;
export const TapGestureHandler = ({children})=>children;
export const LongPressGestureHandler = ({children})=>children;
export const ScrollView = React.forwardRef(({style, ...props}, ref)=>React.createElement(View, {style: [style, {overflow: 'auto'}], ref, ...props}));
export const FlatList = React.forwardRef(({style, ...props}, ref)=>React.createElement(View, {style, ref, ...props}));

// Swipeable for web: a row that is dragged sideways to show the actions
// that are behind it (renderRightActions / renderLeftActions).
// - touch and pen: drag the row.
// - mouse: drag the row, or scroll sideways over it (trackpad).
// A row may be inside a draggable element (the reorder of
// react-native-draggable-flatlist): a mouse drag that starts sideways is
// taken as a swipe, and the HTML drag is cancelled.
// ref: close(), openRight(), openLeft(), reset()
export const Swipeable = React.forwardRef(function Swipeable(props, ref){
  let {children, renderRightActions, renderLeftActions, friction=1,
    rightThreshold, leftThreshold, overshootRight, overshootLeft,
    containerStyle, childrenContainerStyle, enabled=true} = props;
  let root = React.useRef(null);
  let right = React.useRef(null);
  let left = React.useRef(null);
  let [x, set_x] = React.useState(0);
  let [moving, set_moving] = React.useState(false);
  let s = React.useRef({x: 0}).current; // gesture state
  s.props = props;
  let drag_x = React.useRef(new Animated.Value(0)).current;
  let progress = React.useRef(new Animated.Value(0)).current;
  let width = side=>(side=='right' ? right : left).current?.offsetWidth||0;
  let move = _x=>{
    s.x = _x;
    drag_x.setValue(_x);
    let w = width(_x<0 ? 'right' : 'left');
    progress.setValue(w ? Math.abs(_x)/w : 0);
    set_x(_x);
  };
  let settle = side=>{
    let from = s.x<0 ? 'right' : s.x>0 ? 'left' : null;
    let to = !side ? 0 : side=='right' ? -width('right') : width('left');
    if (!to)
      side = null;
    if (side){
      s.props.onSwipeableWillOpen?.(side);
      move(to);
      s.props.onSwipeableOpen?.(side, api);
    } else {
      s.props.onSwipeableWillClose?.(from||'right');
      move(0);
      s.props.onSwipeableClose?.(from||'right', api);
    }
  };
  let api = React.useMemo(()=>({
    close: ()=>settle(null),
    reset: ()=>settle(null),
    openRight: ()=>settle('right'),
    openLeft: ()=>settle('left'),
  }), []);
  React.useImperativeHandle(ref, ()=>api, [api]);
  // limits of the position while its dragged
  let clamp = _x=>{
    let min = -width('right'), max = width('left');
    if (!s.props.overshootRight)
      _x = Math.max(_x, min);
    if (!s.props.overshootLeft)
      _x = Math.min(_x, max);
    return _x;
  };
  let on_down = event=>{
    if (!enabled || event.button)
      return;
    s.down = {x: event.clientX, y: event.clientY, start: s.x,
      id: event.pointerId};
    s.swiping = false;
  };
  let on_move = event=>{
    let d = s.down;
    if (!d || d.id!=event.pointerId)
      return;
    let dx = event.clientX-d.x, dy = event.clientY-d.y;
    d.dx = dx;
    d.dy = dy;
    if (!s.swiping){
      if (Math.abs(dx)<8 || Math.abs(dx)<Math.abs(dy))
        return;
      s.swiping = true;
      set_moving(true);
      root.current?.setPointerCapture?.(d.id);
    }
    move(clamp(d.start+dx/friction));
  };
  let on_up = event=>{
    let d = s.down;
    s.down = null;
    if (!d || !s.swiping)
      return;
    set_moving(false);
    // the click that ends a swipe is not a press of the row
    s.swiped_tm = Date.now();
    let moved = s.x-d.start;
    let side = s.x<0 ? 'right' : s.x>0 ? 'left' : null;
    let threshold = side=='right' ? rightThreshold ?? width('right')/2
      : leftThreshold ?? width('left')/2;
    // open when dragged past the threshold in the opening direction
    let opening = side=='right' ? moved<0 : moved>0;
    if (side && opening && Math.abs(moved)>=threshold)
      settle(side);
    else if (side && !opening && Math.abs(moved)<threshold)
      settle(side);
    else
      settle(null);
    s.swiping = false;
  };
  let on_click_capture = event=>{
    if (Date.now()-(s.swiped_tm||0)>350)
      return;
    event.stopPropagation();
    event.preventDefault();
  };
  // sideways scroll (trackpad) over the row
  let on_wheel = event=>{
    if (!enabled || Math.abs(event.deltaX)<=Math.abs(event.deltaY))
      return;
    if (Math.abs(event.deltaX)<15 || Date.now()-(s.wheel_tm||0)<400)
      return;
    s.wheel_tm = Date.now();
    if (event.deltaX>0)
      settle(s.x>0 ? null : 'right');
    else
      settle(s.x<0 ? null : 'left');
  };
  // a mouse drag that starts sideways is a swipe, not an HTML drag of the
  // draggable element the row is in
  React.useEffect(()=>{
    let elm = root.current?.closest?.('[draggable=true]');
    if (!elm)
      return;
    let on_dragstart = event=>{
      let d = s.down;
      if (!d || !enabled)
        return;
      // the dragstart event has the position of the press, so the
      // direction is taken from the pointer moves that came before it
      if (Math.abs(d.dx||0)>Math.abs(d.dy||0))
        event.preventDefault();
      else
        s.down = null; // its a reorder
    };
    elm.addEventListener('dragstart', on_dragstart, true);
    return ()=>elm.removeEventListener('dragstart', on_dragstart, true);
  }, [enabled]);
  let actions = (render, side, _ref)=>render && React.createElement('div', {
    ref: _ref,
    style: {position: 'absolute', top: 0, bottom: 0, display: 'flex',
      [side]: 0, visibility: (side=='right' ? x<0 : x>0) ? 'visible'
        : 'hidden'},
  }, render(progress, drag_x, api));
  return React.createElement('div', {
    ref: root,
    style: {position: 'relative', overflow: 'hidden', display: 'flex',
      flexDirection: 'column', touchAction: 'pan-y',
      ...StyleSheet.flatten(containerStyle)},
    onPointerDown: on_down, onPointerMove: on_move, onPointerUp: on_up,
    onPointerCancel: on_up, onClickCapture: on_click_capture,
    onWheel: on_wheel,
  }, actions(renderLeftActions, 'left', left),
    actions(renderRightActions, 'right', right),
    React.createElement('div', {
      style: {display: 'flex', flexDirection: 'column', position: 'relative',
        transform: 'translateX('+x+'px)',
        transition: moving ? 'none' : 'transform 0.2s ease-out',
        ...StyleSheet.flatten(childrenContainerStyle)},
    }, children));
});
export const RectButton = ({children, style, onPress, ...props})=>React.createElement(Pressable, {style, onPress, ...props}, children);
export const BorderlessButton = ({children, style, onPress, ...props})=>React.createElement(Pressable, {style, onPress, ...props}, children);
export const TouchableOpacity = React.forwardRef(({children, style, onPress, ...props}, ref)=>React.createElement(RNTouchableOpacity, {style, onPress, ref, ...props}, children));
export const State = {UNDETERMINED:0,FAILED:1,BEGAN:2,CANCELLED:3,ACTIVE:4,END:5};
export const Directions = {RIGHT:1,LEFT:2,UP:4,DOWN:8};
export const Gesture = {Pan:()=>({}),Tap:()=>({}),LongPress:()=>({})};
export const GestureDetector = ({children})=>children;
export default {ScrollView,FlatList,Swipeable,RectButton,BorderlessButton,TouchableOpacity,GestureHandlerRootView,State,Directions};
