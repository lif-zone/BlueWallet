// The native SegmentedControl of BlueWallet (codegen/
// SegmentedControlNativeComponent.ts) for web: a row of buttons, one of them
// selected.
// Props: values, selectedIndex, enabled, tintColor, textColor,
// backgroundColor, style, testID, onChange({nativeEvent: {selectedIndex}})
import React from 'react';

const TINT = '#007AFF';

export function SegmentedControl({values=[], selectedIndex=0, enabled=true,
  tintColor, textColor, backgroundColor, style, testID, onChange})
{
  let tint = tintColor||TINT;
  let height = style?.height||32;
  let root = {display: 'flex', flexDirection: 'row', height,
    boxSizing: 'border-box', border: '1px solid '+tint, borderRadius: 8,
    overflow: 'hidden', backgroundColor: backgroundColor||'transparent',
    opacity: enabled ? 1 : 0.5};
  let buttons = values.map((value, i)=>{
    let selected = i==selectedIndex;
    let button = {flex: 1, minWidth: 0, border: 'none', padding: '0 8px',
      borderLeft: i ? '1px solid '+tint : 'none', font: 'inherit',
      fontSize: 13, fontWeight: selected ? 600 : 400,
      cursor: enabled ? 'pointer' : 'default', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      backgroundColor: selected ? tint : 'transparent',
      color: selected ? '#fff' : textColor||tint};
    return React.createElement('button', {key: i, type: 'button',
      role: 'tab', 'aria-selected': selected, disabled: !enabled,
      style: button, onClick: ()=>{
        if (selected)
          return;
        onChange?.({nativeEvent: {selectedIndex: i}});
      }}, value);
  });
  return React.createElement('div', {role: 'tablist', 'data-testid': testID,
    style: root}, buttons);
}
