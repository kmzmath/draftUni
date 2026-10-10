// Estado, ações e ciclo de renderização. As regras ficam em engine.js e campaign.js; as telas, em screens.js.
import * as E from './engine.js?v=ddb9ffb608';
import * as C from './campaign.js?v=ddb9ffb608';
import * as S from './screens.js?v=ddb9ffb608';
import {$,esc,useBase,useArt,num,outsideBox} from './ui.js?v=ddb9ffb608';
import {startTour,closeTour,tourOpen} from './tour.js?v=ddb9ffb608';
import {PACE,FREEZE_DEFAULT,cleanFreeze,savedFreezeAuto,beforeRound,playbackBeat,freezeClock,openingKills} from './pace.js?v=ddb9ffb608';
import {stamp,cleanAlbum} from './album.js?v=ddb9ffb608';
import {initTips,refreshTips} from './tip.js?v=ddb9ffb608';
import {shareModel,copyShareImage} from './share.js?v=ddb9ffb608';
import {staleSave,stampSave} from './save.js?v=ddb9ffb608';
import * as A from './achievements.js?v=ddb9ffb608';
import * as ST from './stats.js?v=ddb9ffb608';
import {runningBuild,readBuild,buildAddress,cleanAddress,shouldSwitch,VERSION_FILE,ASK_EVERY} from './version.js?v=ddb9ffb608';
import {playChime} from './sound.js?v=ddb9ffb608';

const RUN_KEY='univava:run',DAILY_KEY='univava:daily',CAREER_KEY='univava:career',PREFS_KEY='univava:prefs',ALBUM_KEY='univava:album',FEATS_KEY='univava:feats',STATS_KEY='univava:stats',RIVALS_KEY='univava:rivals';
const KEYS={free:RUN_KEY,daily:DAILY_KEY},NOTICE_KEY='univava:notice',SWITCH_KEY='univava:build',PLACE_KEY='univava:place';
// Two runs can be under way at once, each in its own slot: the traditional one, started whenever the player wants, and
// the Desafio do dia. ctx.run is the one on screen (ctx.slots[ctx.mode]). ctx.today is the day of today's challenge.
// career.daily remembers the result of each challenge already played; career.period and career.cleared, the períodos
// of the traditional mode already open and already won (see periodsOf in campaign.js); ctx.album, every card already
// fielded; ctx.feats, the conquests already won; ctx.stats, what every match and every run added to the statistics of
// the career (see stats.js). ui.opened is the período the run on screen has just opened.
const ctx={db:null,run:null,mode:'free',slots:{free:null,daily:null},today:'',album:{},feats:A.cleanFeats(null),stats:null,match:null,summary:null,screen:'home',showcase:[],team:'',prefs:null,
  career:{runs:0,titles:0,best:'',bestRank:-1,daily:{},period:0,cleared:0},
  ui:{tab:'lineup',selected:null,paused:false,speed:1,showEvent:false,play:null,duel:null,freeze:null,settings:false,sort:null,albumFilter:'all',careerTab:'run',opened:0}};
// What the player chose to keep between visits: the team's name, match speed, how the freezetime before each round
// works (automatic or on a click, and for how many seconds), which screens the tutorial already explained and the
// período chosen for the last run.
const prefs=ctx.prefs={team:'',speed:1,freezeAuto:false,freezeSet:false,freeze:FREEZE_DEFAULT,seen:{},period:null};
let timer=null,duelTimer=null,clockTimer=null,shownKey='',toastTimer=null,packShown=0;

// Storage can be unavailable (private mode, blocked site data): the game then simply doesn't remember.
function load(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* plays without saving */}}
// The game may be open in more than one tab, all on the same saved data. A tab whose run is behind the saved one
// (another tab played on) must not write over it: that would undo a pack already opened or a match already lost.
// It starts over from what is saved instead, and says so once it is back.
const behind = mode=>staleSave(load(KEYS[mode]),ctx.slots[mode]);
function resync(){
  try{sessionStorage.setItem(NOTICE_KEY,'1');}catch{/* reloads without the notice */}
  location.reload();
}

// ---------- Sempre na versão publicada ----------
// The published site says which build is published (version.json); this code knows the build it belongs to (BUILD,
// null on the local server, where nothing is asked). The game asks when it opens, when the player comes back to the
// tab, when the screen changes and every few minutes, and moves to a newer build by loading its address. It doesn't
// move in the middle of a match or of its result, with a dialog open or during a tutorial: it waits for that to be
// over (see render). Before moving it writes down where the player is, and the new page opens there (see init).
const BUILD=runningBuild(import.meta.url);
let askedAt=0,nextBuild=null;
const settled = ()=>!['match','postmatch'].includes(ctx.screen)&&!$('#dialog')?.open&&!tourOpen();
async function checkBuild(){
  if(!BUILD||nextBuild||Date.now()-askedAt<ASK_EVERY)return;
  askedAt=Date.now();
  let published=null,tried=null;
  try{const response=await fetch(`${VERSION_FILE}?t=${askedAt}`,{cache:'no-store'});if(response.ok)published=readBuild(await response.json());}catch{/* no connection: the game stays as it is */}
  try{tried=JSON.parse(sessionStorage.getItem(SWITCH_KEY)||'null');}catch{/* no memory of an earlier move */}
  if(!shouldSwitch({running:BUILD,published,tried,now:Date.now()}))return;
  nextBuild=published;
  if(settled())switchBuild();
}
function switchBuild(){
  const build=nextBuild;
  try{
    sessionStorage.setItem(SWITCH_KEY,JSON.stringify({build,at:Date.now()}));
    sessionStorage.setItem(PLACE_KEY,JSON.stringify({screen:ctx.screen,mode:ctx.mode,tab:ctx.ui.tab,careerTab:ctx.ui.careerTab,albumFilter:ctx.ui.albumFilter}));
  }catch{/* it moves all the same, and opens on the first screen */}
  location.replace(buildAddress(location.href,build));
}
// Where the player was before the move to a newer build: the same screen of the same run, or the album, the
// conquests or the statistics.
function backToPlace({screen,mode,tab,careerTab,albumFilter}={}){
  if(['album','feats','career'].includes(screen)){
    ctx.screen=screen;
    if(typeof careerTab==='string')ctx.ui.careerTab=careerTab;
    if(typeof albumFilter==='string')ctx.ui.albumFilter=albumFilter;
    return;
  }
  if(!screen||screen==='home'||!['free','daily'].includes(mode)||!ctx.slots[mode])return;
  resume(mode);
  if(ctx.screen==='hub'&&['lineup','shop','stats'].includes(tab))ctx.ui.tab=tab;
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkBuild();});
addEventListener('pageshow',event=>{if(event.persisted)checkBuild();});
addEventListener('focus',checkBuild);
setInterval(checkBuild,5*ASK_EVERY);

