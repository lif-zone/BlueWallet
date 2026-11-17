import React from 'react';
function flatStyle(style){
  let s = Array.isArray(style) ? Object.assign({}, ...style) : (style||{});
  if (Array.isArray(s.transform)){
    s.transform = s.transform.map(t=>{
      let k = Object.keys(t)[0];
      return k+'('+t[k]+')';
    }).join(' ');
  }
  return s;
}
export function createIconSet(config){
  if (!config)
    config = {};
  let Icon = React.forwardRef(({name, size, color, style, iconStyle, accessibilityLabel, testID, ...props}, ref)=>{
    if (size==null)
      size = 24;
    if (!color)
      color = '#000';
    let s = flatStyle(style);
    if (config.type=='class'){
      let cls = config.cls(name);
      return React.createElement('i', {ref, className: cls,
        style: {fontSize: size, color, ...s, fontStyle: 'normal', lineHeight: 1},
        ...props});
    }
    if (config.type=='ligature')
      return React.createElement('span', {ref, className: config.className,
        style: {fontSize: size, color, ...s, lineHeight: 1},
        ...props}, config.nameTransform ? config.nameTransform(name) : name);
    if (config.type=='codepoint'){
      let code = config.map?.[name];
      return React.createElement('span', {ref,
        style: {fontFamily: config.fontFamily, fontSize: size, color,
          fontStyle: 'normal', fontWeight: 'normal', lineHeight: 1, ...s},
        ...props}, code ? String.fromCodePoint(code) : '');
    }
    return React.createElement('span', {ref,
      style: {fontSize: size, color, ...s, lineHeight: 1}, ...props}, name);
  });
  Icon.displayName = config.displayName||'Icon';
  return Icon;
}
