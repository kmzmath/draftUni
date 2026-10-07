// Estado, ações e ciclo de renderização. As regras ficam em engine.js e campaign.js; as telas, em screens.js.
import * as E from './engine.js?v=31930249b4';
import * as C from './campaign.js?v=31930249b4';
import * as S from './screens.js?v=31930249b4';
import {$,esc,useBase,useArt,num,outsideBox} from './ui.js?v=31930249b4';
import {startTour,closeTour,tourOpen} from './tour.js?v=31930249b4';
import {PACE,FREEZE_DEFAULT,cleanFreeze,savedFreezeAuto,beforeRound,playbackBeat,freezeClock,openingKills} from './pace.js?v=31930249b4';
import {stamp,cleanAlbum} from './album.js?v=31930249b4';
import {initTips,refreshTips} from './tip.js?v=31930249b4';
import {shareModel,copyShareImage} from './share.js?v=31930249b4';
import {staleSave,stampSave} from './save.js?v=31930249b4';

const RUN_KEY='univava:run',DAILY_KEY='univava:daily',CAREER_KEY='univava:career',PREFS_KEY='univava:prefs',ALBUM_KEY='univava:album';
const KEYS={free:RUN_KEY,daily:DAILY_KEY},NOTICE_KEY='univava:notice';
// Two runs can be under way at once, each in its own slot: the traditional one, started whenever the player wants, and
// the Desafio do dia. ctx.run is the one on screen (ctx.slots[ctx.mode]). ctx.today is the day of today's challenge.
// career.daily remembers the result of each challenge already played; ctx.album, every card already fielded.
const ctx={db:null,run:null,mode:'free',slots:{free:null,daily:null},today:'',album:{},match:null,summary:null,screen:'home',showcase:[],team:'',prefs:null,
  career:{runs:0,titles:0,best:'',bestRank:-1,daily:{}},
  ui:{tab:'lineup',selected:null,paused:false,speed:1,showEvent:false,play:null,duel:null,freeze:null,settings:false,sort:null,albumFilter:'all'}};
