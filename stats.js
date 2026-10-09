// As estatísticas da carreira: o que o jogador fez em todas as runs, somado partida a partida e guardado entre elas.
// O que já era guardado continua onde estava: as cartas (partidas, vitórias e títulos de cada uma) no álbum, e o número
// de runs e de títulos na carreira. Aqui fica o resto, contado a partir do dia em que a contagem começou (`since`):
// vitórias por fase, rounds por lado, rivais, formações, agentes, confrontos e onde cada run acabou.
// É JSON puro. Um par é {n, w}: quantas vezes, e quantas delas vencidas.
import * as E from './engine.js?v=7b9b1b6e5a';
import {STAGES} from './campaign.js?v=7b9b1b6e5a';

// Where a run ended, from the best ending to the worst. `quit` is a run given up or replaced before its end.
export const OUTCOMES = ['champion','final','semis','quarters','groups','qualifier','quit'];
export const OUTCOME_NAMES = {champion:'Campeão',final:'Final',semis:'Semifinal',quarters:'Quartas de final',groups:'Fase de Grupos',qualifier:'Classificatória',quit:'Abandonada'};
// How many lines a list of the summary shows, and how many compositions of five agents are kept.
export const TOP = 8;
export const COMPS_MAX = 40;
const TIES = ['overall','perk','coin'];
const pair = ()=>({n:0,w:0});
const add = (book,key,won)=>{const each=book[key]??=pair();each.n++;if(won)each.w++;};
// The share won, as a whole percentage; nothing played has no share.
export const rate = each=>each&&each.n?Math.round(100*each.w/each.n):null;

const empty = today=>({v:1,since:today,runs:{free:{},daily:{}},matches:STAGES.map(pair),overtime:pair(),rounds:{atk:pair(),def:pair(),pistol:pair()},
  rivals:{},formations:{},agents:{},comps:{},duels:{mine:pair(),theirs:pair(),types:{},ties:Object.fromEntries(TIES.map(key=>[key,pair()]))},
  cards:{},perks:{},streak:{now:0,best:0}});

// What is saved is only trusted where it makes sense: whole counts, wins that fit in the games, and only cards, agents,
// formations, confrontations and bonuses that exist. Anything else is dropped, and a save of another shape starts over.
export function cleanStats(raw,{byId,today}) {
  const stats=empty(today),whole=n=>Number.isInteger(n)&&n>=0;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.v!==1)return stats;
  const good=each=>each&&whole(each.n)&&whole(each.w)&&each.w<=each.n,copy=each=>good(each)?{n:each.n,w:each.w}:pair();
  const book=(from,allowed)=>Object.fromEntries(Object.entries(from&&typeof from==='object'?from:{}).filter(([key,each])=>allowed(key)&&good(each)&&each.n>0).map(([key,each])=>[key,copy(each)]));
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw.since))stats.since=raw.since;
  for(const mode of ['free','daily'])for(const key of OUTCOMES){const n=raw.runs?.[mode]?.[key];if(whole(n)&&n>0)stats.runs[mode][key]=n;}
  if(Array.isArray(raw.matches))stats.matches=STAGES.map((_,i)=>copy(raw.matches[i]));
  stats.overtime=copy(raw.overtime);
  for(const key of Object.keys(stats.rounds))stats.rounds[key]=copy(raw.rounds?.[key]);
  stats.rivals=book(raw.rivals,name=>name.length>0&&name.length<=60);
  stats.formations=book(raw.formations,key=>E.FORMATIONS.some(f=>f.key===key));
  stats.agents=book(raw.agents,agent=>!!E.AGENTS[agent]);
  stats.comps=book(raw.comps,key=>{const agents=key.split('|');return agents.length===5&&agents.every(agent=>E.AGENTS[agent]);});
  stats.duels={mine:copy(raw.duels?.mine),theirs:copy(raw.duels?.theirs),types:book(raw.duels?.types,key=>!!E.EVENT_TYPES[key]),
    ties:Object.fromEntries(TIES.map(key=>[key,copy(raw.duels?.ties?.[key])]))};
  for(const [id,each] of Object.entries(raw.cards&&typeof raw.cards==='object'?raw.cards:{})){
    if(byId.has(id)&&each&&['k','d','a','dn','dw'].every(key=>whole(each[key]))&&each.dw<=each.dn)stats.cards[id]={k:each.k,d:each.d,a:each.a,dn:each.dn,dw:each.dw};
  }
  for(const [key,each] of Object.entries(raw.perks&&typeof raw.perks==='object'?raw.perks:{})){
    if(E.PERKS[key]&&each&&whole(each.n)&&each.n>0&&whole(each.t)&&each.t<=each.n)stats.perks[key]={n:each.n,t:each.t};
  }
  if(whole(raw.streak?.now)&&whole(raw.streak?.best)&&raw.streak.now<=raw.streak.best)stats.streak={now:raw.streak.now,best:raw.streak.best};
  return stats;
}

