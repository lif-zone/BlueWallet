// The "End-to-end TLS" switch, in the Electrum Server screen of Settings
// (screen/settings/ElectrumSettings.tsx, by a patch of package.json): a
// row of the Preferred Server section, above its Save button.
import React, {useState} from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';
import {useTheme} from '../components/themes.ts';
import {tls_secure_get, tls_secure_set} from './tls_secure.js';

export function TlsSecure(){
  let {colors} = useTheme();
  let [on, set_on] = useState(tls_secure_get());
  let on_change = value=>{
    tls_secure_set(value);
    set_on(tls_secure_get());
  };
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, {color: colors.foregroundColor}]}>
          End-to-end TLS
        </Text>
        <Text style={[styles.note, {color: colors.alternativeTextColor}]}>
          TLS is made in this browser: the relay node sees only encrypted
          data. Slower to connect.
        </Text>
      </View>
      <Switch testID="TlsSecureSwitch" value={on} onValueChange={on_change}/>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  text: {
    flex: 1,
    marginRight: 14,
  },
  title: {
    fontSize: 15,
  },
  note: {
    fontSize: 13,
    marginTop: 2,
  },
});
