// react-native-permissions for web. The camera permission is the browser's
// own; the others (notifications) are not available.
export const RESULTS = {UNAVAILABLE: 'unavailable', DENIED: 'denied',
  LIMITED: 'limited', GRANTED: 'granted', BLOCKED: 'blocked'};
export const PERMISSIONS = {IOS: {CAMERA: 'camera'},
  ANDROID: {CAMERA: 'camera'}};

// browser permission state -> react-native-permissions result.
// 'prompt' counts as GRANTED: the browser asks the user by itself the moment
// the camera is started, so the app should go ahead and start it
const states = {granted: RESULTS.GRANTED, prompt: RESULTS.GRANTED,
  denied: RESULTS.BLOCKED};

export async function check(permission){
  if (permission!='camera' || !navigator.mediaDevices?.getUserMedia)
    return RESULTS.UNAVAILABLE;
  try {
    let status = await navigator.permissions.query({name: 'camera'});
    return states[status.state]||RESULTS.DENIED;
  } catch(e){
    return RESULTS.DENIED;
  }
}

// the browser shows its own prompt when the camera is started: nothing to
// ask for in advance
export const request = check;

export const checkNotifications = async()=>
  ({status: RESULTS.UNAVAILABLE, settings: {}});
export const requestNotifications = async()=>
  ({status: RESULTS.UNAVAILABLE, settings: {}});
export const openSettings = async()=>{};