// The compositions of five agents are the one list that could grow without end: the least used go.
export function trimComps(stats) {
  const kept=Object.entries(stats.comps).sort(([,a],[,b])=>b.n-a.n||b.w-a.w).slice(0,COMPS_MAX);
  stats.comps=Object.fromEntries(kept);
}
// A match that was played, right after the campaign recorded it (`summary` is what recordMatch returned). A W.O. is not
// a match played and adds nothing. `match` is the match itself; without it only the result is counted.
export function recordMatch(stats,{run,match,summary}) {
  if(summary.forfeit)return stats;
  const entry=run.history.at(-1),won=summary.won;
  add(stats.matches,entry.stage,won);add(stats.rivals,entry.opponent,won);
  stats.streak.now=won?stats.streak.now+1:0;stats.streak.best=Math.max(stats.streak.best,stats.streak.now);
  if(!match?.teams)return stats;
  const lineup=match.teams[0].lineup,agents=lineup.map(slot=>slot.agent);
  add(stats.formations,E.composition(lineup).key,won);
  for(const agent of agents)add(stats.agents,agent,won);
  add(stats.comps,[...agents].sort().join('|'),won);
  if(Object.keys(stats.comps).length>COMPS_MAX)trimComps(stats);
  if(match.log.length>24)add({overtime:stats.overtime},'overtime',won);
  for(const round of match.log){
    add(stats.rounds,round.side==='Ataque'?'atk':'def',round.won);
    if(round.round===1||round.round===13)add(stats.rounds,'pistol',round.won);
    const event=round.event;
    if(!event?.contest)continue;
    add(stats.duels,event.by===0?'mine':'theirs',event.contest.won);
    add(stats.duels.types,event.type,event.contest.won);
    if(TIES.includes(event.contest.tiebreak))add(stats.duels.ties,event.contest.tiebreak,event.contest.won);
  }
  const went=E.matchStats(match);
  for(const p of match.teams[0].players){
    const card=stats.cards[p.id]??={k:0,d:0,a:0,dn:0,dw:0};
    card.k+=p.k;card.d+=p.d;card.a+=p.a;card.dn+=went[p.id]?.plays||0;card.dw+=went[p.id]?.playsWon||0;
  }
  return stats;
}
// Where a run ended. A run that is not over was given up or replaced by a new one.
export function outcomeOf(run) {
  if(run.result==='champion')return 'champion';
  if(run.status!=='over'||run.result!=='eliminated')return 'quit';
  return run.stage===0?'qualifier':run.stage===1?'groups':['quarters','semis','final'][Math.min(2,run.record[2].w)];
}
// A run that came to its end, whatever the end: where it stopped, and the bonuses its staff held.
export function recordRun(stats,run) {
  const book=stats.runs[run.daily?'daily':'free'],outcome=outcomeOf(run);
  book[outcome]=(book[outcome]||0)+1;
  for(const key of run.perks||[]){const each=stats.perks[key]??={n:0,t:0};each.n++;if(outcome==='champion')each.t++;}
  return stats;
}

