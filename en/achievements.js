// As conquistas: os feitos do jogador, marcados para sempre e somando os dois modos de jogo.
// Cada uma tem um nome e o que pede. Nenhuma dá moedas nem bônus: são só para mostrar.
// O que já saiu fica guardado entre as runs como {got:{id:dia}, formations:[...], tosses:n}: o dia em que cada
// conquista saiu; para a Estrategista, as formações com que o time já venceu; e, para a Moeda viciada, quantos
// sorteios seguidos o time venceu (ou perdeu, abaixo de zero).
import * as E from './engine.js?v=0a83137a2f';
import {lineupSlots,lineupError,PERIODS} from './campaign.js?v=0a83137a2f';
import {albumSummary} from './album.js?v=0a83137a2f';

export const GROUPS = ["Campaign","Match","Power Play","Roster","Album"];
export const ACHIEVEMENTS = [
  ['groups',"Campaign","Qualified","Reach the Group Stage"],
  ['playoffs',"Campaign","Knockout Time","Reach the Playoffs"],
  ['final',"Campaign","Finalist","Reach the final"],
  ['champion',"Campaign","Univavá Champion","Win the championship"],
  ['three',"Campaign","Three-Time Champion","Win 3 championships"],
  ['unbeaten',"Campaign","Undefeated","Win the championship without losing a match"],
  ['wire',"Campaign","By the Skin of Your Teeth","Advance to the next stage in the last possible match"],
  ['daily',"Campaign","Champion of the Day","Win the Daily Challenge"],
  ['regular',"Campaign","Regular","Play the Daily Challenge on 7 different days"],
  ['passed',"Campaign","Accepted","Win the championship in Semester 1"],
  ['graduate',"Campaign","Graduate",`Win the championship in Semester ${PERIODS}`],
  ['soclose',"Campaign","So Close...","Lose the final after winning every other match"],
  ['popcorn',"Campaign","Chokers","Lose your first Playoff match after winning every other match"],
  ['lion',"Campaign","Qualifier Kings","Lose every Group Stage match after winning every Qualifier match"],
  ['sweep',"Match","Steamroller","Win a match 13–0"],
  ['swept',"Match","A Day to Forget","Lose a match 0–13"],
  ['overtime',"Match","Overtime","Win a match in overtime"],
  ['comeback',"Match","Comeback","Win after falling 6 rounds behind"],
  ['streak',"Match","On a Roll","Win 5 matches in a row in the same run"],
  ['upset',"Match","Giant Slayer","Beat an opponent whose effective overall is at least 3 points higher than yours"],
  ['carry',"Match","My Back Hurts","Have one of your players finish a match with at least 30 kills"],
  ['ace',"Match",'Ace',"Have one of your players get all 5 kills in a round"],
  ['eco',"Match","Eco Miracle","Win an Eco round against a Full buy"],
  ['house',"Match","The House Always Wins","Lose a round with at least an 85% win chance without using a Power Play"],
  ['collective',"Match","Teamwork Makes the Dream Work","Win a match without using a Power Play"],
  ['hot',"Power Play","Hot Hand","Win every showdown in a match (at least 3)"],
  ['detail',"Power Play","By a Hair","Win a showdown on a tiebreaker"],
  ['trust',"Power Play","I Like My Odds","Skip a Power Play in a round with a win chance of 15% or less"],
  ['prevent',"Power Play","Better Safe than Sorry","Use a Power Play in a round with a 49% win chance"],
  ['sure',"Power Play","I Prefer a Sure Thing","Use a Power Play in a round with at least an 80% win chance"],
  ['coward',"Power Play","Chickens","Lose 4 showdowns in a row in the same match"],
  ['coin',"Power Play","Loaded Coin","Win or lose 3 coin-flip tiebreakers in a row"],
  ['home',"Roster","Home Team","Play a match with five starters from the same team"],
  ['mains',"Roster","In Their Element","Play a match with all five starters on their comfort agents"],
  ['selecao',"Roster","Dream Team","Build a lineup with an average effective overall of 90"],
  ['best',"Roster","World's Best","Have a player with an effective overall of 94 on your roster"],
  ['strategist',"Roster","Strategist","Win with each of the five formations"],
  ['find',"Roster","What a Find","Keep a card rated 90 overall or higher from a pack"],
  ['vault',"Roster","Full Vault","Save up 1,000 coins"],
  ['refund',"Roster","I Want a Refund","Sell a player during the same shop visit in which you got them from a pack"],
  ['album50',"Album","Collector","Collect 50 cards in the album"],
  ['album150',"Album","An Album to Be Proud Of","Collect 150 cards in the album"],
  ['albumAll',"Album","Complete Album","Collect every card in the album"],
  ['team',"Album","The Whole Squad","Collect every card from one team in the album"]
].map(([id,group,name,text])=>({id,group,name,text}));
export const BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,a]));
// The five formations a team of five can have: the Estrategista asks for a win with each of them.
const FORMATION_KEYS = E.FORMATIONS.filter(f=>f.role).map(f=>f.key);
const SELECAO = 90, BEST = 94, VAULT = 1000;
// The chances the conquests of the plays ask for, as the bar of the round shows them (whole percentages): a round let
// go by at this or less, a round lost at this or more, a play called at exactly this, and a play called at this or more.
const TRUST = 15, HOUSE = 85, PREVENT = 49, SURE = 80;
// Confrontations lost in a row in one match, and draws of the coin with the same result in a row, over any matches.
const COWARD = 4, COIN = 3;

