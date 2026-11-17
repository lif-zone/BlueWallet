// react-native-safe-area-context for web: a browser window has no notch or
// system bars inside the page, so all insets are 0 and the views are plain
// React Native views.
import React from 'react';
import {View} from 'react-native';

const insets = {top: 0, bottom: 0, left: 0, right: 0};
const frame = ()=>({x: 0, y: 0, width: window.innerWidth,
  height: window.innerHeight});

export const SafeAreaInsetsContext = React.createContext(insets);
export const SafeAreaFrameContext = React.createContext(frame());
export const SafeAreaProvider = ({children, style})=>
  React.createElement(View, {style: [{flex: 1}, style]}, children);
export const SafeAreaView = React.forwardRef(({edges, mode, ...props}, ref)=>
  React.createElement(View, {...props, ref}));
export const useSafeAreaInsets = ()=>insets;
export const useSafeAreaFrame = ()=>frame();
export const initialWindowMetrics = {insets, frame: frame()};
export const withSafeAreaInsets = Comp=>React.forwardRef((props, ref)=>
  React.createElement(Comp, {...props, insets, ref}));
