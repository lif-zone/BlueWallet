// Exports of react-native that react-native-web does not have. Added to its
// index by a patch in package.json.

// a native component: nothing to show on web
export function codegenNativeComponent(name){
  return props=>null;
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
