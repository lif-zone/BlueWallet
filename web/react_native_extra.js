// Exports of react-native that react-native-web does not have. Added to its
// index by a patch in package.json.

import {SegmentedControl} from './segmented_control.js';

// a native component: the web one when there is one, otherwise nothing to
// show
const native_components = {SegmentedControl};
export function codegenNativeComponent(name){
  return native_components[name]||(props=>null);
}

// a color of the platform theme: none on web
export function PlatformColor(){
  return undefined;
}

// the developer menu of React Native (components/DevMenu.tsx): none on web
export const DevSettings = {
  addMenuItem(title, handler){},
  reload(){},
};
