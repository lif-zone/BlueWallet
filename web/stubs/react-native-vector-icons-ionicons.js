// Ionicons for web: the icon font (loaded in web/main.tsx), with the glyph
// map of the real package (dependency bw-icons-ionicons).
import {createIconSet} from "@react-native-vector-icons/common";
import map from 'bw-icons-ionicons/glyphmaps/Ionicons.json' with {type: 'json'};
let Icon = createIconSet({type: 'codepoint', fontFamily: 'Ionicons',
  displayName: 'Ionicons', map});
export default Icon;