// What the run of each mode looked like the last time it was read or written. A run is only saved when it has
// changed: a click that changes nothing (a tab, a card selected) writes nothing, and so doesn't send the other
// tabs back to the start for no reason.
const written={free:'',daily:''};
const content = run=>JSON.stringify({...run,rev:0});
// Saves the run of a mode in its own slot, one revision further on. False when this tab was behind and nothing was written.
function saveSlot(mode){
  const run=ctx.slots[mode];
  if(!run)return true;
  if(behind(mode)){resync();return false;}
  const now=content(run);
  if(now!==written[mode]){store(KEYS[mode],stampSave(run));written[mode]=now;}
  return true;
}
// Saves the run on screen.
const saveRun = ()=>!ctx.run||saveSlot(ctx.mode);
// Puts the run of a mode on screen.
function activate(mode){ctx.mode=mode;ctx.run=ctx.slots[mode];ctx.match=null;ctx.summary=null;}
function announce(message){$('#announcer').textContent=message;}
function toast(message){
  const el=$('#toast');el.textContent=message;el.classList.add('on');announce(message);
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('on'),3200);
}

// ---------- Conquistas ----------
// A conquest that has just come out is shown in a banner at the top of the screen, one at a time when several come
// together, and said once to who listens to the screen instead of looking at it.
const featQueue=[];let featTimer=null;
function nextFeat(){
  const el=$('#feat'),id=featQueue.shift();
  featTimer=null;
  if(!id){el.classList.remove('on');return;}
  el.innerHTML=S.featBanner(id);
  // the banner comes in again for each one, with its sound
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  playChime();
  featTimer=setTimeout(nextFeat,featQueue.length?2400:3600);
}
function celebrate(ids){
  featQueue.push(...ids);
  announce(`${ids.length>1?'Conquistas':'Conquista'}: ${ids.map(id=>A.BY_ID[id].name).join(', ')}.`);
  if(!featTimer)nextFeat();
}
// Marks what a moment brought (`ids`) together with whatever the game as it stands proves by now (the lineup, the
// coins, the history, the album), saves it and shows what is new. Gives back the new ones.
function earn(ids=[]){
  const fresh=A.award(ctx.feats,[...ids,...A.fromState(ctx)],C.dayKey());
  if(fresh.length){store(FEATS_KEY,ctx.feats);celebrate(fresh);}
  return fresh;
}