// ---------- O que cada momento do jogo prova ----------
// Each function gives the ids a moment has earned, whether or not they had come out before: award() keeps the news.

// The períodos a title was won on: the first one is behind whoever won any, since each opens the next.
const periods = cleared=>[...(cleared>=1?['passed']:[]),...(cleared>=PERIODS?['graduate']:[])];
// How far a campaign has got: the stage it is in, the playoff games already won, and the title.
function reached(stage,playoffWins,champion) {
  const got=[];
  if(stage>=1||champion)got.push('groups');
  if(stage>=2||champion)got.push('playoffs');
  if((stage>=2&&playoffWins>=2)||champion)got.push('final');
  if(champion)got.push('champion');
  return got;
}
const strength = (team,perks=[])=>E.avg(team.lineup.map(s=>E.effective(s.player,s.agent,team.lineup,perks).value));

// What the rounds of a match prove, read from its log: it can be asked in the middle of the match, as soon as a round
// has been shown, so that a conquest comes out when it happens. `from` is how many rounds were already looked at:
// those only count for what runs from round to round (the plays left, the confrontations lost in a row), and prove
// nothing again. The draws of the coin are counted in `feats`, from match to match.
export function fromRounds(match,feats,from=0) {
  const got=[],log=match.log||[];
  // The chance each round started with, whether a play decided it, whose play it was and how the confrontation went.
  // `left` is how many plays you still had when the round was about to start.
  const shown=round=>Math.round(100*round.odds);
  let left=match.playsMax?.[0]??E.PLAYS,lostInRow=0;
  log.forEach((round,i)=>{
    const fresh=i>=from,contest=round.event?.contest,mine=(round.kills||[]).filter(kill=>kill.team===0);
    if(fresh&&mine.length>=5&&mine.every(kill=>kill.killer===mine[0].killer))got.push('ace');
    if(fresh&&round.won&&round.gear?.[0]==='Eco'&&round.gear[1]==="Full")got.push('eco');
    if(fresh&&contest?.tiebreak&&contest.won)got.push('detail');
    if(!round.event){
      // a round you could have turned into a confrontation and didn't
      if(fresh&&left>0&&shown(round)<=TRUST)got.push('trust');
      if(fresh&&!round.won&&shown(round)>=HOUSE)got.push('house');
    }else if(round.event.by===0){
      left--;
      if(fresh&&shown(round)===PREVENT)got.push('prevent');
      if(fresh&&shown(round)>=SURE)got.push('sure');
    }
    if(!contest)return;
    lostInRow=contest.won?0:lostInRow+1;
    if(fresh&&lostInRow>=COWARD)got.push('coward');
    // the draws of the coin are counted from match to match: so many won in a row, or so many lost (below zero)
    if(fresh&&contest.tiebreak==='coin'){
      const run=feats.tosses||0;
      feats.tosses=contest.won?Math.min(9,Math.max(run,0)+1):Math.max(-9,Math.min(run,0)-1);
      if(Math.abs(feats.tosses)>=COIN)got.push('coin');
    }
  });
  return [...new Set(got)];
}
// A match that was played to the end, right after the campaign recorded it (so `run` is already where the result took
// it). `feats` is what the player has so far: the formation of a win is added to it. `from` is how many of its rounds
// were already looked at while it was being played (see fromRounds): the rest of them is looked at here.
export function fromMatch({match,summary,run},feats,from=0) {
  const got=[],[ours,theirs]=match.score,won=ours>theirs,log=match.log||[];
  if(won&&theirs===0)got.push('sweep');
  if(!won&&ours===0)got.push('swept');
  if(won&&ours>13)got.push('overtime');
  // the furthest behind the team was at any point of the match
  let us=0,them=0,behind=0;
  for(const round of log){if(round.won)us++;else them++;behind=Math.max(behind,them-us);}
  if(won&&behind>=6)got.push('comeback');
  if(summary.streak>=5)got.push('streak');
  if(won&&strength(match.teams[1])-strength(match.teams[0],match.perks)>=3)got.push('upset');
  if(match.teams[0].players.some(p=>p.k>=30))got.push('carry');
  if(match.eventsResolved>=3&&match.eventsWon===match.eventsResolved)got.push('hot');
  got.push(...fromRounds(match,feats,from));
  if(won&&!log.some(round=>round.event?.by===0))got.push('collective');
  if(won){
    const key=E.composition(match.teams[0].lineup).key;
    if(FORMATION_KEYS.includes(key)&&!feats.formations.includes(key))feats.formations.push(key);
    if(FORMATION_KEYS.every(formation=>feats.formations.includes(formation)))got.push('strategist');
  }
  const champion=summary.outcome==='champion';
  got.push(...reached(run.stage,run.record?.[2]?.w||0,champion));
  if(champion&&run.history.every(game=>game.won))got.push('unbeaten');
  if(champion&&run.daily)got.push('daily');
  if(champion)got.push(...periods(run.ascension||0));
  // a stage has as many games as wins and losses it allows, less one: none was left over
  if(summary.outcome==='advanced'&&summary.spare===0)got.push('wire');
  got.push(...fromRun(run));
  return got;
}
// A campaign that got away, read from the run once it is lost (a run given up proves nothing): the final lost after
// winning every other game, the first playoff game lost after winning every other game, and the groups left without
// a win after a qualifier without a defeat.
export function fromRun(run) {
  if(run?.result!=='eliminated')return [];
  const games=run.history||[],last=games.at(-1),before=games.slice(0,-1),got=[];
  if(!last)return got;
  const flawless=before.every(game=>game.won),playoffs=games.filter(game=>game.stage===2);
  if(flawless&&last.stage===2&&String(last.label).startsWith('Final'))got.push('soclose');
  if(flawless&&last.stage===2&&playoffs.length===1)got.push('popcorn');
  if(last.stage===1&&games.filter(game=>game.stage===0).every(game=>game.won)&&games.filter(game=>game.stage===1).every(game=>!game.won))got.push('lion');
  return got;
}
// A card sold in the same round of the shop in which it came out of a pack (see run.packed in campaign.js).
export const fromSale = (run,id)=>run?.packed?.includes(id)?['refund']:[];
// The five who walk into a match.
export function fromKickoff(lineup) {
  const got=[];
  if(lineup.length!==5)return got;
  if(lineup.every(slot=>slot.player.team===lineup[0].player.team))got.push('home');
  if(lineup.every(slot=>slot.agent===slot.player.comfort))got.push('mains');
  return got;
}
// The card kept from a pack.
export const fromPack = card=>card.ovr>=90?['find']:[];
// What the game as it stands proves by itself: the lineup of the run on screen, its coins, the history and the album.
// It is also what turns what was saved before the conquests existed into conquests.
export function fromState({run,db,career,album}) {
  const rank=career?.bestRank??-1,titles=career?.titles||0,days=career?.daily||{};
  const champion=titles>0||rank>=100||run?.result==='champion';
  const stage=Math.max(run?.stage||0,rank>=20?2:rank>=10?1:0);
  const playoffWins=Math.max(run?.stage===2?run.record?.[2]?.w||0:0,rank>=20&&rank<100?rank-20:0);
  const got=reached(stage,playoffWins,champion);
  if(titles>=3)got.push('three');
  if(Object.values(days).some(day=>/^campeão/i.test(day?.line||'')))got.push('daily');
  if(Object.keys(days).length>=7)got.push('regular');
  got.push(...periods(career?.cleared||0));
  got.push(...fromRun(run));
  // a lineup counts when it is one that can play: five starters, each on an agent of his own
  if(run?.status==='hub'&&run.lineup.length===5&&!lineupError(run,db)){
    const lineup=lineupSlots(run,db),values=lineup.map(slot=>E.effective(slot.player,slot.agent,lineup,run.perks).value);
    if(E.avg(values)>=SELECAO)got.push('selecao');
    if(Math.max(...values)>=BEST)got.push('best');
  }
  if(run&&run.coins>=VAULT)got.push('vault');
  const pages=albumSummary(album||{},db.players);
  if(pages.have>=50)got.push('album50');
  if(pages.have>=150)got.push('album150');
  if(pages.have===pages.total)got.push('albumAll');
  if(pages.complete>0)got.push('team');
  return got;
}

// ---------- O que o jogador já tem ----------
// Marks the conquests of `ids` that are new, with the day they came out, and gives them back in the order of the list.
export function award(feats,ids,day) {
  const fresh=ACHIEVEMENTS.filter(a=>ids.includes(a.id)&&!feats.got[a.id]).map(a=>a.id);
  for(const id of fresh)feats.got[id]=day;
  return fresh;
}
export const count = feats=>({have:ACHIEVEMENTS.filter(a=>feats?.got?.[a.id]).length,total:ACHIEVEMENTS.length});
// What was saved is only trusted for conquests that exist, with a real day, and for formations that exist.
export function cleanFeats(raw) {
  const feats={got:{},formations:[],tosses:0};
  if(!raw||typeof raw!=='object')return feats;
  if(Number.isInteger(raw.tosses)&&Math.abs(raw.tosses)<=9)feats.tosses=raw.tosses;
  for(const [id,day] of Object.entries(raw.got||{}))if(BY_ID[id]&&typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day))feats.got[id]=day;
  for(const key of Array.isArray(raw.formations)?raw.formations:[])if(FORMATION_KEYS.includes(key)&&!feats.formations.includes(key))feats.formations.push(key);
  return feats;
}
