// Componentes de interface compartilhados pelas telas. Tudo aqui devolve HTML em texto.
import * as E from './engine.js?v=ddb9ffb608';
import {abilityKey} from './abilities.js?v=ddb9ffb608';

export const $ = selector=>document.querySelector(selector);
export const esc = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Whether a point of the page lies outside a box (a getBoundingClientRect). Used to tell a click on the dimmed page
// around a dialog from a click on an empty spot inside it.
export const outsideBox = (x,y,box)=>x<box.left||x>box.right||y<box.top||y>box.bottom;
export const num = (n,digits=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
export const signed = n=>(n>0?'+':n<0?'-':'')+num(Math.abs(n));
// An attribute as it is written. KAST is kept on the cards with four places and shown as a whole percentage; with
// `exact` it is written with two places, as it is compared in a confrontation, so that two players a hair apart
// don't read as level. The other attributes are already written with every place they have.
export const statText = (key,value,exact=false)=>key==='kast'?num(value*100,exact?2:0)+'%':key==='swing'?(value>0?'+':'')+num(value,1):key==='acs'?num(value):num(value,2);
export const statLabel = key=>E.STAT_NAMES[key]+(key==='mpr'?' ↓':'');
export const STAT_HELP = {acs:'Pontuação média de combate',kast:'Rounds com abate, assistência, sobrevivência ou troca',kpr:'Abates por round',mpr:'Mortes por round: menor é melhor',apr:'Assistências por round',swing:'Impacto médio nos rounds'};

// How much of the rest of the base a value beats, so a raw number can be read at a glance: 0 for the card that beats
// nobody (the worst of the base), 1 for the one that beats every other card (the best), and in between the exact part
// of the others it beats. Cards with the same value beat the same ones, and not each other.
let sorted=null;
export function useBase(players) {
  sorted=Object.fromEntries(Object.keys(E.STAT_NAMES).map(key=>[key,players.map(p=>p.stats[key]).sort((a,b)=>a-b)]));
}
export function percentile(key,value) {
  const list=sorted[key];
  // how many values are under this one, and how many are not over it
  let under=0,top=list.length;
  while(under<top){const mid=(under+top)>>1;if(list[mid]<value)under=mid+1;else top=mid;}
  let upTo=under;top=list.length;
  while(upTo<top){const mid=(upTo+top)>>1;if(list[mid]<=value)upTo=mid+1;else top=mid;}
  // in deaths per round the better card is the one with less
  const beaten=key==='mpr'?list.length-upTo:under;
  return list.length>1?beaten/(list.length-1):0;
}
const tier = p=>p>=.85?'elite':p>=.6?'good':p>=.35?'mid':'low';
// How a value ranks among the cards of the base, as a word the styles can colour: elite, good, mid or low.
export const tierOf = (key,value)=>tier(percentile(key,value));
// The bar under an attribute: as wide as the part of the other cards the card beats, with that part written in it.
// Only the best card of the base has a full bar and a 100, and only the worst an empty bar and a 0: nobody else is
// rounded into them. The number sits at the end of the filling: inside it from half the bar on, right after it before
// that, so the edge of the filling never runs through a digit.
export function meter(key,value) {
  const part=percentile(key,value),shown=part<=0?0:part>=1?100:Math.min(99,Math.max(1,Math.round(part*100))),wide=Math.round(part*1000)/10;
  const text=`Melhor que ${shown}% das cartas`;
  return `<span class="meter ${tier(part)} ${part>=.5?'in':'out'}" role="img" aria-label="${text}" data-tip="${text}" style="--v:${wide}%"><i></i><b>${shown}%</b></span>`;
}
export function stats(player,keys=Object.keys(E.STAT_NAMES)) {
  return `<dl class="stats">${keys.map(key=>`<div data-tip="${STAT_HELP[key]}"><dt>${statLabel(key)}</dt><dd>${statText(key,player.stats[key])}</dd>${meter(key,player.stats[key])}</div>`).join('')}</dl>`;
}

// ---------- Arte oficial (assets.json) ----------
// Ícones de agentes, símbolos de função, ícones de round, mapas, equipes (logo, estado, cores), fotos e marca.
// Tudo é opcional: o que faltar cai nos desenhos próprios abaixo, e o jogo continua funcionando.
let art={agents:{},abilities:{},roles:{},rounds:{},weapons:{},maps:[],teams:{},photos:{},brand:{}};
export function useArt(index) { art={...art,...index}; }
export const brandArt = key=>art.brand[key]||'';
export const teamInfo = name=>art.teams[name]||{};
export const mapFor = seed=>art.maps.length?art.maps[seed%art.maps.length]:null;
const picture = (file,name,size=96,alt='')=>`<img class="${name}" src="${esc(file)}" alt="${esc(alt)}" width="${size}" height="${size}" decoding="sync" draggable="false">`;
const shape = (file,name)=>`<i class="${name} shape" style="--shape:url(${esc(file)})" aria-hidden="true"></i>`;

const ROLE_KEY = {Duelista:'duel',Iniciador:'init',Controlador:'ctrl',Sentinela:'sent',Flex:'flex'};
const ROLE_PATH = {
  Duelista:'M8 1l2.2 6.2L15 8l-4.8 1L8 15l-2.2-6L1 8l4.8-.8z',
  Iniciador:'M8 2a6 6 0 100 12A6 6 0 008 2zm0 2.2a3.8 3.8 0 110 7.6 3.8 3.8 0 010-7.6zm0 2.2a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2z',
  Controlador:'M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.8v8.4a4.2 4.2 0 010-8.4z',
  Sentinela:'M8 1.5l5.5 2v4.2c0 3.2-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.6-5.5-6.8V3.5z',
  Flex:'M8 1.5L14.5 8 8 14.5 1.5 8z'
};
export const roleKey = role=>ROLE_KEY[role]||'flex';
export const roleIcon = role=>art.roles[role]?shape(art.roles[role],'role-icon')
  :`<svg class="role-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="${ROLE_PATH[role]||ROLE_PATH.Flex}"/></svg>`;
export const roundIcon = outcome=>art.rounds[outcome]?shape(art.rounds[outcome],'round-icon'):'';
// The icon of an ability, cut out of the colour of the text around it. Without the art it is an empty box of the same size.
export function abilityIcon(agent,name) {
  const file=art.abilities[abilityKey(agent,name)];
  return file?`<i class="shape" style="--shape:url('${esc(file)}')"></i>`:'<i class="shape blank"></i>';
}
export function agentIcon(agent) {
  const file=art.agents[agent.toLowerCase().replace(/[^a-z0-9]/g,'')];
  return file?picture(file,'agent-icon'):roleIcon(E.AGENTS[agent]);
}
export const roleTag = role=>`<span class="role role-${roleKey(role)}">${roleIcon(role)}${esc(role)}</span>`;

// ---------- Formações ----------
// O símbolo de cada formação, na linguagem dos símbolos de função do Valorant: uma peça cheia cortada por faixas retas,
// e é o vazio das faixas que desenha o sinal. A peça tem os cantos chanfrados das faixas do Univavá, e não o disco das
// funções, para que formação e função não se confundam lado a lado.
//   ponta       uma seta para cima: a ponta da lança
//   informacao  um olho: o losango no meio de uma linha
//   dominio     uma grade: o mapa dividido em setores
//   ancora      uma âncora
//   fortaleza   uma torre: duas ameias em cima e o portão embaixo
//   livre       só o contorno, tracejado, como as vagas vazias do elenco
// The drawings are 48 x 48. Each sign is a path stroked with the width of a band; it may run past the piece.
const FORMATION_PIECE = 'M11 1H37L47 11V37L37 47H11L1 37V11Z',FORMATION_BAND = 5.5;
const FORMATION_SIGNS = {
  ponta:'M-4 42.4 24 6 52 42.4M24 8V52',
  informacao:'M10 24 24 14 38 24 24 34ZM-4 24H10M38 24H52',
  dominio:'M17-4V52M31-4V52M-4 17H52M-4 31H52',
  ancora:'M24 8V40M14 15H34M9 25 24 40 39 25',
  fortaleza:'M17-4V19M31-4V19M12 52 24 31 36 52'
};
const formationDrawing = key=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${FORMATION_SIGNS[key]
  ?`<mask id="m"><path fill="#fff" d="${FORMATION_PIECE}"/><path fill="none" stroke="#000" stroke-width="${FORMATION_BAND}" stroke-miterlimit="8" d="${FORMATION_SIGNS[key]}"/></mask><rect width="48" height="48" mask="url(#m)"/>`
  :'<path fill="none" stroke="#000" stroke-width="5" stroke-dasharray="13 7.5" stroke-dashoffset="3" d="M12 3.5H36L44.5 12V36L36 44.5H12L3.5 36V12Z"/>'}</svg>`;
// Each drawing becomes a mask once (see .shape in the styles), so the symbol takes the colour of the text around it.
const FORMATION_SHAPES = Object.fromEntries([...Object.keys(FORMATION_SIGNS),'livre'].map(key=>[key,`url('data:image/svg+xml,${encodeURIComponent(formationDrawing(key))}')`]));
export const formationIcon = key=>`<i class="formation-icon shape" style="--shape:${FORMATION_SHAPES[key]||FORMATION_SHAPES.livre}" aria-hidden="true"></i>`;

// ---------- Conquistas ----------
// O símbolo de cada conquista, na mesma linguagem dos de formação: uma peça cheia de onde o sinal é recortado. A peça
// aqui é a de seis lados, a de um distintivo, para não se confundir com a das formações nem com o disco das funções.
// The drawings are 48 x 48. A sign is made of layers, in this order: `s`, a path stroked with the width of a band, and
// `f`, a shape, both cut out of the piece; `keep`, a shape, and `line`, a thin stroke, which put the piece back inside
// what was cut (the pad of a plaster, the facets of a stone); and `top`, a shape cut out in front of all the rest,
// with a rim of piece around it that sets it apart from what is behind.
const FEAT_PIECE = 'M24 1 45 13V35L24 47 3 35V13Z',FEAT_BAND = 4.4;
const FEAT_SIGNS = {
  // Campanha
  groups:{s:'M13 24.5 21 32.5 35.5 16'},                                          // classificado: o visto
  playoffs:{s:'M11 14H21V34H11M21 24H37'},                                        // a chave do mata-mata
  final:{s:'M11 14 20 24 11 34M37 14 28 24 37 34'},                               // dois que se encontram
  champion:{f:'M15 10H33V17C33 24 29.5 28 26.5 29V34H31V38H17V34H21.5V29C18.5 28 15 24 15 17Z',s:'M15 13H10.5V17Q10.5 21 15.5 22M33 13H37.5V17Q37.5 21 32.5 22'}, // a taça
  three:{f:'M9.1 12H19.9V16.2C19.9 20.4 17.8 22.8 16 23.4V26.4H18.7V28.8H10.3V26.4H13V23.4C11.2 22.8 9.1 20.4 9.1 16.2ZM38.9 12H28.1V16.2C28.1 20.4 30.2 22.8 32 23.4V26.4H29.3V28.8H37.7V26.4H35V23.4C36.8 22.8 38.9 20.4 38.9 16.2Z',
    top:'M17 18H31V23.5C31 28.9 28.3 32 26 32.8V36.7H29.5V39.8H18.5V36.7H22V32.8C19.7 32 17 28.9 17 23.5Z'}, // três taças: uma na frente, duas atrás
  unbeaten:{s:'M24 11A13 13 0 1 0 24 37A13 13 0 1 0 24 11Z',f:'M24 18 30 24 24 30 18 24Z'}, // o anel inteiro
  wire:{f:'M22 8C22 8 11.5 21.5 11.5 29C11.5 34.8 16.2 39.5 22 39.5C27.8 39.5 32.5 34.8 32.5 29C32.5 21.5 22 8 22 8ZM37 10.5C37 10.5 33 15.8 33 18.8C33 21 34.8 22.8 37 22.8C39.2 22.8 41 21 41 18.8C41 15.8 37 10.5 37 10.5Z',
    line:'M16.5 29.5C16.5 32.4 18.3 34.6 21 35.2'},                                 // as gotas de suor
  daily:{f:'M24 17.5A6.5 6.5 0 1 0 24 30.5A6.5 6.5 0 1 0 24 17.5Z',s:'M24 7V12.5M24 35.5V41M7 24H12.5M35.5 24H41M12 12 15.9 15.9M32.1 32.1 36 36M36 12 32.1 15.9M15.9 32.1 12 36'}, // o sol
  regular:{s:'M13 15H35V36H13ZM13 22.5H35M18.5 10.5V17M29.5 10.5V17'},                    // o calendário
  passed:{f:'M32 10 38 16 22 32 12.5 35.5 16 26Z',line:'M28 14 34 20M16 26 22 32'},     // o lápis
  graduate:{f:'M24 12 40 19.5 24 27 8 19.5ZM14.5 25.2 24 29.6 33.5 25.2V32C33.5 34.8 29.2 37 24 37C18.8 37 14.5 34.8 14.5 32Z',s:'M38 19.5V31'}, // o capelo
  soclose:{f:'M15.5 9.5H21.5L25.5 17.5H19.5ZM32.5 9.5H26.5L22.5 17.5H28.5ZM13.5 28a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0Z',line:'M20.6 25.4C20.6 22.9 22.1 21.6 24 21.6C25.9 21.6 27.4 22.9 27.4 24.8C27.4 26.5 26.2 27.7 24.7 29.2L20.8 33.1H27.8'}, // a medalha de prata
  popcorn:{f:'M14.5 21H33.5L31 38.5H17ZM13.9 17a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM19 13.6a5 5 0 1 0 10 0a5 5 0 1 0 -10 0ZM24.9 17a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0Z',line:'M20.6 23.5 21.4 36.5M27.4 23.5 26.6 36.5'}, // o balde de pipoca
  lion:{f:'M24 24C29.5 24 34 29 34 33.3C34 36.8 31 38.3 28.5 37.3C26.5 36.5 25.5 35.8 24 35.8C22.5 35.8 21.5 36.5 19.5 37.3C17 38.3 14 36.8 14 33.3C14 29 18.5 24 24 24ZM10.2 22.6a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0ZM16.2 15.6a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0ZM24.8 15.6a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0ZM31 22.6a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0Z'}, // a pata do leão
  // Partida
  house:{s:'M16 14H32A2 2 0 0 1 34 16V32A2 2 0 0 1 32 34H16A2 2 0 0 1 14 32V16A2 2 0 0 1 16 14Z',f:'M17.5 19.4a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM26.7 19.4a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM22.1 24a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM17.5 28.6a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM26.7 28.6a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0Z'}, // o dado
  collective:{f:'M10.9 17.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0ZM29.9 17.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0ZM8.5 33C8.5 27.5 11 24 14.5 24C18 24 20.5 27.5 20.5 33ZM27.5 33C27.5 27.5 30 24 33.5 24C37 24 39.5 27.5 39.5 33Z',
    top:'M19.4 16.5a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM15.5 37.5C15.5 29.5 19 25 24 25C29 25 32.5 29.5 32.5 37.5Z'}, // o grupo
  sweep:{f:'M28 6 11 27H22L19 42 37 20H26Z'},                                     // o raio
  swept:{s:'M9 14 19 24 26 18 38 33M38 23V33H28'},                                // a queda
  overtime:{s:'M24 11A13 13 0 1 0 24 37A13 13 0 1 0 24 11ZM24 17V24.5L29.5 29'},  // o relógio
  comeback:{s:'M13 12V25A8.5 8.5 0 0 0 30 25V13M23 19 30 11.5 37 19'},            // a volta por cima
  streak:{f:'M25 6C27 14 36 19 36 29C36 36 31 41 24 41C17 41 12 36 12 29C12 24 15 21 17 16C18 21 21 23 22 19C23 15 24 10 25 6Z'}, // a chama
  upset:{s:'M11 22 22 11M11 33 33 11M15 39 37 17M26 39 37 28'},                       // as listras da zebra
  carry:{f:'M21.9 36 36 21.9A7 7 0 0 0 26.1 12L12 26.1A7 7 0 0 0 21.9 36Z',
    keep:'M30.8 24.6 23.4 17.2 17.2 23.4 24.6 30.8ZM31.3 19.2a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM27.5 15.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM17.9 32.6a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM14.1 28.8a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z'}, // o curativo
  ace:{f:'M24 7C30 15 38 21 38 28.5C38 33 34.5 36 30.5 36C28.5 36 26.8 35.2 25.6 33.8L27.5 41H20.5L22.4 33.8C21.2 35.2 19.5 36 17.5 36C13.5 36 10 33 10 28.5C10 21 18 15 24 7Z'}, // o ás de espadas
  eco:{s:'M24 15A9 9 0 1 0 24 33A9 9 0 1 0 24 15ZM11 11 17.6 17.6M37 11 30.4 17.6M11 37 17.6 30.4M37 37 30.4 30.4'}, // o sinal dos créditos
  // Jogada de Efeito
  hot:{f:'M15 24V13.3A1.8 1.8 0 0 1 18.6 13.3V24ZM19.8 24V11.3A1.8 1.8 0 0 1 23.4 11.3V24ZM24.6 24V12.8A1.8 1.8 0 0 1 28.2 12.8V24ZM29.4 24V16.3A1.8 1.8 0 0 1 33 16.3V24ZM15 23H33V34A5 5 0 0 1 28 39H20A5 5 0 0 1 15 34ZM15.4 34 9.3 27.6A2.3 2.3 0 0 1 12.6 24.4L15.4 27.3Z',
    keep:'M24.3 24.2C25.3 27.2 28.6 28.7 28.6 32.3C28.6 35 26.6 37 24 37C21.4 37 19.4 35 19.4 32.3C19.4 30.5 20.6 29.3 21.3 27.6C21.8 29.4 22.9 29.9 23.3 28.5C23.7 27 24 25.6 24.3 24.2Z'}, // a mão com fogo
  detail:{s:'M21 11A9.5 9.5 0 1 0 21 30A9.5 9.5 0 1 0 21 11ZM28 27.5 38 37.5'},   // a lupa
  trust:{f:'M12.4 14.1a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM23.2 14.1a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM12.4 24.9a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM23.2 24.9a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM21 19.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z',s:'M24 25Q24 34 29.5 39.5'}, // o trevo de quatro folhas
  prevent:{f:'M9.5 25A14.5 14.5 0 0 1 38.5 25Q36.1 22.4 33.7 25Q31.2 22.4 28.8 25Q26.4 22.4 24 25Q21.6 22.4 19.2 25Q16.8 22.4 14.3 25Q11.9 22.4 9.5 25Z',s:'M24 24.5V35A3.4 3.4 0 0 1 17.2 35'}, // o guarda-chuva
  sure:{f:'M14 21H34V35.5A2 2 0 0 1 32 37.5H16A2 2 0 0 1 14 35.5Z',s:'M17.8 21.5V17.2A6.2 6.2 0 0 1 30.2 17.2V21.5',keep:'M21.7 27.6a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0 -4.6 0ZM22.9 28H25.1V33H22.9Z'}, // o cadeado
  coward:{s:'M15 11.5V37.5',f:'M17.2 12.5C21.5 10.3 25.5 14.6 30 13.2C32 12.6 34 11.9 35.5 11.5V25C34 25.5 32 26.2 30 26.8C25.5 28.2 21.5 23.8 17.2 26Z'}, // a bandeira branca
  coin:{f:'M16.8 14.3a7.2 7.2 0 1 0 14.4 0a7.2 7.2 0 1 0 -14.4 0ZM7.8 30.2a7.2 7.2 0 1 0 14.4 0a7.2 7.2 0 1 0 -14.4 0ZM25.8 30.2a7.2 7.2 0 1 0 14.4 0a7.2 7.2 0 1 0 -14.4 0Z',keep:'M24 11 27.3 14.3 24 17.6 20.7 14.3ZM15 26.9 18.3 30.2 15 33.5 11.7 30.2ZM33 26.9 36.3 30.2 33 33.5 29.7 30.2Z'}, // três moedas iguais
  // Elenco
  refund:{f:'M15 9.5H33V38L30 35.5 27 38 24 35.5 21 38 18 35.5 15 38Z',line:'M19 16H29M19 21.5H29M19 27H25'}, // o recibo
  home:{s:'M9 25 24 11 39 25M14.5 21.5V37H33.5V21.5'},                            // a casa
  mains:{s:'M24 40 15.3 26.6A11 11 0 1 1 32.7 26.6Z',f:'M24 16.4A3.6 3.6 0 1 0 24 23.6A3.6 3.6 0 1 0 24 16.4Z'}, // cada um no seu lugar
  selecao:{f:'M24 7 29 18.6 41.6 19.7 32 28 34.9 40.3 24 33.8 13.1 40.3 16 28 6.4 19.7 19 18.6Z'}, // a estrela
  best:{f:'M11 32 9.5 15 18 22.5 24 10 30 22.5 38.5 15 37 32ZM13 35H35V38.5H13Z'},        // a coroa
  strategist:{s:'M24 9 38.3 19.4 32.8 36.2H15.2L9.7 19.4Z',f:'M24 20.4A3.6 3.6 0 1 0 24 27.6A3.6 3.6 0 1 0 24 20.4Z'}, // as cinco formações
  find:{f:'M15 10H33L40 19 24 40 8 19Z',line:'M8.5 19H39.5M15 10.5 19.5 19 24 10.5 28.5 19 33 10.5M19.5 19 24 39 28.5 19'}, // o diamante
  vault:{s:'M31.5 17C31.5 13.8 28.3 12 24 12C19.7 12 16.5 14 16.5 17.6C16.5 21.3 19.8 22.7 24 23.7C28.2 24.7 31.5 26.2 31.5 30C31.5 33.6 28.3 35.8 24 35.8C19.7 35.8 16.5 33.9 16.5 30.6M24 7.5V40.5'}, // o cifrão
  // Álbum
  album50:{s:'M16 11H32V37H16Z',f:'M24 19 29 24 24 29 19 24Z'},                    // uma carta
  album150:{s:'M13 17H27V36H13ZM19 17V11H35V32H27'},                               // cartas empilhadas
  albumAll:{s:'M24 15V38M24 15C20.5 12 14.5 12 11 13.5V34.5C14.5 33 20.5 33 24 38M24 15C27.5 12 33.5 12 37 13.5V34.5C33.5 33 27.5 33 24 38'}, // o álbum aberto
  team:{f:'M17 8C18.5 11.5 21 13 24 13C27 13 29.5 11.5 31 8L41 14 36.5 22.5 33 20.5V40H15V20.5L11.5 22.5 7 14Z'} // a camisa
};
const featDrawing = sign=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="m"><path fill="#fff" d="${FEAT_PIECE}"/>${
  sign?.s?`<path fill="none" stroke="#000" stroke-width="${FEAT_BAND}" stroke-miterlimit="8" d="${sign.s}"/>`:''}${sign?.f?`<path fill="#000" d="${sign.f}"/>`:''}${
  sign?.keep?`<path fill="#fff" stroke="none" d="${sign.keep}"/>`:''}${sign?.line?`<path fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" d="${sign.line}"/>`:''}${
  sign?.top?`<path fill="#fff" stroke="#fff" stroke-width="3.6" stroke-linejoin="round" d="${sign.top}"/><path fill="#000" d="${sign.top}"/>`:''}</mask><rect width="48" height="48" mask="url(#m)"/></svg>`;
const FEAT_SHAPES = Object.fromEntries(Object.entries(FEAT_SIGNS).map(([id,sign])=>[id,`url('data:image/svg+xml,${encodeURIComponent(featDrawing(sign))}')`]));
const FEAT_BLANK = `url('data:image/svg+xml,${encodeURIComponent(featDrawing(null))}')`;
export const achievementIcon = id=>`<i class="feat-icon shape" style="--shape:${FEAT_SHAPES[id]||FEAT_BLANK}" aria-hidden="true"></i>`;
export const agentChip = (agent,note='')=>`<span class="agent role-${roleKey(E.AGENTS[agent])}">${agentIcon(agent)}<b>${esc(agent)}</b>${note}</span>`;
export const coin = n=>`<span class="coin"><i aria-hidden="true"></i>${num(n)}<span class="sr-only"> moedas</span></span>`;
const luminance = hex=>{const n=parseInt(hex.slice(1),16);return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255;};
// Screens are rebuilt on every action, so cards decode synchronously: a cached card must not blink.
// With `effective`, the overall printed on the card is replaced by the effective one: green when higher, red when lower.
export function cardArt(player,{eager=false,effective=player.ovr}={}) {
  const changed=effective!==player.ovr,tone=player.tone||'#222222';
  return `<span class="card" style="--tone:${tone}"><img src="${player.image}" alt="Carta de ${esc(player.name)}: overall ${changed?`efetivo ${effective}, na carta `:''}${player.ovr}, ${esc(player.role)}, ${esc(player.team)}" width="450" height="720" ${eager?'fetchpriority="high"':''} decoding="sync" draggable="false">${
    changed?`<b class="card-ovr ${effective>player.ovr?'up':'down'} ${luminance(tone)>.6?'light':''}" aria-hidden="true">${effective}</b>`:''}</span>`;
}

// ---------- Equipes ----------
// The team's own colour when it can be seen on a dark tray; otherwise a stable colour derived from the name.
export function teamColor(name) {
  const visible=(teamInfo(name).colors||[]).filter(c=>luminance(c)>.22).sort((a,b)=>luminance(b)-luminance(a))[0];
  if(visible)return visible;
  let hue=0;for(const c of name)hue=(hue*31+c.charCodeAt(0))%360;return `hsl(${hue} 80% 66%)`;
}
export function teamLogo(name) {
  const logo=teamInfo(name).logo;
  return logo?picture(logo,'logo',160):`<i class="logo-dot" style="--team:${teamColor(name)}" aria-hidden="true"></i>`;
}
export function teamFlag(name) {
  const t=teamInfo(name);
  return t.flag?`<img class="flag" src="${esc(t.flag)}" alt="${esc(t.stateName||t.state)}" data-tip="${esc(t.stateName||t.state)}" width="48" height="32" decoding="sync">`:'';
}
export const teamMark = name=>`<span class="team">${teamLogo(name)}<span>${esc(name)}</span>${teamFlag(name)}</span>`;

// ---------- Jogadores ----------
export const hasPhoto = id=>!!art.photos[id];
export const cutout = (player,name='cutout')=>art.photos[player.id]?picture(art.photos[player.id],name,280,`Foto de ${player.name}`):'';
// Scoreboard portrait: the player's photo, or the silhouette for players without one.
export function mug(id) {
  const photo=art.photos[id]||art.brand.silhouette;
  return `<span class="mug ${art.photos[id]?'':'blank'}">${photo?picture(photo,'mug-photo',280):''}</span>`;
}
// A weapon by its icon when the art has one, by name otherwise. With `shield` (even an empty one) the shield bought
// for the round is drawn next to it: empty outline, half or full.
export function weapon(name,{label=true,shield}={}) {
  const file=art.weapons[name],armor=shield===undefined?'':shield?`Colete ${shield.toLowerCase()}`:'Sem colete';
  return `<span class="weapon" data-tip="${esc(name)}${armor?' · '+armor:''}">${file?`<img class="weapon-icon" src="${esc(file)}" alt="${esc(name)}" decoding="sync" draggable="false">`:''}${label||!file?`<small>${esc(name)}</small>`:''}${
    armor?`<i class="shield ${shield?'shield-'+shield.toLowerCase():'none'}" role="img" aria-label="${armor}"></i>`:''}</span>`;
}
// The lime strip that runs along the top of every Univavá banner.
export const ticker = ()=>`<div class="ticker" aria-hidden="true"><span>${'2026 · UNIVAVÁ · '.repeat(48)}</span></div>`;
