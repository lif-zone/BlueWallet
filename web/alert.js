// React Native Alert for web: an HTML <dialog> popup.
// Alert.alert(title, message, buttons, options)
// buttons: [{text, onPress, style: 'default'|'cancel'|'destructive'}]
// options: {cancelable, onDismiss}
import {dialog_show} from './dialog.js';

export default class Alert {
  static alert(title, message, buttons, options){
    dialog_show({title, message, buttons, cancelable: options?.cancelable,
      onDismiss: options?.onDismiss});
  }
}
