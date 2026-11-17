// lottie-react-native for web: plays the animation with lottie-web (SVG).
// Props: source (animation JSON), style, autoPlay, loop, progress (0..1),
// resizeMode ('contain'|'cover'|'center'), colorFilters ([{keypath, color}]),
// onAnimationFinish. Ref methods: play, pause, resume, reset.
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {View} from 'react-native';
import lottie from 'lottie-web/build/player/lottie_light.js';

// any CSS color -> lottie [r, g, b, a] with 0..1 values
let color_ctx;
function color_parse(color){
  color_ctx ||= document.createElement('canvas').getContext('2d',
    {willReadFrequently: true});
  color_ctx.clearRect(0, 0, 1, 1);
  color_ctx.fillStyle = '#000';
  color_ctx.fillStyle = color;
  color_ctx.fillRect(0, 0, 1, 1);
  let [r, g, b, a] = color_ctx.getImageData(0, 0, 1, 1).data;
  return [r/255, g/255, b/255, a/255];
}

// set the color of every fill ('fl') and stroke ('st') below a shape list
function shapes_color_set(shapes, rgba){
  for (let shape of shapes||[]){
    if (shape.ty=='gr'){
      shapes_color_set(shape.it, rgba);
      continue;
    }
    if (shape.ty!='fl' && shape.ty!='st')
      continue;
    if (!shape.c?.a){
      shape.c = {a: 0, k: rgba};
      continue;
    }
    for (let key of shape.c.k){
      if (key.s)
        key.s = rgba;
      if (key.e)
        key.e = rgba;
    }
  }
}

// colorFilters: keypath is a layer name, or '**' for all layers
function color_filters_apply(data, color_filters){
  for (let {keypath, color} of color_filters||[]){
    let rgba = color_parse(color);
    for (let layer of data.layers||[]){
      if (keypath!='**' && layer.nm!=keypath)
        continue;
      shapes_color_set(layer.shapes, rgba);
    }
  }
}

const aspect_ratio = {
  contain: 'xMidYMid meet',
  cover: 'xMidYMid slice',
  center: 'xMidYMid meet',
};

const LottieView = forwardRef((props, ref)=>{
  let {source, style, autoPlay, loop=true, progress, resizeMode='contain',
    colorFilters, onAnimationFinish} = props;
  let container = useRef(null);
  let anim = useRef(null);
  let on_finish = useRef(null);
  on_finish.current = onAnimationFinish;
  let color_filters_key = JSON.stringify(colorFilters||null);
  useEffect(()=>{
    if (!container.current || !source || typeof source!='object')
      return;
    // lottie-web modifies the animation data: give it its own copy
    let data = structuredClone(source);
    color_filters_apply(data, colorFilters);
    let a = anim.current = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: !!loop,
      autoplay: !!autoPlay,
      animationData: data,
      rendererSettings: {preserveAspectRatio:
        aspect_ratio[resizeMode]||aspect_ratio.contain},
    });
    if (!autoPlay && progress!=null)
      a.goToAndStop(progress*(a.totalFrames-1), true);
    a.addEventListener('complete', ()=>on_finish.current?.(false));
    return ()=>{
      anim.current = null;
      a.destroy();
    };
  }, [source, autoPlay, loop, progress, resizeMode, color_filters_key]);
  useImperativeHandle(ref, ()=>({
    play: ()=>anim.current?.goToAndPlay(0, true),
    pause: ()=>anim.current?.pause(),
    resume: ()=>anim.current?.play(),
    reset: ()=>anim.current?.goToAndStop(0, true),
  }), []);
  return React.createElement(View, {style, ref: container});
});

export default LottieView;
