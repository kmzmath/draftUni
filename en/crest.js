// O escudo do time do jogador, montado com peças prontas: um formato, um padrão, quatro cores e um adorno.
// Tudo aqui é desenho em um quadro de 100 x 100: o mesmo traço vira SVG nas telas (crestSvg) e é pintado num canvas na
// imagem do resultado (paintCrest). O que se guarda do escudo são só os nomes das peças (veja cleanCrest).

const circle = (x,y,r)=>`M${x} ${y-r}A${r} ${r} 0 1 1 ${x} ${y+r}A${r} ${r} 0 1 1 ${x} ${y-r}Z`;
const round = value=>Math.round(value*100)/100;
const polar = (radius,degrees)=>`${round(radius*Math.cos(degrees*Math.PI/180))} ${round(radius*Math.sin(degrees*Math.PI/180))}`;
// A band along the diagonal that goes down to the right, `wide` across, starting `at` along the top edge.
const slash = (at,wide)=>`M${at} -10L${at+wide} -10L${at+wide+120} 110L${at+120} 110Z`;
const backslash = (at,wide)=>`M${at} -10L${at+wide} -10L${at+wide-120} 110L${at-120} 110Z`;

// The outline of the crest. `cy` is where the middle of its field is, for the sign; `scale`, how much of the sign fits.
export const SHAPES = {
  classico:{name:"Classic",path:'M10 10H90V52C90 76 72 90 50 96C28 90 10 76 10 52Z',cy:47,scale:1},
  ponta:{name:"Pointed",path:'M50 6L90 20V52C90 76 72 90 50 96C28 90 10 76 10 52V20Z',cy:51,scale:1},
  brasao:{name:"Heraldic Shield",path:'M10 14L28 7L50 14L72 7L90 14V56C90 78 70 90 50 96C30 90 10 78 10 56Z',cy:50,scale:1},
  moderno:{name:"Modern",path:'M12 8H88V58L50 96L12 58Z',cy:44,scale:.95},
  hexagono:{name:"Hexagon",path:'M50 5L89 27.5V72.5L50 95L11 72.5V27.5Z',cy:50,scale:1},
  redondo:{name:"Round",path:circle(50,50,44),cy:50,scale:1},
  losango:{name:"Diamond",path:'M50 4L94 50L50 96L6 50Z',cy:50,scale:.66},
  flamula:{name:"Pennant",path:'M14 8H86V92L50 76L14 92Z',cy:42,scale:.92}
};

// What is drawn over the base colour, inside the outline, in the colour of the pattern.
export const PATTERNS = {
  liso:{name:"Solid",path:''},
  palas:{name:"Vertical stripes",path:'M22 0h14v100h-14zM43 0h14v100h-14zM64 0h14v100h-14z'},
  faixas:{name:"Horizontal stripes",path:'M0 20h100v13H0zM0 43h100v13H0zM0 66h100v13H0z'},
  listras:{name:"Diagonal stripes",path:[-100,-60,-20,20,60].map(at=>slash(at,20)).join('')},
  banda:{name:"Diagonal band",path:slash(-24,28)},
  pala:{name:"Vertical band",path:'M36 0h28v100h-28z'},
  faixa:{name:"Horizontal band",path:'M0 34h100v28H0z'},
  chefe:{name:"Top",path:'M0 0h100v34H0z'},
  metade:{name:"Halves",path:'M50 0h50v100h-50z'},
  corte:{name:"Split",path:'M0 50h100v50H0z'},
  quartos:{name:"Quarters",path:'M50 0h50v50h-50zM0 50h50v50H0z'},
  xadrez:{name:"Checkerboard",path:Array.from({length:16},(_,i)=>[i%4,Math.floor(i/4)]).filter(([x,y])=>(x+y)%2).map(([x,y])=>`M${x*25} ${y*25}h25v25h-25z`).join('')},
  cruz:{name:"Cross",path:'M40 0h20v36h40v20h-40v44h-20v-44h-40v-20h40z'},
  sautor:{name:"X",path:slash(-22,24)+backslash(98,24)},
  chevron:{name:"Chevron",path:'M0 72L50 34L100 72V96L50 58L0 96Z'},
  raios:{name:"Rays",path:Array.from({length:8},(_,i)=>`M50 48L${round(50+90*Math.cos((i*45-11.25)*Math.PI/180))} ${round(48+90*Math.sin((i*45-11.25)*Math.PI/180))}L${round(50+90*Math.cos((i*45+11.25)*Math.PI/180))} ${round(48+90*Math.sin((i*45+11.25)*Math.PI/180))}Z`).join('')}
};