// ---------- O resumo que a tela mostra ----------
const sum = (list,key)=>list.reduce((total,each)=>total+each[key],0);
// Matches played and won since always: every match fields five cards, and the album has counted each of them.
export function played(album) {
  const cards=Object.values(album);
  return {n:Math.round(sum(cards,'m')/5),w:Math.round(sum(cards,'w')/5)};
}
const ranked = (book,name)=>Object.entries(book).map(([key,each])=>({[name]:key,...each})).sort((a,b)=>b.n-a.n||b.w-a.w||String(a[name]).localeCompare(String(b[name]),'pt-BR'));
// Everything the statistics screen shows. The totals are the ones of always (the album and the career hold them since
// before this count existed); the rest covers what was played from `since` on, which the screen doesn't say.
export function overview(stats,{album,career,db}) {
  const fielded=Object.entries(album).filter(([id])=>db.byId.has(id)).map(([id,each])=>({player:db.byId.get(id),...each,...(stats.cards[id]||{})}));
  const totals={runs:career.runs||0,titles:career.titles||0,matches:Math.round(sum(fielded,'m')/5),wins:Math.round(sum(fielded,'w')/5)};
  const cards=[...fielded].sort((a,b)=>b.m-a.m||b.w-a.w||b.player.ovr-a.player.ovr||a.player.name.localeCompare(b.player.name,'pt-BR')).slice(0,TOP);
  const groups=new Map();
  for(const each of fielded){const team=groups.get(each.player.team)||{team:each.player.team,m:0,w:0,cards:0};team.m+=each.m;team.w+=each.w;team.cards++;groups.set(team.team,team);}
  const teams=[...groups.values()].sort((a,b)=>b.m-a.m||b.w-a.w||a.team.localeCompare(b.team,'pt-BR')).slice(0,TOP);
  const all={n:stats.duels.mine.n+stats.duels.theirs.n,w:stats.duels.mine.w+stats.duels.theirs.w},ties=Object.values(stats.duels.ties);
  const duelists=Object.entries(stats.cards).filter(([id,each])=>each.dw>0&&db.byId.has(id)).map(([id,each])=>({player:db.byId.get(id),dn:each.dn,dw:each.dw}))
    .sort((a,b)=>b.dw-a.dw||a.dn-b.dn||b.player.ovr-a.player.ovr);
  return {
    totals,
    outcomes:OUTCOMES.map(key=>({key,name:OUTCOME_NAMES[key],n:(stats.runs.free[key]||0)+(stats.runs.daily[key]||0)})),
    stages:STAGES.map((stage,i)=>({name:stage.name,...stats.matches[i]})),
    rounds:{...stats.rounds},overtime:{...stats.overtime},streak:stats.streak.best,
    cards,teams,rivals:ranked(stats.rivals,'team').slice(0,TOP),
    formations:ranked(stats.formations,'key').map(each=>({...each,name:E.FORMATIONS.find(f=>f.key===each.key).name})),
    agents:ranked(stats.agents,'agent').slice(0,TOP),
    comps:ranked(stats.comps,'key').slice(0,3).map(({key,...each})=>({agents:key.split('|'),...each})),
    perks:Object.entries(stats.perks).map(([key,each])=>({key,name:E.PERKS[key].name,...each})).sort((a,b)=>b.n-a.n||b.t-a.t||a.name.localeCompare(b.name,'pt-BR')).slice(0,TOP),
    duels:{all,mine:{...stats.duels.mine},theirs:{...stats.duels.theirs},
      types:Object.keys(E.EVENT_TYPES).map(key=>({key,label:E.EVENT_TYPES[key].label,...(stats.duels.types[key]||pair())})),
      attributes:{n:all.n-sum(ties,'n'),w:all.w-sum(ties,'w')},
      overall:{n:stats.duels.ties.overall.n+stats.duels.ties.perk.n,w:stats.duels.ties.overall.w+stats.duels.ties.perk.w},
      coin:{...stats.duels.ties.coin},best:duelists[0]||null}
  };
}
