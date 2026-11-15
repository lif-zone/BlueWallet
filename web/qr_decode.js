// QR code reading for the web port. Uses the browser's BarcodeDetector where
// it exists (not on every platform), otherwise the jsQR library.
// qr_decode(source): source is a <video>, <img>, <canvas> or ImageBitmap.
// returns the text of the first QR code found, or null
import jsQR from 'jsqr';

let detector;
let canvas, ctx;
async function detector_get(){
  if (detector!==undefined)
    return detector;
  detector = null;
  try {
    if (globalThis.BarcodeDetector &&
      (await BarcodeDetector.getSupportedFormats()).includes('qr_code'))
    {
      detector = new BarcodeDetector({formats: ['qr_code']});
    }
  } catch(e){}
  return detector;
}

export async function qr_decode(source){
  let width = source.videoWidth||source.naturalWidth||source.width;
  let height = source.videoHeight||source.naturalHeight||source.height;
  if (!width || !height)
    return null;
  let d = await detector_get();
  if (d){
    let codes = await d.detect(source);
    return codes[0]?.rawValue ?? null;
  }
  canvas ||= document.createElement('canvas');
  ctx ||= canvas.getContext('2d', {willReadFrequently: true});
  // a large frame only slows the scan down
  let scale = Math.min(1, 1024/Math.max(width, height));
  canvas.width = Math.round(width*scale);
  canvas.height = Math.round(height*scale);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  let image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let code = jsQR(image.data, image.width, image.height);
  return code?.data || null;
}

// image: base64 of an image file, or a data:/blob: url
export async function qr_decode_image(image){
  let url = /^(data|blob):/.test(image) ? image
    : 'data:image/png;base64,'+image;
  let bitmap = await createImageBitmap(await (await fetch(url)).blob());
  try {
    return await qr_decode(bitmap);
  } finally {
    bitmap.close();
  }
}
