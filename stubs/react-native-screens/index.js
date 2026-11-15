// react-native-screens for web: the native screen containers are plain
// React Native views.
import React from 'react';
import {View} from 'react-native';

const view = React.forwardRef(({children, style}, ref)=>
  React.createElement(View, {style, ref}, children));
export const enableScreens = ()=>{};
export const enableFreeze = ()=>{};
export const screensEnabled = ()=>false;
export const Screen = view;
export const ScreenContainer = view;
export const ScreenStack = view;
export const ScreenStackHeaderConfig = ()=>null;
export const NativeStackView = ({children})=>children;
