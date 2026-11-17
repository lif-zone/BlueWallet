// React Native BackHandler for web: captures the browser Back button.
// BackHandler.addEventListener('hardwareBackPress', handler) -> {remove()}
// On Back, handlers are called newest first. A handler that returns true
// handled it: the navigation is cancelled. Otherwise Back goes on as usual.
// Uses the Navigation API. The browser lets a page cancel Back only after
// the user interacted with it, so a page cannot trap the user.
let handlers = [];
let listening;

function on_navigate(event){
  let nav = globalThis.navigation;
  if (event.navigationType!='traverse' || !event.cancelable)
    return;
  // only the user's Back (browser button, mouse, gesture). The application
  // moves in the history too (react-navigation after a pop): that is not a
  // Back press, and handling it as one pops a second screen.
  if (!event.userInitiated)
    return;
  if (event.destination.index<0 ||
    event.destination.index>=nav.currentEntry.index)
  {
    return;
  }
  for (let i=handlers.length-1; i>=0; i--){
    if (handlers[i]()!==true)
      continue;
    event.preventDefault();
    return;
  }
}

function listen(){
  if (listening || !globalThis.navigation)
    return;
  listening = true;
  globalThis.navigation.addEventListener('navigate', on_navigate);
}

function removeEventListener(type, handler){
  let i = handlers.lastIndexOf(handler);
  if (i>=0)
    handlers.splice(i, 1);
}

function addEventListener(type, handler){
  if (type!='hardwareBackPress')
    return {remove: ()=>{}};
  listen();
  handlers.push(handler);
  return {remove: ()=>removeEventListener(type, handler)};
}

// a web page cannot close itself
function exitApp(){}

export default {addEventListener, removeEventListener, exitApp};
