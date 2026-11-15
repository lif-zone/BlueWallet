// react-native-svg for web: renders the real SVG elements.
// Svg ref: toDataURL(callback) gives the image as base64 PNG, like native.
import React, {forwardRef, useImperativeHandle, useRef} from 'react';

// React Native props -> DOM props
function props_get({testID, onPress, href, xlinkHref, ...props}){
  if (testID)
    props['data-testid'] = testID;
  if (onPress)
    props.onClick = onPress;
  // an image source from require() is {uri}
  href ??= xlinkHref;
  if (href!=null)
    props.href = typeof href=='object' ? href.uri : href;
  return props;
}

const elm = tag=>forwardRef(({children, ...props}, ref)=>
  React.createElement(tag, {...props_get(props), ref}, children));

function svg_to_data_url(svg, callback){
  let rect = svg.getBoundingClientRect();
  let width = svg.width.baseVal.value||rect.width;
  let height = svg.height.baseVal.value||rect.height;
  let xml = new XMLSerializer().serializeToString(svg);
  let img = new Image();
  img.onload = ()=>{
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/,
      ''));
  };
  img.onerror = ()=>callback('');
  img.src = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);
}

export const Svg = forwardRef(({children, ...props}, ref)=>{
  let svg = useRef(null);
  useImperativeHandle(ref, ()=>({
    toDataURL: callback=>svg_to_data_url(svg.current, callback),
  }), []);
  return React.createElement('svg', {xmlns: 'http://www.w3.org/2000/svg',
    ...props_get(props), ref: svg}, children);
});
export const Circle = elm('circle');
export const Rect = elm('rect');
export const Path = elm('path');
export const G = elm('g');
export const Text = elm('text');
export const Line = elm('line');
export const Polygon = elm('polygon');
export const Polyline = elm('polyline');
export const Defs = elm('defs');
export const Stop = elm('stop');
export const LinearGradient = elm('linearGradient');
export const RadialGradient = elm('radialGradient');
export const ClipPath = elm('clipPath');
export const Use = elm('use');
export const Image = elm('image');
export const Mask = elm('mask');
export const Pattern = elm('pattern');
export const Ellipse = elm('ellipse');
export const TSpan = elm('tspan');
export const ForeignObject = elm('foreignObject');
export const Symbol = elm('symbol');
export const Marker = elm('marker');
export default Svg;
