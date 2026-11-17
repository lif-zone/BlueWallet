// react-native-reanimated for web: a small JS implementation of the parts
// BlueWallet uses. Shared values animate with requestAnimationFrame
// (withTiming, withDelay, withSequence, withSpring, withRepeat), and
// useAnimatedStyle re-renders its component while they change.
// Layout animations (entering, exiting, layout props) are ignored.
import React, {useEffect, useRef, useState} from 'react';
import {View, Text, ScrollView, Image, FlatList} from 'react-native';

// change notification: every hook that reads shared values listens here
let listeners = new Set();
let flush_pending;
function notify(){
  if (flush_pending)
    return;
  flush_pending = true;
  requestAnimationFrame(()=>{
    flush_pending = false;
    for (let listener of [...listeners])
      listener();
  });
}

// animation descriptors
const is_anim = v=>v && typeof v=='object' && v.__anim;
export const withTiming = (to, config, callback)=>({__anim: 'timing', to,
  duration: config?.duration ?? 300, easing: config?.easing||Easing.inOut(
  Easing.quad), callback});
export const withSpring = (to, config, callback)=>({__anim: 'timing', to,
  duration: config?.duration ?? 350, easing: Easing.out(Easing.cubic),
  callback});
export const withDelay = (ms, anim)=>({__anim: 'delay', ms, anim});
export const withSequence = (...anims)=>({__anim: 'sequence', anims});
export const withRepeat = (anim, count=2, reverse=false, callback)=>
  ({__anim: 'repeat', anim, count, reverse, callback});

// runs an animation on a shared value. returns a function that cancels it
function anim_run(sv, anim, done){
  let cancelled, cancel_child, raf, timer;
  let cancel = ()=>{
    cancelled = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    cancel_child?.();
  };
  if (!is_anim(anim)){
    sv._set(anim);
    done?.(true);
    return cancel;
  }
  if (anim.__anim=='delay'){
    timer = setTimeout(()=>{
      cancel_child = anim_run(sv, anim.anim, done);
    }, anim.ms);
  } else if (anim.__anim=='sequence'){
    let i = 0;
    let next = finished=>{
      if (cancelled || !finished || i>=anim.anims.length)
        return done?.(finished);
      cancel_child = anim_run(sv, anim.anims[i++], next);
    };
    next(true);
  } else if (anim.__anim=='repeat'){
    let i = 0;
    let from = sv._v;
    let next = finished=>{
      if (cancelled || !finished || anim.count>0 && i>=anim.count){
        anim.callback?.(finished);
        return done?.(finished);
      }
      let a = anim.anim;
      if (anim.reverse && i%2 && a.__anim=='timing')
        a = {...a, to: from};
      else if (!anim.reverse && i)
        sv._set(from);
      i++;
      cancel_child = anim_run(sv, a, next);
    };
    next(true);
  } else {
    let from = sv._v, to = anim.to;
    let start = performance.now();
    let end = finished=>{
      anim.callback?.(finished);
      done?.(finished);
    };
    if (typeof from!='number' || typeof to!='number' || !anim.duration){
      sv._set(to);
      end(true);
      return cancel;
    }
    let step = now=>{
      if (cancelled)
        return;
      let t = Math.min(1, (now-start)/anim.duration);
      sv._set(from+(to-from)*anim.easing(t));
      if (t<1)
        raf = requestAnimationFrame(step);
      else
        end(true);
    };
    raf = requestAnimationFrame(step);
  }
  return cancel;
}

function shared_value(init){
  let sv = {
    _v: init,
    _cancel: null,
    _set(v){
      if (sv._v===v)
        return;
      sv._v = v;
      notify();
    },
    get value(){
      return sv._v;
    },
    set value(v){
      sv._cancel?.();
      sv._cancel = anim_run(sv, v);
    },
    get: ()=>sv._v,
    set: v=>sv.value = typeof v=='function' ? v(sv._v) : v,
  };
  return sv;
}

export const makeMutable = shared_value;
export function useSharedValue(init){
  let ref = useRef(null);
  ref.current ||= shared_value(init);
  useEffect(()=>()=>ref.current._cancel?.(), []);
  return ref.current;
}

export function cancelAnimation(sv){
  sv?._cancel?.();
}

// re-render the component when a shared value changes
function use_shared_changes(){
  let [, set_tick] = useState(0);
  useEffect(()=>{
    let listener = ()=>set_tick(tick=>tick+1);
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }, []);
}

export function useAnimatedStyle(fn){
  use_shared_changes();
  return fn();
}

export function useDerivedValue(fn){
  use_shared_changes();
  return {value: fn()};
}

export function useAnimatedReaction(prepare, react){
  let prev = useRef(null);
  let fns = useRef(null);
  fns.current = {prepare, react};
  useEffect(()=>{
    let listener = ()=>{
      let cur = fns.current.prepare();
      if (cur===prev.current)
        return;
      let _prev = prev.current;
      prev.current = cur;
      fns.current.react(cur, _prev);
    };
    listener();
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }, []);
}

export const Extrapolation = {CLAMP: 'clamp', EXTEND: 'extend',
  IDENTITY: 'identity'};
export function interpolate(v, input, output, type){
  let left = type?.extrapolateLeft||type||'extend';
  let right = type?.extrapolateRight||type||'extend';
  let i = 1;
  while (i<input.length-1 && v>input[i])
    i++;
  let x0 = input[i-1], x1 = input[i], y0 = output[i-1], y1 = output[i];
  if (v<input[0] && left=='clamp')
    return output[0];
  if (v<input[0] && left=='identity')
    return v;
  if (v>input.at(-1) && right=='clamp')
    return output.at(-1);
  if (v>input.at(-1) && right=='identity')
    return v;
  if (x1==x0)
    return y0;
  return y0+(y1-y0)*(v-x0)/(x1-x0);
}

