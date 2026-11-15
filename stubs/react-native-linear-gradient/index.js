// react-native-linear-gradient for web: a CSS linear-gradient.
// Props: colors, start/end ({x, y} in 0..1, default top to bottom),
// locations (0..1 per color), style.
import React from 'react';
import {View} from 'react-native';

export default function LinearGradient({children, colors, style,
  start={x: 0.5, y: 0}, end={x: 0.5, y: 1}, locations, useAngle, angle,
  angleCenter, ...props})
{
  let css;
  if (colors?.length){
    // CSS angle: 0deg points up, 90deg points right
    let deg = useAngle ? angle
      : Math.atan2(end.x-start.x, start.y-end.y)*180/Math.PI;
    let stops = colors.map((color, i)=>locations?.[i]!=null
      ? color+' '+locations[i]*100+'%' : color);
    css = 'linear-gradient('+deg+'deg, '+stops.join(', ')+')';
  }
  return React.createElement(View, {...props,
    style: [style, css && {backgroundImage: css}]}, children);
}
