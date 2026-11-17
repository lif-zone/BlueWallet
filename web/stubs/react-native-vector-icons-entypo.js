// Entypo for web: the icon font (loaded in web/main.tsx), with the glyph
// map of the real package (dependency bw-icons-entypo).
import {createIconSet} from "@react-native-vector-icons/common";
import map from 'bw-icons-entypo/glyphmaps/Entypo.json' with {type: 'json'};
let Icon = createIconSet({type: 'codepoint', fontFamily: 'Entypo',
  displayName: 'Entypo', map});
export default Icon;