// color string -> [r, g, b, a]. '#rgb', '#rrggbb', '#rrggbbaa', 'rgb()',
// 'rgba()' are parsed here, any other CSS color (a name) by the browser.
let color_ctx;
const color_cache = new Map();
function color_parse(color){
  let s = String(color).trim();
  let res = color_cache.get(s);
  if (res)
    return res;
  let m;
  if (m = s.match(/^#([0-9a-f]{3,8})$/i)){
    let h = m[1];
    if (h.length<=4)
      h = [...h].map(ch=>ch+ch).join('');
    res = [0, 2, 4].map(i=>parseInt(h.slice(i, i+2), 16));
    res.push(h.length==8 ? parseInt(h.slice(6, 8), 16)/255 : 1);
  } else if (m = s.match(/^rgba?\(([^)]+)\)$/i)){
    let p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    res = [p[0], p[1], p[2], p[3] ?? 1];
  } else {
    color_ctx ||= document.createElement('canvas').getContext('2d');
    color_ctx.fillStyle = '#000';
    color_ctx.fillStyle = s;
    // the browser gives back '#rrggbb' or 'rgba(...)'
    res = color_ctx.fillStyle==s ? [0, 0, 0, 1] :
      color_parse(color_ctx.fillStyle);
  }
  if (res.some(n=>Number.isNaN(n)))
    res = [0, 0, 0, 1];
  color_cache.set(s, res);
  return res;
}

// interpolateColor(v, [0, 1], ['#fff', 'red']) -> 'rgba(r, g, b, a)'
// The value is clamped to the input range, as colors do not extend.
export function interpolateColor(v, input, output){
  let colors = output.map(color_parse);
  let ch = i=>interpolate(v, input, colors.map(c=>c[i]), 'clamp');
  let rgb = [0, 1, 2].map(i=>Math.round(Math.min(255, Math.max(0, ch(i)))));
  let a = Math.min(1, Math.max(0, ch(3)));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${+a.toFixed(3)})`;
}

const ease = {
  linear: t=>t,
  quad: t=>t*t,
  cubic: t=>t*t*t,
  sin: t=>1-Math.cos(t*Math.PI/2),
  circle: t=>1-Math.sqrt(1-t*t),
  exp: t=>Math.pow(2, 10*(t-1)),
};
export const Easing = {
  ...ease,
  ease: t=>t*t*(3-2*t),
  poly: n=>t=>Math.pow(t, n),
  elastic: ()=>ease.quad,
  back: ()=>ease.quad,
  bounce: ease.quad,
  bezier: ()=>t=>t*t*(3-2*t),
  bezierFn: ()=>t=>t*t*(3-2*t),
  in: fn=>fn,
  out: fn=>t=>1-fn(1-t),
  inOut: fn=>t=>t<0.5 ? fn(t*2)/2 : 1-fn((1-t)*2)/2,
};

// layout animation props are not supported: drop them
function strip({entering, exiting, layout, sharedTransitionTag,
  sharedTransitionStyle, animatedProps, ...rest})
{
  return rest;
}
const animated = comp=>React.forwardRef((props, ref)=>
  React.createElement(comp, {...strip(props), ref}));
const Animated = {
  View: animated(View),
  Text: animated(Text),
  ScrollView: animated(ScrollView),
  Image: animated(Image),
  FlatList: animated(FlatList),
  createAnimatedComponent: animated,
};
export default Animated;

// builders for layout animations: accepted and ignored
function chain(){
  let o = {};
  for (let name of ['duration', 'easing', 'delay', 'springify', 'damping',
    'mass', 'stiffness', 'overshootClamping', 'restDisplacementThreshold',
    'restSpeedThreshold', 'withInitialValues', 'withCallback', 'build',
    'reduceMotion', 'randomDelay'])
  {
    o[name] = ()=>o;
  }
  return o;
}
export const Layout = chain();
export const FadeIn = chain();
export const FadeOut = chain();
export const FadeInDown = chain();
export const FadeInUp = chain();
export const FadeOutDown = chain();
export const FadeOutUp = chain();
export const SlideInRight = chain();
export const SlideOutRight = chain();
export const SlideInLeft = chain();
export const SlideOutLeft = chain();
export const ZoomIn = chain();
export const ZoomOut = chain();
export const LinearTransition = chain();
export const FadingTransition = chain();
export const SequencedTransition = chain();
export const JumpingTransition = chain();

export const runOnJS = fn=>fn;
export const runOnUI = fn=>fn;
export const useAnimatedRef = ()=>useRef(null);
export const measure = ref=>{
  let rect = ref?.current?.getBoundingClientRect?.();
  if (!rect)
    return null;
  return {x: rect.left, y: rect.top, width: rect.width, height: rect.height,
    pageX: rect.left, pageY: rect.top};
};
export const scrollTo = (ref, x, y, animated)=>
  ref?.current?.scrollTo?.({x, y, animated});
export const useAnimatedScrollHandler = ()=>()=>{};
export const KeyboardState = {UNKNOWN: 0, OPENING: 1, OPEN: 2, CLOSING: 3,
  CLOSED: 4};
export const useAnimatedKeyboard = ()=>({state: {value: KeyboardState.CLOSED},
  height: {value: 0}});
export const useReducedMotion = ()=>false;
