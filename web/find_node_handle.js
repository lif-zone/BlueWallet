// React Native findNodeHandle for web. On React Native it gives the number
// of the native view of a component, which BlueWallet passes on as the
// anchor of a popup. react-native-web throws instead. Here: a number per
// component (the same one each time), or null without a component.
let handles = new WeakMap();
let next = 1;

export default function findNodeHandle(component){
  if (component==null)
    return null;
  if (typeof component=='number')
    return component;
  if (typeof component!='object' && typeof component!='function')
    return null;
  let handle = handles.get(component);
  if (!handle)
    handles.set(component, handle = next++);
  return handle;
}
