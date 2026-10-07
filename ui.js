// Componentes de interface compartilhados pelas telas. Tudo aqui devolve HTML em texto.
import * as E from './engine.js?v=302cec329d';

export const $ = selector=>document.querySelector(selector);
export const esc = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Whether a point of the page lies outside a box (a getBoundingClientRect). Used to tell a click on the dimmed page
// around a dialog from a click on an empty spot inside it.
export const outsideBox = (x,y,box)=>x<box.left||x>box.right||y<box.top||y>box.bottom;
export const num = (n,digits=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
export const signed = n=>(n>0?'+':n<0?'-':'')+num(Math.abs(n));
export const statText = (key,value)=>key==='kast'?num(value*100)+'%':key==='swing'?(value>0?'+':'')+num(value,1):key==='acs'?num(value):num(value,2);
export const statLabel = key=>E.STAT_NAMES[key]+(key==='mpr'?' ↓':'');
export const STAT_HELP = {acs:'Pontuação média de combate',kast:'Rounds com abate, assistência, sobrevivência ou troca',kpr:'Abates por round',mpr:'Mortes por round: menor é melhor',apr:'Assistências por round',swing:'Impacto médio nos rounds'};

// Where a value sits among the cards of the base (0 = worst, 1 = best), so a raw number can be read at a glance.
let sorted=null;
export function useBase(players) {
  sorted=Object.fromEntries(Object.keys(E.STAT_NAMES).map(key=>[key,players.map(p=>p.stats[key]).sort((a,b)=>a-b)]));
}
export function percentile(key,value) {
  const list=sorted[key];let lo=0,hi=list.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(list[mid]<value)lo=mid+1;else hi=mid;}
  const below=lo/list.length;return key==='mpr'?1-below:below;
}
const tier = p=>p>=.85?'elite':p>=.6?'good':p>=.35?'mid':'low';
// How a value ranks among the cards of the base, as a word the styles can colour: elite, good, mid or low.
export const tierOf = (key,value)=>tier(percentile(key,value));
export function meter(key,value) {
  const p=percentile(key,value);
  const text=`Melhor que ${num(p*100)}% das cartas`;
  return `<span class="meter ${tier(p)}" role="img" aria-label="${text}" data-tip="${text}"><i style="width:${Math.max(6,Math.round(p*100))}%"></i></span>`;
}
export function stats(player,keys=Object.keys(E.STAT_NAMES)) {
  return `<dl class="stats">${keys.map(key=>`<div data-tip="${STAT_HELP[key]}"><dt>${statLabel(key)}</dt><dd>${statText(key,player.stats[key])}</dd>${meter(key,player.stats[key])}</div>`).join('')}</dl>`;
}

// ---------- Arte oficial (assets.json) ----------
// Ícones de agentes, símbolos de função, ícones de round, mapas, equipes (logo, estado, cores), fotos e marca.
// Tudo é opcional: o que faltar cai nos desenhos próprios abaixo, e o jogo continua funcionando.
let art={agents:{},roles:{},rounds:{},weapons:{},maps:[],teams:{},photos:{},brand:{}};
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
