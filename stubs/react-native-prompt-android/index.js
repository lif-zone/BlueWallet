// react-native-prompt-android for web: an HTML <dialog> with a text field.
// prompt(title, message, callbackOrButtons, options)
// buttons: [{text, onPress(value), style: 'default'|'cancel'|'destructive'}]
// options: {type, defaultValue, placeholder, cancelable}
import {dialog_show} from 'bw-web/dialog.js';

const input_types = {
  'secure-text': {type: 'password'},
  'login-password': {type: 'password'},
  'numeric': {type: 'text', inputmode: 'numeric'},
  'email-address': {type: 'email'},
  'phone-pad': {type: 'tel'},
};

export default function prompt(title, message, callbackOrButtons, options={}){
  let buttons = callbackOrButtons;
  if (typeof buttons=='function'){
    buttons = [{text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: callbackOrButtons}];
  }
  let input = {...(input_types[options.type]||{type: 'text'}),
    value: options.defaultValue, placeholder: options.placeholder};
  dialog_show({title, message, buttons, input,
    cancelable: options.cancelable!==false});
}