// The sign in the middle of the crest, drawn around the origin (about 25 to each side) and put in place by the shape.
// The initials of the team are text, written with the display face of the game.
export const SIGNS = {
  nenhum:{name:"No emblem",path:''},
  iniciais:{name:"Initials",path:'',text:true},
  estrela:{name:"Star",path:'M'+Array.from({length:10},(_,i)=>polar(i%2?11:26,-90+36*i)).join('L')+'Z'},
  coroa:{name:"Crown",path:'M-22 12L-26 -14L-12 -2L0 -20L12 -2L26 -14L22 12ZM-22 16H22V23H-22Z'},
  raio:{name:"Lightning bolt",path:'M6 -28L-18 4H-3L-8 28L18 -6H3Z'},
  chama:{name:"Flame",path:'M0 -27C6 -15 18 -9 18 7C18 19 10 27 0 27C-10 27 -18 19 -18 7C-18 -1 -14 -5 -10 -11C-9 -3 -6 -1 -3 -1C-4 -11 -4 -19 0 -27Z'},
  capelo:{name:"Graduation cap",path:'M0 -19L28 -6L0 7L-28 -6ZM-16 4V15C-16 21 16 21 16 15V4L0 11.5ZM23 -3h3.5v17h-3.5z'},
  mira:{name:"Crosshair",path:circle(0,0,21)+circle(0,0,15)+circle(0,0,4.5)+'M-2.5 -30h5v9h-5zM-2.5 21h5v9h-5zM-30 -2.5h9v5h-9zM21 -2.5h9v5h-9z'},
  espada:{name:"Sword",path:'M0 -30L4.5 -21V8H-4.5V-21ZM-14 8H14V13.5H-14ZM-3 13.5H3V22H-3Z'+circle(0,26.5,4.5)},
  trofeu:{name:"Trophy",path:'M-15 -24H15V-9C15 3 8 9 0 9C-8 9 -15 3 -15 -9ZM-4 9H4V17H-4ZM-12 17H12V24H-12ZM-15 -20H-24V-11C-24 -5 -20 -2 -15 -2V-6.5C-18 -6.5 -19.5 -8.5 -19.5 -11V-15.5H-15ZM15 -20H24V-11C24 -5 20 -2 15 -2V-6.5C18 -6.5 19.5 -8.5 19.5 -11V-15.5H15Z'},
  coracao:{name:"Heart",path:'M0 23C-20 9 -25 -1 -25 -10C-25 -18 -19 -23 -12 -23C-7 -23 -3 -20 0 -15C3 -20 7 -23 12 -23C19 -23 25 -18 25 -10C25 -1 20 9 0 23Z'},
  livro:{name:"Book",path:'M-28 -17C-18 -21 -8 -21 0 -15C8 -21 18 -21 28 -17V17C18 13 8 13 0 19C-8 13 -18 13 -28 17ZM-1.6 -9H1.6V13H-1.6Z'},
  escudo:{name:"Shield",path:'M-17 -23H17V-3C17 10 9 18 0 23C-9 18 -17 10 -17 -3ZM-9 -15V-3C-9 5 -5 10 0 13C5 10 9 5 9 -3V-15Z'},
  pata:{name:"Paw",path:circle(-17,-7,6.2)+circle(-6.5,-18,6.8)+circle(6.5,-18,6.8)+circle(17,-7,6.2)+'M0 -5C10 -5 19 6 17 15C15 23 6 20 0 20C-6 20 -15 23 -17 15C-19 6 -10 -5 0 -5Z'},
  losango:{name:"Diamond",path:'M0 -27L21 0L0 27L-21 0ZM0 -13L10 0L0 13L-10 0Z'},
  anel:{name:"Ring",path:circle(0,0,23)+circle(0,0,12)}
};

// The colours on offer: the ones of the tournament first, then the ones a team may want.
export const COLORS = {
  roxo:{name:"Purple",hex:'#5300eb'},lima:{name:"Lime",hex:'#d1f350'},preto:{name:"Black",hex:'#141414'},creme:{name:"Cream",hex:'#fdfaf4'},
  coral:{name:'Coral',hex:'#ff5d73'},ouro:{name:"Gold",hex:'#eac273'},vermelho:{name:"Red",hex:'#d9202f'},laranja:{name:"Orange",hex:'#ff7a1a'},
  amarelo:{name:"Yellow",hex:'#ffd21f'},verde:{name:"Green",hex:'#18a558'},musgo:{name:"Moss green",hex:'#0d5a3a'},ciano:{name:"Cyan",hex:'#22c7e8'},
  azul:{name:"Blue",hex:'#1c64f2'},marinho:{name:"Navy",hex:'#14265f'},rosa:{name:"Pink",hex:'#ff5fb3'},vinho:{name:"Burgundy",hex:'#7a1433'}
};
// Where each colour goes, in the order the choices are offered.
export const SLOTS = [['base',"Background"],['mark',"Pattern"],['edge',"Outline"],['ink',"Emblem"]];
// How thick the outline is, in the 100 x 100 frame.
export const EDGE = 6;
const FACE = '"Schabo Condensed",Impact,sans-serif';

