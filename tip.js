// A caixa de dica do jogo, no lugar da dica nativa do navegador (o atributo title, que o jogo não usa).
// Qualquer elemento com data-tip="texto" mostra a caixa ao passar o mouse, ao receber foco pelo teclado ou ao toque.

const GAP = 10, EDGE = 6, ARROW = 14;
// Where the box goes: above the element and centred on it; below when there is no room above; never off the screen.
// `arrow` is how far from the box's left edge its pointer sits, so that it keeps pointing at the element's middle.
export function tipPlace(target,size,view) {
  const middle=target.left+target.width/2;
  const above=target.top-GAP-size.height>=EDGE||target.top>view.height-target.bottom;
  const left=Math.max(EDGE,Math.min(middle-size.width/2,view.width-size.width-EDGE));
  const top=above?Math.max(EDGE,target.top-GAP-size.height):target.bottom+GAP;
  return {left,top,side:above?'top':'bottom',arrow:Math.max(ARROW,Math.min(middle-left,size.width-ARROW))};
}

// One box for the whole game. It is a manual popover where the browser has them, so it sits in the top layer; and it is
// placed inside the open dialog when its element is there, because everything outside a modal dialog is inert.
const TOP_LAYER = typeof HTMLElement!=='undefined'&&'popover' in HTMLElement.prototype;
let box=null,owner=null,showTimer=null,hideTimer=null,point=null;

function build() {
  box=document.createElement('div');
  box.id='tip';box.setAttribute('role','tooltip');
  if(TOP_LAYER)box.popover='manual';
  const arrow=document.createElement('i');arrow.setAttribute('aria-hidden','true');
  box.append(document.createElement('span'),arrow);
  return box;
}
const open = ()=>!!box&&(TOP_LAYER?box.matches(':popover-open'):box.classList.contains('on'));
function show(el) {
  clearTimeout(showTimer);clearTimeout(hideTimer);
  const text=el.dataset.tip;
  if(!text||!el.isConnected)return hide();
  const node=box||build(),host=el.closest('dialog[open]')||document.body;
  // Moving the box to another host closes it, which is what puts it back on top when it opens again.
  if(node.parentNode!==host)host.append(node);
  node.firstChild.textContent=text;
  if(owner!==el){owner?.removeAttribute('aria-describedby');owner=el;el.setAttribute('aria-describedby','tip');}
  if(!open()){if(TOP_LAYER)node.showPopover();else node.classList.add('on');}
  const place=tipPlace(el.getBoundingClientRect(),{width:node.offsetWidth,height:node.offsetHeight},{width:innerWidth,height:innerHeight});
  node.dataset.side=place.side;
  node.style.left=`${Math.round(place.left)}px`;node.style.top=`${Math.round(place.top)}px`;
  node.style.setProperty('--arrow',`${Math.round(place.arrow)}px`);
}
function hide() {
  clearTimeout(showTimer);clearTimeout(hideTimer);
  owner?.removeAttribute('aria-describedby');owner=null;
  if(!open())return;
  if(TOP_LAYER)box.hidePopover();else box.classList.remove('on');
}
// A short wait before closing lets the pointer travel from the element to the box itself, where the text stays readable.
const later = ()=>{clearTimeout(showTimer);clearTimeout(hideTimer);hideTimer=setTimeout(hide,160);};
const tipOf = node=>node instanceof Element?node.closest('[data-tip]'):null;

// The screens are redrawn all the time, which replaces the element under the pointer. After a redraw the box follows
// whatever now sits at the same spot, with its new text, or closes when nothing there has a tip. It looks through
// everything at that spot, not only the topmost element: a number that grows for a moment when it changes may be
// passing over the element the pointer is resting on.
export function refreshTips() {
  if(!owner||owner.isConnected)return;
  const el=point&&document.elementsFromPoint(point[0],point[1]).map(tipOf).find(Boolean);
  if(el)show(el);else hide();
}
export function initTips() {
  document.addEventListener('pointerover',event=>{
    point=[event.clientX,event.clientY];
    if(event.pointerType!=='mouse')return;
    const el=tipOf(event.target);
    if(el===owner&&el)clearTimeout(hideTimer);
    else if(el){clearTimeout(showTimer);showTimer=setTimeout(()=>show(el),owner?0:140);}
    else if(box?.contains(event.target))clearTimeout(hideTimer);
    else later();
  });
  document.addEventListener('pointermove',event=>{point=[event.clientX,event.clientY];},{passive:true});
  // A touch has no hover: a tap on the element opens its tip, a tap anywhere else closes it. A mouse press closes it.
  document.addEventListener('pointerdown',event=>{
    point=[event.clientX,event.clientY];
    if(box?.contains(event.target))return;
    const el=event.pointerType==='mouse'?null:tipOf(event.target);
    if(el&&el!==owner)show(el);else hide();
  });
  document.addEventListener('focusin',event=>{const el=tipOf(event.target);if(el&&event.target.matches(':focus-visible'))show(el);});
  document.addEventListener('focusout',()=>{if(owner)later();});
  // Esc closes the tip first, without closing the dialog it may be in.
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open()){event.preventDefault();event.stopImmediatePropagation();hide();}},true);
  addEventListener('scroll',()=>{if(open())hide();},{capture:true,passive:true});
  addEventListener('resize',hide);
}
