// react-native-camera-kit for web: a <video> of the device camera, scanned
// for QR codes (bw-web/qr_decode.js).
// Camera props used: style, cameraType, scanBarcode, scanThrottleDelay,
// onReadCode({nativeEvent: {codeStringValue}}), torchMode, resizeMode,
// onError.
import React, {forwardRef, useEffect, useImperativeHandle, useRef}
  from 'react';
import {View} from 'react-native';
import {qr_decode, qr_decode_image} from 'bw-web/qr_decode.js';

export const CameraType = {Back: 'back', Front: 'front'};
export const Orientation = {PORTRAIT: 0, PORTRAIT_UPSIDE_DOWN: 1,
  LANDSCAPE_LEFT: 2, LANDSCAPE_RIGHT: 3};
export const CameraApi = {};

// image: base64 of an image file. returns the QR code text, or null
export async function detectQRCodeInImage(image){
  try {
    return await qr_decode_image(image);
  } catch(e){
    console.warn('detectQRCodeInImage failed', e);
    return null;
  }
}

export const Camera = forwardRef((props, ref)=>{
  let {style, cameraType=CameraType.Back, scanBarcode, torchMode,
    scanThrottleDelay=2000, resizeMode='contain'} = props;
  let video = useRef(null);
  let track = useRef(null);
  let props_ref = useRef(props);
  props_ref.current = props;
  useEffect(()=>{
    let stopped, stream, timer;
    let scan = async()=>{
      if (stopped)
        return;
      try {
        let text = props_ref.current.scanBarcode && video.current &&
          await qr_decode(video.current);
        if (text && !stopped){
          props_ref.current.onReadCode?.({nativeEvent:
            {codeStringValue: text, codeFormat: 'qr'}});
        }
      } catch(e){
        console.warn('qr scan failed', e);
      }
      timer = setTimeout(scan, Math.max(50, scanThrottleDelay));
    };
    (async()=>{
      try {
        stream = await navigator.mediaDevices.getUserMedia({video: {
          facingMode: cameraType==CameraType.Front ? 'user' : 'environment',
        }});
      } catch(e){
        console.warn('camera not available', e);
        props_ref.current.onError?.({nativeEvent: {errorMessage: ''+e}});
        return;
      }
      if (stopped){
        stream.getTracks().forEach(t=>t.stop());
        return;
      }
      track.current = stream.getVideoTracks()[0];
      video.current.srcObject = stream;
      scan();
    })();
    return ()=>{
      stopped = true;
      clearTimeout(timer);
      track.current = null;
      stream?.getTracks().forEach(t=>t.stop());
    };
  }, [cameraType, scanThrottleDelay]);
  // the flashlight, where the camera has one
  useEffect(()=>{
    let t = track.current;
    if (!t?.getCapabilities?.().torch)
      return;
    t.applyConstraints({advanced: [{torch: torchMode=='on'}]}).catch(()=>{});
  }, [torchMode]);
  useImperativeHandle(ref, ()=>({
    capture: async()=>{
      throw Error('camera capture is not supported on web');
    },
    requestDeviceCameraAuthorization: async()=>true,
    checkDeviceCameraAuthorizationStatus: async()=>true,
  }), []);
  return React.createElement(View, {style: [{overflow: 'hidden',
    backgroundColor: '#000'}, style]},
    React.createElement('video', {ref: video, autoPlay: true,
      playsInline: true, muted: true, style: {width: '100%', height: '100%',
      objectFit: resizeMode=='cover' ? 'cover' : 'contain'}}));
});

export const CameraScreen = Camera;
export default Camera;