// The design a team starts from when it opens the workshop: the colours of the tournament and its own initials.
// (The initials are cream and the pattern lime, so that they can be read over whatever pattern is picked first.)
export const DEFAULT_CREST = Object.freeze({shape:'classico',pattern:'liso',sign:'iniciais',base:'roxo',mark:'lima',edge:'preto',ink:'creme'});
const PARTS = {shape:SHAPES,pattern:PATTERNS,sign:SIGNS,base:COLORS,mark:COLORS,edge:COLORS,ink:COLORS};
const known = (list,key)=>typeof key==='string'&&Object.hasOwn(list,key);
// What is kept of a crest: the name of each piece. Anything unknown goes back to the starting design; what is not
// an object at all is no crest (the team then plays under the mark of the tournament).
export function cleanCrest(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  return Object.fromEntries(Object.entries(PARTS).map(([part,list])=>[part,known(list,raw[part])?raw[part]:DEFAULT_CREST[part]]));
}

// The letters of the team on its crest: the first of up to three words (the small ones between them do not count),
// or the first two of a single word.
const SMALL = new Set(['de','da','do','das','dos','e']);
export function initials(name) {
  const words=String(name||'').toLocaleUpperCase("en-US").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const main=words.filter(word=>!SMALL.has(word.toLocaleLowerCase("en-US")));
  const used=main.length?main:words;
  return used.length===1?[...used[0]].slice(0,2).join(''):used.slice(0,3).map(word=>[...word][0]).join('');
}
export const letterSize = (letters,scale)=>round([0,52,44,35][Math.min(3,[...letters].length)]*scale);

const esc = text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// The crest as a picture for the screens. `name` is the team's: it names the picture and gives the initials.
export function crestSvg(crest,{name=''}={}) {
  const c=cleanCrest(crest);
  if(!c)return '';
  const shape=SHAPES[c.shape],pattern=PATTERNS[c.pattern],sign=SIGNS[c.sign],hex=part=>COLORS[c[part]].hex,letters=sign.text?initials(name):'';
  return `<svg class="crest custom" viewBox="0 0 100 100" role="img" aria-label="${name.trim()?`Crest of ${esc(name.trim())}`:"Team crest"}">`
    +`<clipPath id="crest-${c.shape}"><path d="${shape.path}"/></clipPath>`
    +`<g clip-path="url(#crest-${c.shape})"><rect width="100" height="100" fill="${hex('base')}"/>${pattern.path?`<path d="${pattern.path}" fill="${hex('mark')}" fill-rule="evenodd"/>`:''}</g>`
    +(sign.path?`<path d="${sign.path}" fill="${hex('ink')}" fill-rule="evenodd" transform="translate(50 ${shape.cy}) scale(${shape.scale})"/>`:'')
    +(letters?`<text x="50" y="${shape.cy}" dy=".36em" text-anchor="middle" font-family="${esc(FACE)}" font-size="${letterSize(letters,shape.scale)}" fill="${hex('ink')}" data-scale="${shape.scale}">${esc(letters)}</text>`:'')
    +`<path d="${shape.path}" fill="none" stroke="${hex('edge')}" stroke-width="${EDGE}" stroke-linejoin="round"/></svg>`;
}

// The same crest painted on a canvas, `size` across with its corner at (left, top). `Path` is the browser's Path2D.
export function paintCrest(c,crest,left,top,size,{name='',Path=globalThis.Path2D}={}) {
  const clean=cleanCrest(crest);
  if(!clean)return;
  const shape=SHAPES[clean.shape],pattern=PATTERNS[clean.pattern],sign=SIGNS[clean.sign],hex=part=>COLORS[clean[part]].hex,outline=new Path(shape.path);
  c.save();c.translate(left,top);c.scale(size/100,size/100);
  c.save();c.clip(outline);
  c.fillStyle=hex('base');c.fillRect(0,0,100,100);
  if(pattern.path){c.fillStyle=hex('mark');c.fill(new Path(pattern.path),'evenodd');}
  c.restore();
  if(sign.path){
    c.save();c.translate(50,shape.cy);c.scale(shape.scale,shape.scale);
    c.fillStyle=hex('ink');c.fill(new Path(sign.path),'evenodd');
    c.restore();
  }
  const letters=sign.text?initials(name):'';
  if(letters){
    const px=letterSize(letters,shape.scale);
    c.fillStyle=hex('ink');c.font=`400 ${px}px ${FACE}`;c.textAlign='center';c.textBaseline='alphabetic';
    c.fillText(letters,50,round(shape.cy+px*.36));
  }
  c.strokeStyle=hex('edge');c.lineWidth=EDGE;c.lineJoin='round';c.stroke(outline);
  c.restore();
}

// A crest drawn by lot that can always be read: the pattern, the sign and the outline never take the colour they
// would disappear on.
export function randomCrest(random=Math.random) {
  const pick=list=>list[Math.min(list.length-1,Math.floor(random()*list.length))],colors=Object.keys(COLORS);
  const base=pick(colors),mark=pick(colors.filter(key=>key!==base)),ink=pick(colors.filter(key=>key!==base&&key!==mark)),edge=pick(colors.filter(key=>key!==base));
  return {shape:pick(Object.keys(SHAPES)),pattern:pick(Object.keys(PATTERNS)),sign:pick(Object.keys(SIGNS)),base,mark,edge,ink};
}
