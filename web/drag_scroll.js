// A drag with the mouse is a swipe: it scrolls the list under it, as a
// finger does on a phone. Without it, the drag marks text.
// - mouse only: touch and pen scroll by themselves.
// - a press that does not move stays a click, and a long press stays a long
//   press. The click that ends a drag is dropped.
// - text is still marked by a drag where the application made it selectable
//   (user-select: text), and in an input.
// - an element with its own drag is left alone (draggable=true: the reorder
//   and the swipe rows of Manage Wallets).

// the move, in pixels, that turns a press into a drag
const drag_min = 6;

// the press of the mouse: {id, target, x, y (last position), scroller}
let d;
let click_skip = false;

function is_input(elm){
  return !!elm.closest('input, textarea, select, [contenteditable=""], '
    +'[contenteditable=true]');
}

function is_selectable(elm){
  for (; elm; elm = elm.parentElement){
    let v = getComputedStyle(elm).userSelect;
    if (v=='text' || v=='all')
      return true;
    if (v=='none')
      return false;
  }
  return false;
}

// the closest element, from elm up, that scrolls in the axis ('x' or 'y')
function scroller_find(elm, axis){
  for (; elm; elm = elm.parentElement){
    let cs = getComputedStyle(elm);
    if (axis=='x' && /auto|scroll/.test(cs.overflowX)
      && elm.scrollWidth>elm.clientWidth+1)
    {
      return elm;
    }
    if (axis=='y' && /auto|scroll/.test(cs.overflowY)
      && elm.scrollHeight>elm.clientHeight+1)
    {
      return elm;
    }
  }
}

function drag_start(event){
  let dx = event.clientX-d.x, dy = event.clientY-d.y;
  if (Math.hypot(dx, dy)<drag_min)
    return;
  let axis = Math.abs(dx)>Math.abs(dy) ? 'x' : 'y';
  let scroller = scroller_find(d.target, axis)
    || scroller_find(d.target, axis=='x' ? 'y' : 'x');
  if (!scroller){
    // nothing to scroll. the press stays, so that no text is marked
    d.x = event.clientX;
    d.y = event.clientY;
    return;
  }
  d.scroller = scroller;
  // a list that snaps to its items would jump back at each move
  d.style = {snap: scroller.style.scrollSnapType,
    behavior: scroller.style.scrollBehavior};
  scroller.style.scrollSnapType = 'none';
  scroller.style.scrollBehavior = 'auto';
  document.documentElement.style.cursor = 'grabbing';
  getSelection()?.removeAllRanges();
  // ends a long press that waits on this press
  // (web/stubs/react-native-context-menu-view.js)
  d.target.dispatchEvent(new PointerEvent('pointercancel',
    {bubbles: true, pointerId: d.id}));
}

function drag_end(){
  if (d?.scroller){
    d.scroller.style.scrollSnapType = d.style.snap;
    d.scroller.style.scrollBehavior = d.style.behavior;
    document.documentElement.style.cursor = '';
    // the click of the release of the button comes right after it
    click_skip = true;
    setTimeout(()=>click_skip = false, 0);
  }
  d = null;
}

function on_pointerdown(event){
  d = null;
  let target = event.target;
  if (event.pointerType!='mouse' || event.button || !target?.closest)
    return;
  if (is_input(target) || is_selectable(target)
    || target.closest('[draggable=true]'))
  {
    return;
  }
  d = {id: event.pointerId, target, x: event.clientX, y: event.clientY};
}

// the moves of a press are not always of the pointer of the press: a
// device may send the press as a mouse and its moves as a pen, with another
// pointerId. So a move is matched by its held button, not by its id
function on_pointermove(event){
  if (!d || event.pointerType=='touch')
    return;
  if (!(event.buttons&1)){
    if (event.pointerId==d.id)
      drag_end();
    return;
  }
  if (!d.scroller)
    drag_start(event);
  if (!d.scroller)
    return;
  d.scroller.scrollLeft -= event.clientX-d.x;
  d.scroller.scrollTop -= event.clientY-d.y;
  d.x = event.clientX;
  d.y = event.clientY;
}

function on_pointerend(event){
  // not the pointercancel that drag_start() sends
  if (!event.isTrusted || !d || event.pointerType=='touch')
    return;
  drag_end();
}

function on_click(event){
  if (!click_skip)
    return;
  click_skip = false;
  event.stopPropagation();
  event.preventDefault();
}

// the browser is about to mark text, or to drag an image
function on_select_or_drag(event){
  if (d)
    event.preventDefault();
}

document.addEventListener('pointerdown', on_pointerdown, true);
document.addEventListener('pointermove', on_pointermove, true);
document.addEventListener('pointerup', on_pointerend, true);
document.addEventListener('pointercancel', on_pointerend, true);
document.addEventListener('click', on_click, true);
document.addEventListener('selectstart', on_select_or_drag, true);
document.addEventListener('dragstart', on_select_or_drag, true);
