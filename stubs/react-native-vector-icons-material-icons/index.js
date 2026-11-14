import {createIconSet} from "@react-native-vector-icons/common";
let Icon = createIconSet({type: 'ligature', className: 'material-icons',
  nameTransform: n=>n.replace(/-/g, '_'), displayName: 'MaterialIcons'});
export default Icon;