// ---------- Renderização ----------
function entryKey(){
  const {screen,run,ui,match}=ctx;
  if(screen==='draft')return 'draft:'+run.draft.picked.length;
  if(screen==='hub')return 'hub:'+ui.tab;
  if(screen==='match')return 'match:'+(ui.duel?'result':match.pending&&ui.showEvent&&!ui.play?'moment':'board');
  return screen;
}
function render(){
  const app=$('#app'),focused=document.activeElement?.dataset,key=entryKey(),changed=key!==shownKey;
  const selector=focused?.action&&!$('#dialog').open?`[data-action="${focused.action}"]${focused.id?`[data-id="${CSS.escape(focused.id)}"]`:''}`:null;
  // Scoreboard rows remember where they were, so a change of order can be animated (first, last, invert, play).
  const before=new Map([...app.querySelectorAll('[data-flip]')].map(el=>[el.dataset.flip,el.getBoundingClientRect().top]));
  app.innerHTML=S.chrome(ctx,S[ctx.screen](ctx));
  // Entrance animations only play when the view actually changes, not on every re-render of the same view.
  app.classList.toggle('enter',changed);
  // A newer build that was waiting for a good moment takes it; and a change of screen is a moment to ask for one.
  if(nextBuild&&settled()){switchBuild();return;}
  if(changed)checkBuild();
  if(changed){
    if(key.split(':')[0]!==shownKey.split(':')[0])window.scrollTo(0,0);
    shownKey=key;
    // The confrontation opens over the scoreboard. If part of it is off the screen, the page glides to it instead of
    // jumping: just enough to show it all, or to its top when it is taller than the screen.
    const layer=ctx.screen==='match'&&key!=='match:board'&&$('.play-layer');
    if(layer)layer.scrollIntoView({block:layer.offsetHeight>innerHeight-110?'start':'nearest',behavior:'smooth'});
  }else{
    for(const row of app.querySelectorAll('[data-flip]')){
      const from=before.get(row.dataset.flip),moved=from===undefined?0:from-row.getBoundingClientRect().top;
      if(!moved)continue;
      row.classList.add(moved>0?'rose':'sank');
      row.animate([{transform:`translateY(${moved}px)`},{transform:'none'}],{duration:560,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  }
  // A confrontation grows as its rows come in. On a screen where it has little room, its end can slip under the
  // controls held to the bottom: the page then follows it, by just what is missing.
  const open=!changed&&ctx.screen==='match'&&$('.play-layer'),bar=open&&$('.controls');
  if(bar&&getComputedStyle(bar).position==='sticky'&&open.getBoundingClientRect().bottom>bar.getBoundingClientRect().top)open.scrollIntoView({block:'nearest',behavior:'auto'});
  if(selector)app.querySelector(selector)?.focus({preventScroll:true});
  runClock();
  refreshTips();
  if(changed)openTour(key,true);
}
// The freezetime clock on screen: its text follows the countdown between two renders, and each new second makes the
// number jump. It stops by itself when the freezetime it was counting is over or the clock is no longer on screen.
function runClock(){
  clearInterval(clockTimer);clockTimer=null;
  const freeze=ctx.ui.freeze;
  if(ctx.screen!=='match'||!freeze||freeze.manual)return;
  clockTimer=setInterval(()=>{
    const el=$('#freeze-clock');
    if(!el||ctx.ui.freeze!==freeze){clearInterval(clockTimer);clockTimer=null;return;}
    const text=freezeClock(Date.now()-freeze.start,freeze.total);
    if(el.textContent===text)return;
    el.textContent=text;el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick');
  },80);
}
// The tutorial of each screen opens by itself the first time; the Ajuda button opens it again on demand.
const tourName = key=>key.startsWith('draft')?'draft':key==='match:result'?null:key;
function openTour(key,auto){
  // The first período a title opens is explained on the spot, whatever the tutorial already showed of the end screen.
  const name=auto&&key==='end'&&ctx.ui.opened&&!prefs.seen.periods?'periods':tourName(key);
  if(!name||$('#dialog').open||(auto&&prefs.seen[name]))return;
  // By itself the tutorial is the short one; asked for through Ajuda, it is the whole one. "Pular Tutorial" closes
  // the one on screen and nothing else: a screen is marked as seen when its tutorial opens, so this one doesn't come
  // back by itself, and the tutorials of the screens still to come open on the first visit to each.
  const started=startTour(name,{brief:auto,onClose(){schedule();render();}});
  if(started&&!prefs.seen[name]){prefs.seen[name]=true;store(PREFS_KEY,prefs);}
  // A match stands still while its tutorial is open (see schedule).
  if(started&&ctx.screen==='match'){schedule();render();}
}
function openDialog(html,{locked=false,kind=''}={}){
  const dialog=$('#dialog'),redraw=dialog.open;
  // Where the keyboard is, when the dialog is redrawing itself: the same control gets the focus back.
  const {action,id,agent}=redraw&&dialog.contains(document.activeElement)?document.activeElement.dataset:{};
  // A dialog that redraws itself (picking an agent to preview) stays where the player had scrolled it: the dialog
  // itself and any list inside it marked with data-scroll.
  const kept=dialog.open?[dialog.scrollTop,...[...dialog.querySelectorAll('[data-scroll]')].map(el=>[el.dataset.scroll,el.scrollTop])]:null;
  dialog.className=kind;dialog.innerHTML=html;dialog.dataset.locked=locked?'1':'';
  if(!redraw)dialog.showModal();
  if(kept){
    const [top,...lists]=kept;dialog.scrollTop=top;
    for(const [name,value] of lists){const el=dialog.querySelector(`[data-scroll="${name}"]`);if(el)el.scrollTop=value;}
  }
  // A dialog opens with the keyboard on the button it marks (autofocus), so Enter does what the dialog is there for
  // instead of landing on the ✕ and closing it.
  const same=action?`[data-action="${action}"]${id?`[data-id="${CSS.escape(id)}"]`:''}${agent?`[data-agent="${CSS.escape(agent)}"]`:''}`:null;
  (redraw?same&&dialog.querySelector(same):dialog.querySelector('[autofocus]:not(:disabled)'))?.focus({preventScroll:redraw});
  refreshTips();
}
function closeDialog(){const dialog=$('#dialog');if(dialog.open)dialog.close();refreshTips();}
// The pack on the table: the reveal of its best card, then the choice. The reveal covers the whole dialog and a click
// on it skips it, so the moment it opened is kept: a click that comes right on the heels of the one that opened the
// pack (the second of a double click, a key held down) is the same gesture, not a wish to skip.
const SKIP_AFTER=600;
function showPack(){packShown=Date.now();openDialog(S.packDialog(ctx),{locked:true,kind:'wide'});}

// ---------- Run ----------
function route(){
  const run=ctx.run;
  ctx.screen=!run?'home':run.status==='over'?'end':run.status;
  ctx.ui.selected=null;
  // A match that was under way comes back exactly where it was: same rounds, same choices already made.
  if(run?.live&&run.status==='hub'){
    try{enterMatch();}catch{run.live=null;}
  }
}
function enterMatch(){
  ctx.match=C.beginMatch(ctx.run,ctx.db);ctx.screen='match';
  clearTimeout(duelTimer);
  Object.assign(ctx.ui,{paused:false,showEvent:false,play:null,duel:null,selected:null,freeze:null,settings:false});
  schedule();
}
function recordCareer(run){
  const last=run.history.at(-1),champion=run.result==='champion';
  const rank=champion?100:run.stage*10+run.record[run.stage].w;
  // A title in the traditional mode opens the next período, and the next run opens on it.
  const {opened,...periods}=C.periodsAfter(ctx.career,run);
  Object.assign(ctx.career,periods);
  if(opened){ctx.ui.opened=opened;prefs.period=opened;store(PREFS_KEY,prefs);}
  ctx.career.runs++;if(champion)ctx.career.titles++;
  // Where the run ended and the bonuses it held go into the statistics.
  ST.recordRun(ctx.stats,run);store(STATS_KEY,ctx.stats);
  if(rank>ctx.career.bestRank){ctx.career.bestRank=rank;ctx.career.best=champion?'Campeão':run.stage===2&&last?last.label:C.STAGES[run.stage].name;}
  // A finished Desafio do dia leaves its result behind, with the text to share, for the last two months of days.
  if(run.daily){
    const log={...ctx.career.daily,[run.daily]:{line:C.resultLine(run),share:C.shareText(run,ctx.team)}};
    ctx.career.daily=Object.fromEntries(Object.entries(log).sort(([a],[b])=>a.localeCompare(b)).slice(-60));
  }
  store(CAREER_KEY,ctx.career);
}
// A new run of the traditional mode, with a seed of its own, on a período the player has open (0 for none). The one
// it replaces, if unfinished, is counted as it stands.
function startRun(period=0){
  const old=ctx.slots.free;
  if(old&&old.status!=='over')recordCareer(old);
  // (the run takes the memory of the rivals of the last runs with it: its rivals are the teams met longest ago)
  ctx.slots.free=C.createRun(ctx.db,crypto.getRandomValues(new Uint32Array(1))[0],{ascension:Math.min(period,C.periodsOf(ctx.career).period),recent:ctx.rivals});
  activate('free');ctx.ui.tab='lineup';ctx.ui.opened=0;
  route();
}
// Back into a run already started. A pack left open comes back open.
function resume(mode){
  activate(mode);route();
  if(ctx.run.pack)queueMicrotask(showPack);
}
async function copy(text){
  try{await navigator.clipboard.writeText(text);}
  catch{
    // No clipboard permission: the old way, through a field selected for a moment.
    const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';
    document.body.append(area);area.select();
    try{document.execCommand('copy');}finally{area.remove();}
  }
  toast('Resultado copiado');
}
function name(id){return ctx.db.byId.get(id).name;}
// Where a new card landed: straight into the team when a starting place was open, on the bench otherwise.
const arrival = id=>ctx.run.lineup.some(s=>s.id===id)?'entrou como titular':'entrou no banco de reservas';

// ---------- Partida ----------
// A round is resolved by the engine in one go and then played back: the buy, each kill in turn, the result.
// ui.play holds the round on screen: its record, the scoreboard as it was before it, and how many kills were shown.
// Between two rounds the scoreboard shows the buys of the next one, and the round only starts after the freezetime.
// That is the only moment a Jogada de Efeito can be called: it goes to the round about to start, never to one already
// running. ui.freeze describes the freezetime on screen: {start,total} while it counts down, {manual:true} while the
// round waits for a click, null the rest of the time. schedule() sets it, so it runs before every render that follows.
const snapshot = m=>({score:[...m.score],plays:[...m.plays],teams:m.teams.map(team=>team.players.map(p=>({...p})))});
const betweenRounds = ()=>{const m=ctx.match,ui=ctx.ui;return !!m&&!m.over&&!m.pending&&!ui.play&&!ui.duel;};
function schedule(){
  clearTimeout(timer);timer=null;
  const m=ctx.match,ui=ctx.ui,play=ui.play;
  ui.freeze=null;
  if(ctx.screen!=='match'||!m||ui.paused||ui.duel||(!play&&(m.over||(m.pending&&ui.showEvent))))return;
  // While the tutorial is open nothing runs. A freezetime caught by it is held: on screen, but not counting; it
  // starts over when the tutorial closes.
  const held=tourOpen();
  if(play){if(!held)timer=setTimeout(step,playbackBeat(play.shown,play.record.kills.length,ui.speed));return;}
  const {wait,freeze}=beforeRound({pending:m.pending,plays:m.plays[0],auto:prefs.freezeAuto,seconds:prefs.freeze,speed:ui.speed});
  if(freeze)ui.freeze=wait===null||held?{manual:true}:{start:Date.now(),total:wait};
  if(wait!==null&&!held)timer=setTimeout(step,wait);
}
function step(){
  const m=ctx.match,ui=ctx.ui,play=ui.play;
  if(tourOpen()||ui.paused)return;
  if(play&&play.shown<play.record.kills.length)play.shown++;
  else if(play){
    ui.play=null;roundFeats();
    if(m.over)announce(`Fim de jogo: ${m.score[0]} a ${m.score[1]}.`);
    else if(play.record.round%4===0)announce(`Round ${play.record.round}: ${m.score[0]} a ${m.score[1]}.`);
  }
  else if(m.pending){ui.showEvent=true;announce(`Jogada de Efeito ${m.pending.by?'do rival':'do seu time'}: ${m.pending.label}. A partida espera a sua escolha.`);}
  else{
    // The freezetime already showed the buys: the round opens on its first kill.
    const before=snapshot(m),record=E.advanceRound(m);ui.play={record,before,shown:openingKills(record.kills.length)};
    // The round is settled the moment it starts on screen: a reload can't take it back to try a play on it.
    C.roundSeen(ctx.run,m);saveRun();
  }
  schedule();render();
}
// The confrontation of a Jogada de Efeito, one step at a time; when it ends, the round is played back like any other.
function duelClock(){
  clearTimeout(duelTimer);
  const duel=ctx.ui.duel,contest=duel.record.event.contest,wait=S.duelStepMs(contest,duel.step)*Math.max(.55,PACE[ctx.ui.speed]);
  // When the step began and how long it lasts: what moves during a step (the coin of the draw) follows this clock, so
  // a screen drawn again in the middle of the step doesn't start it over.
  Object.assign(duel,{stepAt:Date.now(),stepMs:Math.round(wait)});
  duelTimer=setTimeout(()=>{
    if(ctx.ui.duel!==duel)return;
    // The clock of the new step is set before the step is drawn: what moves during it (the coin of the draw) is
    // drawn from how far into the step the screen is, and with the clock of the step before the coin was born at
    // the end of its spin.
    if(duel.step<S.duelSteps(contest)-1){duel.step++;duelClock();render();return;}
    // The confrontation already said who took the round, so the round isn't played back kill by kill: the scoreboard
    // comes back with everything that happened in it, and the match moves on to the next round.
    ctx.ui.duel=null;roundFeats();
    if(ctx.match.over)announce(`Fim de jogo: ${ctx.match.score[0]} a ${ctx.match.score[1]}.`);
    schedule();render();
  },wait);
}
// The conquests a round proves come out as soon as the round has been shown, in the middle of the match, and not
// only at its end. The match in progress remembers how many of its rounds were already looked at (`feated`: a reload
// must not count a draw of the coin twice) and what came out of them (`feats`), for the summary of the match.
function roundFeats(){
  const live=ctx.run?.live,m=ctx.match;
  if(!live||!m)return;
  const got=A.fromRounds(m,ctx.feats,live.feated||0);
  live.feated=m.log.length;
  const fresh=A.award(ctx.feats,got,C.dayKey());
  store(FEATS_KEY,ctx.feats);
  if(fresh.length){(live.feats??=[]).push(...fresh);celebrate(fresh);}
  saveRun();
}
function finishMatch(){
  clearTimeout(timer);clearTimeout(duelTimer);ctx.ui.play=null;ctx.ui.duel=null;
  // What the match in progress already knows about its conquests is read before the campaign closes it.
  const live=ctx.run.live,seen=live?.feated||0,during=(live?.feats||[]).filter(id=>A.BY_ID[id]);
  const rival=ctx.run.opponent.team,before=[...ctx.run.usedTeams];
  ctx.summary=C.recordMatch(ctx.run,ctx.db,ctx.match);
  // The rival goes into the memory of the teams met, whatever the mode: the next runs of the traditional mode draw
  // their rivals among the ones met longest ago.
  ctx.rivals=C.metRival(ctx.rivals,rival,before);store(RIVALS_KEY,ctx.rivals);
  // The five who played the match go into the album.
  stamp(ctx.album,ctx.match.teams[0].lineup.map(s=>s.player.id),{won:ctx.summary.won,title:ctx.summary.outcome==='champion'});
  store(ALBUM_KEY,ctx.album);
  ST.recordMatch(ctx.stats,{run:ctx.run,match:ctx.match,summary:ctx.summary});store(STATS_KEY,ctx.stats);
  if(ctx.run.status==='over')recordCareer(ctx.run);
  // What the match brought. The formation of a win is kept even when it completes nothing yet.
  const won=A.fromMatch({match:ctx.match,summary:ctx.summary,run:ctx.run},ctx.feats,seen);
  store(FEATS_KEY,ctx.feats);
  // The summary of the match lists everything it brought: what came out during it and what its result proves.
  ctx.summary.feats=[...new Set([...during,...earn(won)])];
  ctx.screen='postmatch';
}

// ---------- Ações ----------
// Each action may return false to skip the re-render (dialogs render themselves).
const actions={
  home(){clearTimeout(timer);clearTimeout(duelTimer);ctx.screen='home';ctx.today=C.dayKey();ctx.ui.opened=0;},
  album(){ctx.screen='album';},
  feats(){ctx.screen='feats';},
  career(){ctx.screen='career';},
  'career-tab'(id){ctx.ui.careerTab=id;},
  'album-filter'(id){ctx.ui.albumFilter=id;},
  // Desafio do dia: one run a day, with the seed of the day. A challenge still being played comes first, whatever its day.
  daily(){
    const slot=ctx.slots.daily;
    if(slot&&slot.status!=='over'){resume('daily');return;}
    ctx.today=C.dayKey();
    if(ctx.career.daily[ctx.today]||slot?.daily===ctx.today)return;
    ctx.slots.daily=C.createRun(ctx.db,C.dailySeed(ctx.today),{daily:ctx.today});
    activate('daily');ctx.ui.tab='lineup';route();
  },
  'daily-quit'(){openDialog(S.confirmQuitDaily(ctx));return false;},
  'confirm-daily-quit'(){
    const run=ctx.slots.daily;
    closeDialog();C.abandon(run);recordCareer(run);saveSlot('daily');
    ctx.today=C.dayKey();ctx.screen='home';
  },
  // The result as text: of today's challenge from the first screen, of the run on screen from its last one.
  'copy-result'(id){
    const daily=ctx.slots.daily;
    const text=id!=='daily'?C.shareText(ctx.run,ctx.team):daily?.daily===ctx.today&&daily.status==='over'?C.shareText(daily,ctx.team):ctx.career.daily[ctx.today]?.share;
    if(text)copy(text);
    return false;
  },
  help(){openTour(entryKey(),false);return false;},
  'skip-walkout'(){if(Date.now()-packShown>=SKIP_AFTER)$('#dialog').classList.add('skipped');return false;},
  close(){closeDialog();return false;},
  // With a período open, a new run starts by choosing one: the dialog also says when a run would be left behind.
  'new-run'(){
    const free=ctx.slots.free;
    if(C.periodsOf(ctx.career).period){
      openDialog(S.periodDialog(ctx));
      // the list can be longer than the dialog: it opens showing the período that comes chosen
      $('#dialog [aria-pressed="true"]')?.scrollIntoView({block:'center'});
      return false;
    }
    if(free&&free.status!=='over'){openDialog(S.confirmNewRun());return false;}
    startRun();
  },
  'confirm-new-run'(){closeDialog();startRun();},
  'pick-period'(id){openDialog(S.periodDialog(ctx,Number(id)));return false;},
  'start-period'(id){closeDialog();prefs.period=Number(id);store(PREFS_KEY,prefs);startRun(Number(id));},
  'period-rules'(){openDialog(S.periodRules(ctx.run));return false;},
  continue(){resume('free');},
  'draft-pick'(id){C.draftPick(ctx.run,ctx.db,id);route();},
  // A bonus bought in the shop sends the player back to the shop; one given by the campaign, to the lineup.
  perk(id){const bought=ctx.run.perkBought;C.choosePerk(ctx.run,ctx.db,id);ctx.ui.tab=bought?'shop':'lineup';route();toast(`${E.PERKS[id].name} entrou na comissão técnica`);},
  'open-perk-pack'(){C.openPerkPack(ctx.run,ctx.db);route();},
  tab(id){ctx.ui.tab=id;ctx.ui.selected=null;},
  // A click on a column of the Stats table sorts by it; a click on the same column goes back to the usual order.
  'stats-sort'(id){ctx.ui.sort=ctx.ui.sort===id?null:id;},
  select(id){
    const current=ctx.ui.selected;
    if(!current){ctx.ui.selected=id;return;}
    if(current!==id){
      const isStarter=value=>ctx.run.lineup.some(s=>s.id===value);
      if(isStarter(current)!==isStarter(id)){openDialog(S.swapDialog(ctx,current,id));return false;}
      C.swapPlayers(ctx.run,ctx.db,current,id);announce(`${name(current)} e ${name(id)} trocaram de lugar.`);
    }
    ctx.ui.selected=null;
  },
  deselect(){ctx.ui.selected=null;},
  detail(id){openDialog(S.cardDetail(ctx,id),{kind:'wide'});return false;},
  'confirm-swap'(id,el){C.swapPlayers(ctx.run,ctx.db,id,el.dataset.other);closeDialog();ctx.ui.selected=null;announce('Troca aplicada.');},
  sell(id){openDialog(S.saleDialog(ctx,id));return false;},
  'confirm-sell'(id){
    const value=C.sellValue(ctx.db.byId.get(id),ctx.run),sale=A.fromSale(ctx.run,id);
    C.sellPlayer(ctx.run,ctx.db,id);closeDialog();ctx.ui.selected=null;toast(`${name(id)} vendido por ${num(value)} moedas`);
    earn(sale);
  },
  agent(id){openDialog(S.agentPicker(ctx,id),{kind:'wide'});return false;},
  formations(){openDialog(S.formationGuide(ctx),{kind:'wide'});return false;},
  'preview-agent'(id,el){openDialog(S.agentPicker(ctx,id,el.dataset.agent),{kind:'wide'});return false;},
  compare(id){openDialog(S.compareDialog(ctx,id),{kind:'wide'});return false;},
  'set-agent'(id,el){C.setAgent(ctx.run,ctx.db,id,el.dataset.agent);closeDialog();},
  'open-pack'(key){C.openPack(ctx.run,ctx.db,key);saveRun();render();showPack();return false;},
  'take-card'(id){C.takePackCard(ctx.run,ctx.db,id);closeDialog();toast(`${name(id)} ${arrival(id)}`);earn(A.fromPack(ctx.db.byId.get(id)));},
  'buy-player'(id){C.buyPlayer(ctx.run,ctx.db,id);closeDialog();toast(`${name(id)} ${arrival(id)}`);},
  'buy-agent'(agent){C.buyAgent(ctx.run,ctx.db,agent);toast(`${agent} contratado. Já pode ser escalado`);},
  reroll(){C.rerollShop(ctx.run,ctx.db);},
  play(){enterMatch();announce('Partida iniciada. Você pode pausar quando quiser.');earn(A.fromKickoff(ctx.match.teams[0].lineup));},
  // From the bar at the bottom of a narrow screen to the rival's panel, further down the page.
  'see-rival'(){$('.panel.next')?.scrollIntoView({block:'start',behavior:'smooth'});return false;},
  forfeit(){openDialog(S.forfeitDialog(ctx));return false;},
  'confirm-forfeit'(){
    closeDialog();ctx.match=null;ctx.summary=C.forfeitMatch(ctx.run,ctx.db);
    if(ctx.run.status==='over')recordCareer(ctx.run);
    ctx.summary.feats=earn();
    ctx.screen='postmatch';announce('Derrota por W.O.');
  },
  pause(){ctx.ui.paused=!ctx.ui.paused;schedule();},
  // The Jogada de Efeito goes to the round about to start. With a round running there is nothing to call it on.
  'play-call'(){
    const m=ctx.match,ui=ctx.ui;
    if(!betweenRounds()||m.plays[0]<=0)return false;
    clearTimeout(timer);
    const event=C.callPlay(ctx.run,m);
    Object.assign(ui,{freeze:null,showEvent:true});
    announce(`Jogada de Efeito: ${event.label}. Escolha quem vai.`);
  },
  // Ends the freezetime: the round starts now, without a play.
  'start-round'(){if(betweenRounds()&&!ctx.ui.paused){clearTimeout(timer);step();}return false;},
  settings(){ctx.ui.settings=!ctx.ui.settings;},
  'freeze-auto'(){prefs.freezeAuto=!prefs.freezeAuto;prefs.freezeSet=true;store(PREFS_KEY,prefs);schedule();},
  'freeze-time'(id){prefs.freeze=cleanFreeze(Number(id));store(PREFS_KEY,prefs);schedule();},
  // The speed is about what happens inside a round. A freezetime that is counting keeps counting from where it is.
  speed(id){ctx.ui.speed=prefs.speed=Number(id);store(PREFS_KEY,prefs);if(ctx.ui.play)schedule();},
  actor(id){
    const before=snapshot(ctx.match),record=C.pickActor(ctx.run,ctx.match,id);
    C.roundSeen(ctx.run,ctx.match);
    ctx.ui.showEvent=false;ctx.ui.duel={record,before,step:0};
    duelClock();
    announce(`${record.event.contest.won?'Confronto vencido':'Confronto perdido'} contra ${record.event.enemy.name}. ${record.won?'Round vencido':'Round perdido'}.`);
  },
  'see-result'(){finishMatch();},
  // The result as a picture, on the clipboard (or saved as a file where the browser doesn't let a page copy images).
  'copy-image'(){
    copyShareImage(shareModel(ctx.run,ctx.team,ctx.db)).then(how=>toast(how==='copied'?'Imagem copiada':'Imagem salva em arquivo: o navegador não deixou copiar'),()=>toast('Não deu para gerar a imagem'));
    return false;
  },
  'after-match'(){ctx.match=null;ctx.summary=null;ctx.ui.tab='lineup';route();}
};
document.addEventListener('click',event=>{
  const dialog=$('#dialog');
  // A click whose target is the dialog itself landed either on the dimmed page around it or on an empty spot inside it
  // (its padding, the gap above a button). Only the first closes it: a near miss on "Confirmar" must not cancel.
  if(event.target===dialog){
    if(dialog.dataset.locked!=='1'&&outsideBox(event.clientX,event.clientY,dialog.getBoundingClientRect()))closeDialog();
    return;
  }
  // The match settings are a small panel under their button: any click outside it closes it.
  const shut=ctx.ui.settings&&!event.target.closest('.settings');
  if(shut)ctx.ui.settings=false;
  const el=event.target.closest('[data-action]');
  if(!el||el.disabled||!actions[el.dataset.action]){if(shut)render();return;}
  // Nothing is done on a run another tab has already taken further.
  if(behind('free')||behind('daily')){resync();return;}
  try{
    if(actions[el.dataset.action](el.dataset.id,el)===false)return;
    earn();
    if(saveRun())render();
  }catch(error){toast(error.message);}
});
$('#dialog').addEventListener('cancel',event=>{if(event.currentTarget.dataset.locked==='1')event.preventDefault();});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.dataset.action==='compare-target')openDialog(S.compareDialog(ctx,el.dataset.id,el.value),{kind:'wide'});
  if(el.dataset.input==='team')el.value=ctx.team;
});
// The team's name is kept as it is typed (one space at a time, no leading space) and tidied when the field is left.
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.dataset.input!=='team')return;
  ctx.team=prefs.team=el.value.replace(/\s+/g,' ').trim().slice(0,24);
  store(PREFS_KEY,prefs);
});
document.addEventListener('keydown',event=>{
  if(ctx.screen!=='match'||$('#dialog').open||tourOpen()||event.target.closest('button,a,input'))return;
  if(event.code!=='Space')return;
  // Space starts the round during the freezetime and pauses the match the rest of the time.
  if($('[data-action="start-round"]')){event.preventDefault();actions['start-round']();}
  else if($('[data-action="pause"]')){event.preventDefault();actions.pause();render();}
});
// A save is only trusted if every card, agent and bonus it names still exists in the current rules;
// anything else (older version, edited storage) is dropped and the player starts fresh.
function validSave(run){
  try{
    const ids=[...C.rosterIds(run),...run.draft.picked,...run.draft.choices,...(run.opponent?.ids||[]),...(run.shop?.market.map(o=>o.id)||[]),...(run.pack?.cards||[])];
    const agents=[...run.pool,...run.lineup.map(s=>s.agent),...(run.opponent?.agents||[]),...(run.shop?.agents.map(o=>o.agent)||[])];
    // the step of the ladder, when the run has one, is one that exists, and never on a Desafio do dia
    if(run.ascension!==undefined&&(!Number.isInteger(run.ascension)||run.ascension<1||run.ascension>C.LADDER.length||run.daily))return false;
    return run.version===3&&Array.isArray(run.draft.plan)&&ids.every(id=>ctx.db.byId.has(id))&&agents.every(agent=>E.AGENTS[agent])
      &&[...run.perks,...(run.perkOffer||[])].every(key=>E.PERKS[key])&&(!run.pack||(run.pack.key==='funcao'?E.ROLES.includes(run.pack.role):C.PACKS.some(p=>p.key===run.pack.key)))
      &&Number.isFinite(run.coins)&&C.STAGES[run.stage]&&run.record.length===C.STAGES.length&&run.lineup.length<=5
      &&(!run.live||(Number.isInteger(run.live.rounds)&&run.live.picks.every(id=>run.lineup.some(s=>s.id===id))&&(run.live.calls||[]).every(Number.isInteger)));
  }catch{return false;}
}
// A slot only takes a trusted save of its own kind: the challenge is the run that carries a day.
function readSlot(mode){
  const saved=load(KEYS[mode]);
  written[mode]='';
  if(!validSave(saved)||(mode==='daily')!==(typeof saved.daily==='string'))return null;
  // A match saved under other rules of the round (before the Jogadas de Efeito, before the abilities) can't be
  // continued under the ones of today: it starts over.
  if(saved.live&&(!Array.isArray(saved.live.calls)||!C.sameRules(saved.live)))saved.live=null;
  written[mode]=content(saved);
  return saved;
}
// The statistics of the career. The first time, the count starts today and is saved at once, so that the day stays.
function readStats(){
  const saved=load(STATS_KEY),stats=ST.cleanStats(saved,{byId:ctx.db.byId,today:ctx.today||C.dayKey()});
  if(!saved)store(STATS_KEY,stats);
  return stats;
}
function readCareer(){
  ctx.career={runs:0,titles:0,best:'',bestRank:-1,daily:{},...(load(CAREER_KEY)||{})};
  if(!ctx.career.daily||typeof ctx.career.daily!=='object')ctx.career.daily={};
  Object.assign(ctx.career,C.periodsOf(ctx.career));
}
// Another tab saved something. If it is the run on this tab's screen, this tab is now behind and starts over from
// what was saved. Anything else (the run of the other mode, the history, the album) is simply read again.
addEventListener('storage',event=>{
  if(event.storageArea!==localStorage||!ctx.db)return;
  const mode=event.key===RUN_KEY?'free':event.key===DAILY_KEY?'daily':null,playing=!['home','album','feats','career'].includes(ctx.screen);
  if(event.key===null||(playing&&mode===ctx.mode)){resync();return;}
  if(mode){ctx.slots[mode]=readSlot(mode);if(mode===ctx.mode)ctx.run=ctx.slots[mode];}
  else if(event.key===CAREER_KEY)readCareer();
  else if(event.key===ALBUM_KEY)ctx.album=cleanAlbum(load(ALBUM_KEY),ctx.db.byId);
  else if(event.key===FEATS_KEY)ctx.feats=A.cleanFeats(load(FEATS_KEY));
  else if(event.key===STATS_KEY)ctx.stats=readStats();
  else if(event.key===RIVALS_KEY)ctx.rivals=C.cleanRivals(load(RIVALS_KEY),ctx.db);
  else return;
  if(!playing&&!$('#dialog').open)render();
});
async function init(){
  // On the published site: is this the published build? (Asked while the cards load.) And the build leaves the address.
  checkBuild();
  if(BUILD&&new URL(location.href).searchParams.has('v'))history.replaceState(null,'',cleanAddress(location.href));
  try{
    const response=await fetch('players.json?v=ddb9ffb608');
    if(!response.ok)throw new Error('O arquivo de jogadores não respondeu');
    ctx.db=C.indexDb(await response.json());
  }catch(error){
    // The hint about the local server only helps who opened the file straight from the disk; on a site it says nothing.
    $('#app').innerHTML=`<div class="boot"><h1>As cartas não carregaram</h1><p>${esc(error.message)}${location.protocol==='file:'?'. Abra o jogo pelo servidor local (Iniciar jogo.cmd) e tente de novo':''}</p><button class="btn primary" onclick="location.reload()">Tentar de novo</button></div>`;
    return;
  }
  useBase(ctx.db.players);
  initTips();
  // Brand art is optional: without assets.json the game draws its own glyphs.
  try{const art=await fetch('assets.json?v=ddb9ffb608');if(art.ok)useArt(await art.json());}catch{/* drawn fallbacks */}
  ctx.showcase=E.shuffle(ctx.db.players.filter(p=>p.photo&&p.ovr>=86)).slice(0,5);
  readCareer();
  const saved_prefs=load(PREFS_KEY)||{};
  if([1,2,4].includes(saved_prefs.speed))prefs.speed=saved_prefs.speed;
  // (An older version kept `tourOff`, with which skipping one tutorial turned them all off. It is no longer read.)
  prefs.seen={...(saved_prefs.seen||{})};
  if(Number.isInteger(saved_prefs.period))prefs.period=saved_prefs.period;
  prefs.freezeAuto=prefs.freezeSet=savedFreezeAuto(saved_prefs);prefs.freeze=cleanFreeze(saved_prefs.freeze);
  if(typeof saved_prefs.team==='string')ctx.team=prefs.team=saved_prefs.team.replace(/\s+/g,' ').trim().slice(0,24);
  ctx.ui.speed=prefs.speed;
  ctx.today=C.dayKey();
  ctx.album=cleanAlbum(load(ALBUM_KEY),ctx.db.byId);
  ctx.stats=readStats();
  ctx.rivals=C.cleanRivals(load(RIVALS_KEY),ctx.db);
  for(const mode of ['free','daily'])ctx.slots[mode]=readSlot(mode);
  ctx.run=ctx.slots.free;
  // The conquests already won, plus what the saved history, album and runs already prove (titles, the best campaign,
  // the cards of the album): those are marked here without ceremony, because they were not won just now.
  ctx.feats=A.cleanFeats(load(FEATS_KEY));
  if(['free','daily'].map(mode=>A.award(ctx.feats,A.fromState({...ctx,run:ctx.slots[mode]}),ctx.today)).flat().length)store(FEATS_KEY,ctx.feats);
  // Back from a move to a newer build (see switchBuild): the player is put where they were, and told why the page blinked.
  let place=null;
  try{place=JSON.parse(sessionStorage.getItem(PLACE_KEY)||'null');sessionStorage.removeItem(PLACE_KEY);}catch{/* opens on the first screen */}
  if(place)backToPlace(place);
  render();
  if(place)toast('Jogo atualizado');
  // Back from a reload forced by another tab (see resync).
  let notice=null;
  try{notice=sessionStorage.getItem(NOTICE_KEY);sessionStorage.removeItem(NOTICE_KEY);}catch{/* no notice */}
  if(notice)toast('O jogo avançou em outra aba. Esta agora mostra o que foi salvo');
}
init();