// What the player chose to keep between visits: the team's name, match speed, how the freezetime before each round
// works (automatic or on a click, and for how many seconds) and which screens the tutorial already explained.
const prefs=ctx.prefs={team:'',speed:1,freezeAuto:false,freezeSet:false,freeze:FREEZE_DEFAULT,tourOff:false,seen:{}};
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
  if(changed){
    if(key.split(':')[0]!==shownKey.split(':')[0])window.scrollTo(0,0);
    shownKey=key;
    // The confrontation opens over the scoreboard. If part of it is off the screen, the page glides to it instead of
    // jumping: just enough to show it all, or to its top when it is taller than the screen.
    const layer=ctx.screen==='match'&&key!=='match:board'&&$('.play-layer');
    if(layer)layer.scrollIntoView({block:layer.offsetHeight>innerHeight-110?'start':'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }else if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(const row of app.querySelectorAll('[data-flip]')){
      const from=before.get(row.dataset.flip),moved=from===undefined?0:from-row.getBoundingClientRect().top;
      if(!moved)continue;
      row.classList.add(moved>0?'rose':'sank');
      row.animate([{transform:`translateY(${moved}px)`},{transform:'none'}],{duration:560,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  }
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
  const name=tourName(key);
  if(!name||$('#dialog').open||(auto&&(prefs.tourOff||prefs.seen[name])))return;
  // By itself the tutorial is the short one; asked for through Ajuda, it is the whole one.
  const started=startTour(name,{brief:auto,onClose(){schedule();render();},onOff(){prefs.tourOff=true;store(PREFS_KEY,prefs);}});
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
  ctx.career.runs++;if(champion)ctx.career.titles++;
  if(rank>ctx.career.bestRank){ctx.career.bestRank=rank;ctx.career.best=champion?'Campeão':run.stage===2&&last?last.label:C.STAGES[run.stage].name;}
  // A finished Desafio do dia leaves its result behind, with the text to share, for the last two months of days.
  if(run.daily){
    const log={...ctx.career.daily,[run.daily]:{line:C.resultLine(run),share:C.shareText(run,ctx.team)}};
    ctx.career.daily=Object.fromEntries(Object.entries(log).sort(([a],[b])=>a.localeCompare(b)).slice(-60));
  }
  store(CAREER_KEY,ctx.career);
}
// A new run of the traditional mode, with a seed of its own. The one it replaces, if unfinished, is counted as it stands.
function startRun(){
  const old=ctx.slots.free;
  if(old&&old.status!=='over')recordCareer(old);
  ctx.slots.free=C.createRun(ctx.db,crypto.getRandomValues(new Uint32Array(1))[0]);
  activate('free');ctx.ui.tab='lineup';
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
    ui.play=null;
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
  const duel=ctx.ui.duel,contest=duel.record.event.contest;
  duelTimer=setTimeout(()=>{
    if(ctx.ui.duel!==duel)return;
    if(duel.step<S.duelSteps(contest)-1){duel.step++;render();duelClock();return;}
    // The confrontation already said who took the round, so the round isn't played back kill by kill: the scoreboard
    // comes back with everything that happened in it, and the match moves on to the next round.
    ctx.ui.duel=null;
    if(ctx.match.over)announce(`Fim de jogo: ${ctx.match.score[0]} a ${ctx.match.score[1]}.`);
    schedule();render();
  },S.duelStepMs(contest,duel.step)*Math.max(.55,PACE[ctx.ui.speed]));
}
function finishMatch(){
  clearTimeout(timer);clearTimeout(duelTimer);ctx.ui.play=null;ctx.ui.duel=null;
  ctx.summary=C.recordMatch(ctx.run,ctx.db,ctx.match);
  // The five who played the match go into the album.
  stamp(ctx.album,ctx.match.teams[0].lineup.map(s=>s.player.id),{won:ctx.summary.won,title:ctx.summary.outcome==='champion'});
  store(ALBUM_KEY,ctx.album);
  if(ctx.run.status==='over')recordCareer(ctx.run);
  ctx.screen='postmatch';
}

// ---------- Ações ----------
// Each action may return false to skip the re-render (dialogs render themselves).
const actions={
  home(){clearTimeout(timer);clearTimeout(duelTimer);ctx.screen='home';ctx.today=C.dayKey();},
  album(){ctx.screen='album';},
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
  'new-run'(){const free=ctx.slots.free;if(free&&free.status!=='over'){openDialog(S.confirmNewRun());return false;}startRun();},
  'confirm-new-run'(){closeDialog();startRun();},
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
  'confirm-sell'(id){const value=C.sellValue(ctx.db.byId.get(id));C.sellPlayer(ctx.run,ctx.db,id);closeDialog();ctx.ui.selected=null;toast(`${name(id)} vendido por ${num(value)} moedas`);},
  agent(id){openDialog(S.agentPicker(ctx,id),{kind:'wide'});return false;},
  formations(){openDialog(S.formationGuide(ctx),{kind:'wide'});return false;},
  'preview-agent'(id,el){openDialog(S.agentPicker(ctx,id,el.dataset.agent),{kind:'wide'});return false;},
  compare(id){openDialog(S.compareDialog(ctx,id),{kind:'wide'});return false;},
  'set-agent'(id,el){C.setAgent(ctx.run,ctx.db,id,el.dataset.agent);closeDialog();},
  'open-pack'(key){C.openPack(ctx.run,ctx.db,key);saveRun();render();showPack();return false;},
  'take-card'(id){C.takePackCard(ctx.run,ctx.db,id);closeDialog();toast(`${name(id)} ${arrival(id)}`);},
  'buy-player'(id){C.buyPlayer(ctx.run,ctx.db,id);closeDialog();toast(`${name(id)} ${arrival(id)}`);},
  'buy-agent'(agent){C.buyAgent(ctx.run,ctx.db,agent);toast(`${agent} contratado. Já pode ser escalado`);},
  reroll(){C.rerollShop(ctx.run,ctx.db);},
  play(){enterMatch();announce('Partida iniciada. Você pode pausar quando quiser.');},
  // From the bar at the bottom of a narrow screen to the rival's panel, further down the page.
  'see-rival'(){$('.panel.next')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return false;},
  forfeit(){openDialog(S.forfeitDialog(ctx));return false;},
  'confirm-forfeit'(){
    closeDialog();ctx.match=null;ctx.summary=C.forfeitMatch(ctx.run,ctx.db);
    if(ctx.run.status==='over')recordCareer(ctx.run);
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
  // A match saved before the Jogadas de Efeito existed can't be continued under the new rules: it starts over.
  if(saved.live&&!Array.isArray(saved.live.calls))saved.live=null;
  written[mode]=content(saved);
  return saved;
}
function readCareer(){
  ctx.career={runs:0,titles:0,best:'',bestRank:-1,daily:{},...(load(CAREER_KEY)||{})};
  if(!ctx.career.daily||typeof ctx.career.daily!=='object')ctx.career.daily={};
}
// Another tab saved something. If it is the run on this tab's screen, this tab is now behind and starts over from
// what was saved. Anything else (the run of the other mode, the history, the album) is simply read again.
addEventListener('storage',event=>{
  if(event.storageArea!==localStorage||!ctx.db)return;
  const mode=event.key===RUN_KEY?'free':event.key===DAILY_KEY?'daily':null,playing=!['home','album'].includes(ctx.screen);
  if(event.key===null||(playing&&mode===ctx.mode)){resync();return;}
  if(mode){ctx.slots[mode]=readSlot(mode);if(mode===ctx.mode)ctx.run=ctx.slots[mode];}
  else if(event.key===CAREER_KEY)readCareer();
  else if(event.key===ALBUM_KEY)ctx.album=cleanAlbum(load(ALBUM_KEY),ctx.db.byId);
  else return;
  if(!playing&&!$('#dialog').open)render();
});
async function init(){
  try{
    const response=await fetch('players.json?v=31930249b4');
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
  try{const art=await fetch('assets.json?v=31930249b4');if(art.ok)useArt(await art.json());}catch{/* drawn fallbacks */}
  ctx.showcase=E.shuffle(ctx.db.players.filter(p=>p.photo&&p.ovr>=86)).slice(0,5);
  readCareer();
  const saved_prefs=load(PREFS_KEY)||{};
  if([1,2,4].includes(saved_prefs.speed))prefs.speed=saved_prefs.speed;
  prefs.tourOff=saved_prefs.tourOff===true;prefs.seen={...(saved_prefs.seen||{})};
  prefs.freezeAuto=prefs.freezeSet=savedFreezeAuto(saved_prefs);prefs.freeze=cleanFreeze(saved_prefs.freeze);
  if(typeof saved_prefs.team==='string')ctx.team=prefs.team=saved_prefs.team.replace(/\s+/g,' ').trim().slice(0,24);
  ctx.ui.speed=prefs.speed;
  ctx.today=C.dayKey();
  ctx.album=cleanAlbum(load(ALBUM_KEY),ctx.db.byId);
  for(const mode of ['free','daily'])ctx.slots[mode]=readSlot(mode);
  ctx.run=ctx.slots.free;
  render();
  // Back from a reload forced by another tab (see resync).
  let notice=null;
  try{notice=sessionStorage.getItem(NOTICE_KEY);sessionStorage.removeItem(NOTICE_KEY);}catch{/* no notice */}
  if(notice)toast('O jogo avançou em outra aba. Esta agora mostra o que foi salvo');
}
init();
