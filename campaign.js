// A run do Univavá: fases, moedas, loja, contratos de agente e comissão técnica.
// O estado da run é JSON puro (ids e números), para poder ser salvo e retomado.
import * as E from './engine.js?v=7b9b1b6e5a';

export const START_COINS = 200;
export const MATCH_PAY = 100;
export const WIN_BONUS = 80;
export const STAGE_BONUS = 200;
// Winning right after a win pays a bonus that grows with the sequence: 20, 30, 40, 50, and 60 from the sixth win on.
export const STREAK_BONUS = 20;
export const STREAK_STEP = 10;
export const STREAK_MAX = 60;
export const streakBonus = streak=>streak<2?0:Math.min(STREAK_MAX,STREAK_BONUS+STREAK_STEP*(streak-2));
export const AGENT_PRICE = 100;
export const REROLL_COST = 40;
export const ROSTER_MAX = 8;
// The advantage pack: three staff bonuses the team doesn't have, to keep one. There is no limit to how many bonuses a
// team holds; what holds it back is the price, which goes up with every pack bought in the run.
export const PERK_PACK_COST = 300;
export const PERK_PACK_STEP = 100;
// targets: a força pedida ao adversário em cada jogo da fase (veja rivalStrength e buildOpponent no motor: o nível em
// que ele joga e as cartas que tem). market: faixa de overall à venda.
export const STAGES = [
  {key:'qualifier',name:'Classificatória',wins:4,losses:2,targets:[81.5,82.2,82.8,83.4,84],market:[79,85]},
  {key:'groups',name:'Fase de Grupos',wins:3,losses:3,targets:[85,85.6,86.2,86.8,87.4],market:[81,87]},
  {key:'playoffs',name:'Playoffs',wins:3,losses:1,targets:[88.1,89.1,90.5],market:[83,90],labels:['Quartas de final','Semifinal','Final']}
];
export const PACKS = [
  {key:'calouro',name:'Pacote Calouro',cost:160,range:[77,83]},
  {key:'veterano',name:'Pacote Veterano',cost:260,range:[81,86]},
  {key:'lenda',name:'Pacote Lenda',cost:460,range:[84,91]}
];
// The role pack: one per shop, cards of a single role in the overall range of the stage's market. Its price goes up
// with the stage, always above what its best card sells for.
export const ROLE_PACK_COST = [220,300,400];
const ROLE_PLURAL = {Duelista:'Duelistas',Iniciador:'Iniciadores',Controlador:'Controladores',Sentinela:'Sentinelas'};
// The role pack goes through the roles in this order, always the same: one role for each shop, and the next one as
// soon as a role pack is bought. After the last comes the first again.
export const ROLE_ORDER = ['Duelista','Sentinela','Iniciador','Controlador'];
// The role after the one on the shelf (the first of the order when there is no shelf yet). A run saved when the role
// was drawn goes on from the role it had.
const nextRole = run=>ROLE_ORDER[(ROLE_ORDER.indexOf(run.shop?.role)+1)%ROLE_ORDER.length];
// How rarely a rare staff bonus is offered, against 1 for the others.
const RARE_WEIGHT = .35;


// ---------- A escada de dificuldade ----------
// Ten steps a run can be played on, each adding one rule to the ones before it. A run carries its step in
// run.ascension; a run without one is the game as it is, and so is every Desafio do dia, which has to be the same run
// for everybody. The steps go from the rule that weighs least on the result to the one that weighs most, as measured
// with each rule alone in scripts/simulate.mjs, which is also where the numbers behind the rules are tuned.
// Stacked rules weigh more than the sum of each alone, and the ones that cut into the chance of each game (the ones
// in reserve below) most of all: that is why the ladder is made of light rules and ends on a single heavy one.
// The number behind each rule that has one. They are tuned with the simulator, which can also try other numbers
// without touching this file; the texts of the rules are written from them.
export const LADDER_VALUES = {market:3,coins:150,streak:50,rivals:.1,contracts:6,stage:170,pay:70,prices:1.05,roster:7,plays:2,groups:2};
const V = LADDER_VALUES;
export const LADDER = [
  {key:'market',text:`O mercado mostra ${V.market} cartas em vez de 4`},
  {key:'coins',text:`A run começa com ${V.coins} moedas em vez de ${START_COINS}`},
  {key:'streak',text:`Vitórias seguidas pagam no máximo ${V.streak} moedas em vez de ${STREAK_MAX}`},
  {key:'rivals',text:'Os rivais de cada jogo vêm mais fortes'},
  {key:'contracts',text:`${V.contracts} contratos de agente no começo em vez de ${E.ROLES.length*2}`},
  {key:'stage',text:`Fase vencida paga ${V.stage} moedas em vez de ${STAGE_BONUS}`},
  {key:'pay',text:`Vitória paga ${V.pay} moedas em vez de ${WIN_BONUS}`},
  {key:'prices',text:`Pacotes, mercado e contratos custam ${Math.round((V.prices-1)*100)}% mais`},
  {key:'roster',text:`Elenco de no máximo ${V.roster} cartas em vez de ${ROSTER_MAX}`},
  {key:'final',text:'A final é em dois jogos: é preciso vencer os dois'}
];
// Rules that are written and tested but not on the ladder: each weighs too much on top of the others for the last
// step to stay winnable. The simulator can put them on a ladder to weigh them (--escada, --regras).
export const SPARE_RULES = [
  {key:'plays',text:`Você tem ${V.plays} Jogadas de Efeito por partida em vez de ${E.PLAYS}`},
  {key:'staff',text:'Sem bônus depois do draft; o primeiro vem ao vencer a classificatória'},
  {key:'groups',text:`A Fase de Grupos cai com ${V.groups} derrotas em vez de ${STAGES[1].losses}`}
];
// The rules a run is played under: the ones of its step and of every step before it.
export const rulesOf = run=>LADDER.slice(0,run?.ascension||0);
const on = (run,key)=>rulesOf(run).some(step=>step.key===key);
// The stages as this run plays them.
export const stagesOf = run=>STAGES.map(stage=>
  stage.key==='groups'&&on(run,'groups')?{...stage,losses:V.groups}
  :stage.key==='playoffs'&&on(run,'final')?{...stage,wins:stage.wins+1,targets:[...stage.targets,stage.targets.at(-1)],labels:[...stage.labels.slice(0,-1),'Final · Jogo 1','Final · Jogo 2']}
  :stage);
export const winBonus = run=>on(run,'pay')?V.pay:WIN_BONUS;
export const stageBonus = run=>on(run,'stage')?V.stage:STAGE_BONUS;
export const rosterMax = run=>on(run,'roster')?V.roster:ROSTER_MAX;
// What something costs in this run's shop, from its price in the game as it is.
const priced = (run,cost)=>on(run,'prices')?Math.round(cost*V.prices/10)*10:cost;
export const packsOf = run=>PACKS.map(pack=>on(run,'prices')?{...pack,cost:priced(run,pack.cost)}:pack);
// An elimination game: every one of the Playoffs and, in the other stages, the one the team plays with one defeat
// left, when losing it ends the run (a Repescagem in hand changes nothing here). It is where the Psicólogo acts.
export const mustWin = run=>run.record[run.stage].l+1>=stagesOf(run)[run.stage].losses;
// The strength asked of the rival of the next game.
export function rivalTarget(run) {
  const stage=stagesOf(run)[run.stage],record=run.record[run.stage];
  return stage.targets[Math.min(record.w+record.l,stage.targets.length-1)]+(on(run,'rivals')?V.rivals:0);
}

// ---------- Períodos ----------
// What the player sees of the ladder: its steps are the períodos of the traditional mode. A title in that mode opens
// the 1st período, and a title on a período opens the one after it. The Desafio do dia opens nothing.
export const PERIODS = LADDER.length;
// A run without any of them has a name too: the one of who has not got into the university yet.
export const periodName = step=>step?`${step}º período`:'Vestibulando';
// The períodos a career holds: `period`, the highest one open, and `cleared`, the highest one won. Whatever is saved
// is only trusted when it makes sense, and a career with a title from before the períodos existed has the 1st open.
export function periodsOf(career) {
  const whole=value=>Number.isInteger(value)&&value>=0;
  const period=whole(career?.period)?Math.min(PERIODS,career.period):career?.titles>0?1:0;
  return {period,cleared:whole(career?.cleared)?Math.min(period,career.cleared):0};
}
// What a finished run leaves: the same two numbers, and `opened`, the período this run has just opened (0 for none).
export function periodsAfter(career,run) {
  const {period,cleared}=periodsOf(career);
  if(run.result!=='champion'||run.daily)return {period,cleared,opened:0};
  const won=run.ascension||0,next=Math.min(PERIODS,won+1);
  return {period:Math.max(period,next),cleared:Math.max(cleared,won),opened:next>period?next:0};
}
// Which run this is, as the results name it.
export const modeLine = run=>run.daily?`Desafio #${dailyNumber(run.daily)} · ${dayLabel(run.daily)}`:run.ascension?`Modo tradicional · ${periodName(run.ascension)}`:'Modo tradicional';

export function indexDb(db) { return {...db,byId:new Map(db.players.map(p=>[p.id,p]))}; }
// Every random decision of the run draws from its own stream, derived from the seed and a counter,
// so a saved run continues exactly as it would have.
function roll(run) { return E.rng((run.seed+Math.imul(++run.rolls,0x9E3779B1))>>>0); }
const round10 = value=>Math.round(value/10)*10;
const PV = E.PERK_VALUES;
const discount = run=>run.perks.includes('negociador')?1-PV.negociador/100:1;
// A contract is the one price that may end in 5: with the Negociador it costs exactly what the discount says.
export const agentPrice = run=>priced(run,Math.round(AGENT_PRICE*discount(run)/5)*5);
export const playerPrice = (run,player)=>priced(run,round10((30+(player.ovr-72)**2*2)*discount(run)));
export const sellValue = player=>round10(playerPrice({perks:[]},player)/2);
export const rosterIds = run=>[...run.lineup.map(s=>s.id),...run.bench];
export const lineupSlots = (run,db)=>run.lineup.map(s=>({player:db.byId.get(s.id),agent:s.agent}));
export const opponentLineup = (run,db)=>run.opponent.ids.map((id,i)=>({player:db.byId.get(id),agent:run.opponent.agents[i]}));
export const lineupError = (run,db)=>E.validLineup(lineupSlots(run,db),run.pool);
// Any card can be sold, so the team may be left with fewer than five starters. It can't play like that: see forfeitMatch.
export const shortHanded = run=>run.lineup.length<5;
export function matchLabel(stage,game,run) {
  const labels=stagesOf(run)[2].labels;
  return stage===0?`Classificatória · Jogo ${game+1}`:stage===1?`Grupos · Jogo ${game+1}`:labels[Math.min(game,labels.length-1)];
}
export function nextMatchLabel(run) { const r=run.record[run.stage];return matchLabel(run.stage,r.w+r.l,run); }
// While a match is being played the roster and the shop are frozen: the match must end the way it started.
function idle(run) { if(run.live)throw new Error('Há uma partida em andamento'); }
function pay(run,cost) { if(run.coins<cost)throw new Error('Moedas insuficientes');run.coins-=cost; }
function needSeat(run) { if(rosterIds(run).length>=rosterMax(run))throw new Error(`Elenco cheio (${rosterMax(run)}). Libere uma vaga vendendo um jogador`); }
// A new card goes to the bench, unless a starting place is open: then it starts, on the best free agent under contract.
function seat(run,db,id) {
  if(!shortHanded(run))return run.bench.push(id);
  const free=run.pool.filter(agent=>!run.lineup.some(s=>s.agent===agent));
  run.lineup.push({id,agent:E.assignAgents([db.byId.get(id)],free)[0].agent});
}
function distinct(list,count,random,weight) {
  const picked=[];
  while(picked.length<Math.min(count,list.length))picked.push(E.weightedSample(list.filter(item=>!picked.includes(item)),random,weight));
  return picked;
}

// ---------- Início e draft ----------
// `daily` is the day (see dayKey) of the Desafio do dia this run belongs to; a run of the traditional mode has none.
// `ascension` is the step of the ladder the run is played on (see LADDER); the Desafio do dia never has one.
export function createRun(db,seed,{daily,ascension=0}={}) {
  if(!Number.isInteger(ascension)||ascension<0||ascension>LADDER.length)throw new Error('Este degrau não existe');
  const run={version:3,seed:seed>>>0,rolls:0,status:'draft',pool:[],lineup:[],bench:[],coins:START_COINS,stage:0,
    record:STAGES.map(()=>({w:0,l:0})),history:[],usedTeams:[],perks:[],perkOffer:null,draft:{picked:[],choices:[],plan:[]},
    shop:null,pack:null,opponent:null,matchSeed:0,live:null,result:null};
  if(daily)run.daily=daily;
  else if(ascension)run.ascension=ascension;
  if(on(run,'coins'))run.coins=V.coins;
  run.pool=E.startingPool(db.players,roll(run),on(run,'contracts')?V.contracts:undefined);
  run.draft.plan=E.draftPlan(roll(run));
  offerDraft(run,db);
  return run;
}
function offerDraft(run,db) {
  const picked=run.draft.picked.map(id=>db.byId.get(id));
  run.draft.choices=E.draftChoices(db.players,picked,roll(run),run.draft.plan[picked.length]).map(p=>p.id);
}
export function draftPick(run,db,id) {
  if(run.status!=='draft'||!run.draft.choices.includes(id))throw new Error('Escolha uma das cartas oferecidas');
  run.draft.picked.push(id);
  if(run.draft.picked.length<6)return offerDraft(run,db);
  const picked=run.draft.picked.map(id=>db.byId.get(id));
  run.lineup=E.assignAgents(picked.slice(0,5),run.pool).map(s=>({id:s.player.id,agent:s.agent}));
  run.bench=[picked[5].id];run.draft.choices=[];
  if(on(run,'staff'))prepareHub(run,db);else offerPerk(run,db);
}

// ---------- Comissão técnica ----------
// The bonuses the team can still get. A Repescagem already used is gone for the rest of the run.
const perksLeft = run=>Object.keys(E.PERKS).filter(key=>!run.perks.includes(key)&&!(key==='repescagem'&&run.forgiven));
const drawPerks = run=>distinct(perksLeft(run),3,roll(run),key=>E.PERKS[key].rare?RARE_WEIGHT:1);
// The bonus the campaign gives: one after the draft, one after every stage won. A team that already has them all
// goes straight to its next match.
function offerPerk(run,db) {
  if(!perksLeft(run).length)return prepareHub(run,db);
  run.perkOffer=drawPerks(run);
  run.status='perk';
}
// What the next advantage pack costs in this run, or null when there is no bonus left to offer.
export const perkPackCost = run=>perksLeft(run).length?priced(run,PERK_PACK_COST+PERK_PACK_STEP*(run.perkPacks||0)):null;
// Buys an advantage pack in the shop. The choice among its three bonuses is made on the staff screen, and then the
// run is back in the same shop, before the same match (run.perkBought is what tells this choice from the campaign's).
export function openPerkPack(run,db) {
  idle(run);
  if(run.status==='perk')throw new Error('Escolha um bônus oferecido');
  if(run.status!=='hub')throw new Error('A loja está fechada');
  const cost=perkPackCost(run);
  if(cost===null)throw new Error('Seu time já tem todos os bônus');
  pay(run,cost);
  run.perkPacks=(run.perkPacks||0)+1;
  run.perkOffer=drawPerks(run);run.perkBought=true;run.status='perk';
}
export function choosePerk(run,db,key) {
  if(run.status!=='perk'||!run.perkOffer.includes(key))throw new Error('Escolha um bônus oferecido');
  run.perks.push(key);
  if(!run.perkBought)return prepareHub(run,db);
  delete run.perkBought;run.perkOffer=null;run.status='hub';
}

// ---------- Próximo jogo e loja ----------
function prepareHub(run,db) {
  const target=rivalTarget(run);
  const rival=E.buildOpponent(db.players,{target,excludeIds:rosterIds(run),excludeTeams:run.usedTeams},roll(run));
  run.opponent={team:rival.name,rating:rival.rating,level:rival.level,strength:rival.strength,mains:rival.mains,
    ids:rival.lineup.map(s=>s.player.id),agents:rival.lineup.map(s=>s.agent)};
  run.matchSeed=Math.floor(roll(run)()*4294967296);
  // Every match brings its own shop: the offers, and the role pack of the next role of the order. (The draw that
  // used to pick the role is still made and thrown away, so that every other draw of a run stays where it was.)
  const role=nextRole(run);
  run.shop={...makeShop(run,db),role};roll(run);run.perkOffer=null;run.status='hub';
}
function makeShop(run,db) {
  const random=roll(run),[lo,hi]=STAGES[run.stage].market;
  // The next opponent's cards stay off the shelf so you never face a player you are fielding.
  const taken=new Set([...rosterIds(run),...run.opponent.ids]);
  const market=distinct(db.players.filter(p=>!taken.has(p.id)&&p.ovr>=lo&&p.ovr<=hi),(on(run,'market')?V.market:4)+(run.perks.includes('vitrine')?PV.vitrine:0),random);
  const comfort=new Set(rosterIds(run).map(id=>db.byId.get(id).comfort));
  const agents=distinct(Object.keys(E.AGENTS).filter(agent=>!run.pool.includes(agent)),3,random,agent=>comfort.has(agent)?4:1);
  return {market:market.map(p=>({id:p.id,sold:false})),agents:agents.map(agent=>({agent,sold:false}))};
}
// What changing the offers costs right now. With Contatos the first changes of each shop are free. A shop counts its
// changes in `rerolls`; one saved when a single change was free only says `rerolled`, and that is one change made.
const rerolls = run=>run.shop.rerolls??(run.shop.rerolled?1:0);
export const rerollCost = run=>run.perks.includes('contatos')&&rerolls(run)<PV.contatos?0:REROLL_COST;
// New market and new contracts. The role pack on the shelf is not an offer: it stays.
export function rerollShop(run,db) { idle(run);pay(run,rerollCost(run));run.shop={...makeShop(run,db),role:run.shop.role,rerolls:rerolls(run)+1}; }
export function buyAgent(run,db,agent) {
  idle(run);
  const offer=run.shop.agents.find(o=>o.agent===agent&&!o.sold);
  if(!offer)throw new Error('Este contrato não está em oferta');
  pay(run,agentPrice(run));run.pool.push(agent);offer.sold=true;
}
export function buyPlayer(run,db,id) {
  idle(run);
  const place=run.shop.market.findIndex(o=>o.id===id&&!o.sold);
  if(place<0)throw new Error('Este jogador não está em oferta');
  needSeat(run);pay(run,playerPrice(run,db.byId.get(id)));
  seat(run,db,id);
  // The place on the shelf doesn't stay empty: another card of the stage's range takes it. Only if there is none left
  // does the offer stay there, marked as sold.
  const taken=new Set([...rosterIds(run),...run.opponent.ids,...run.shop.market.map(o=>o.id)]),[lo,hi]=STAGES[run.stage].market;
  const [fresh]=distinct(db.players.filter(p=>!taken.has(p.id)&&p.ovr>=lo&&p.ovr<=hi),1,roll(run));
  run.shop.market[place]=fresh?{id:fresh.id,sold:false}:{id,sold:true};
}
export function sellPlayer(run,db,id) {
  idle(run);
  const ids=rosterIds(run);
  if(!ids.includes(id))throw new Error('Este jogador não está no seu elenco');
  // A sold starter is replaced by the first reserve, who takes over his agent. With nobody on the bench the place stays open.
  const slot=run.lineup.find(s=>s.id===id);
  if(!slot)run.bench.splice(run.bench.indexOf(id),1);
  else if(run.bench.length)slot.id=run.bench.shift();
  else run.lineup.splice(run.lineup.indexOf(slot),1);
  run.coins+=sellValue(db.byId.get(id));
  if(run.packed)run.packed=run.packed.filter(each=>each!==id);
}
// The role pack on this shop's shelf, or null when the shop has none (a run saved before role packs existed).
export function rolePack(run) {
  const role=run.shop?.role;
  return role?{key:'funcao',role,name:`Pacote de ${ROLE_PLURAL[role]}`,cost:priced(run,ROLE_PACK_COST[run.stage]),range:[...STAGES[run.stage].market]}:null;
}
// What a pack key stands for in this run's shop: one of the three packs by overall, or the role pack.
export const packFor = (run,key)=>key==='funcao'?rolePack(run):packsOf(run).find(p=>p.key===key)||null;
// The name of a pack already opened (run.pack).
export const packName = pack=>pack.role?`Pacote de ${ROLE_PLURAL[pack.role]}`:PACKS.find(p=>p.key===pack.key).name;
export function openPack(run,db,key) {
  idle(run);
  const pack=packFor(run,key);
  if(!pack)throw new Error('Pacote desconhecido');
  if(run.pack)throw new Error('Escolha uma carta do pacote que já está aberto');
  needSeat(run);pay(run,pack.cost);
  const taken=new Set([...rosterIds(run),...run.opponent.ids]),[lo,hi]=pack.range;
  const fits=p=>!taken.has(p.id)&&p.ovr>=lo&&p.ovr<=hi&&(!pack.role||E.draftRole(p)===pack.role);
  const cards=distinct(db.players.filter(fits),3+(run.perks.includes('olheiro')?PV.olheiro:0),roll(run));
  run.pack={key,cards:cards.map(p=>p.id),...(pack.role?{role:pack.role}:{})};
  // The role pack doesn't leave the shelf: it comes back as the next role of the order.
  if(pack.role){run.shop.role=nextRole(run);roll(run);}
  return cards;
}
export function takePackCard(run,db,id) {
  if(!run.pack?.cards.includes(id))throw new Error('Esta carta não está no pacote aberto');
  seat(run,db,id);run.pack=null;
  // The cards taken from packs since the last match: one of them sold before the next match is a conquest.
  (run.packed??=[]).push(id);
}

// ---------- Escalação ----------
export function setAgent(run,db,playerId,agent) {
  idle(run);
  const slot=run.lineup.find(s=>s.id===playerId);
  if(!slot)throw new Error('Só titulares usam agente');
  if(!run.pool.includes(agent))throw new Error(`${agent} não tem contrato com a sua equipe`);
  const holder=run.lineup.find(s=>s.agent===agent);
  if(holder)holder.agent=slot.agent;
  slot.agent=agent;
}
export function swapPlayers(run,db,a,b) {
  idle(run);
  const ia=run.lineup.findIndex(s=>s.id===a),ib=run.lineup.findIndex(s=>s.id===b);
  if(ia>=0&&ib>=0){[run.lineup[ia],run.lineup[ib]]=[run.lineup[ib],run.lineup[ia]];return;}
  const seat=Math.max(ia,ib),incoming=ia>=0?b:a,place=run.bench.indexOf(incoming);
  if(seat<0){const pa=run.bench.indexOf(a),pb=run.bench.indexOf(b);if(pa<0||pb<0)throw new Error('Jogador fora do elenco');[run.bench[pa],run.bench[pb]]=[b,a];return;}
  if(place<0)throw new Error('Jogador fora do elenco');
  // The newcomer takes their comfort agent when the contract exists and nobody else is on it; otherwise the vacated one.
  const comfort=db.byId.get(incoming).comfort,free=run.pool.includes(comfort)&&!run.lineup.some((s,i)=>i!==seat&&s.agent===comfort);
  run.bench[place]=run.lineup[seat].id;
  run.lineup[seat]={id:incoming,agent:free?comfort:run.lineup[seat].agent};
}

// ---------- Partidas e fases ----------
// The rules a round is played under have a number, and a match in progress carries the one it was started with:
// replaying it under other rules (abilities and ultimates came with 2; the points of the ultimate going back to zero
// at the side swap, and no ultimates in overtime, with 3) would give another match with the same choices, so such a
// match is not continued. It starts over. The numbers of the staff bonuses, when they were rebalanced, came with 4.
export const MATCH_RULES = 4;
export const sameRules = live=>live?.rules===MATCH_RULES;
export function beginMatch(run,db) {
  const error=run.status!=='hub'?'Nenhuma partida preparada':lineupError(run,db);
  if(error)throw new Error(error);
  // run.live is all that is saved of a match in progress: the rounds in which you called a Jogada de Efeito, the
  // players you sent to each confrontation and how many rounds were already resolved. The match is fully determined by
  // its seed and those decisions, so replaying them rebuilds it exactly. That is what makes a reload pointless: the same
  // match comes back, with the same plays already spent and the same choices already made.
  run.live??={calls:[],picks:[],rounds:0,rules:MATCH_RULES};
  const match=E.createMatch({lineup:lineupSlots(run,db),opponent:{name:run.opponent.team,lineup:opponentLineup(run,db)},seed:run.matchSeed,perks:run.perks,ownPlays:on(run,'plays')?V.plays:undefined,decisive:mustWin(run)});
  let used=0;
  while(!match.over){
    if(!match.pending&&run.live.calls.includes(match.round))E.callPlay(match);
    if(match.pending){if(used<run.live.picks.length)E.resolveEvent(match,run.live.picks[used++]);else break;}
    else if(match.log.length<run.live.rounds)E.advanceRound(match);
    else break;
  }
  return match;
}
// Your Jogada de Efeito on the round about to be played. It is recorded at once: once the confrontation is on the
// table, closing the page neither gives the play back nor draws another one.
export function callPlay(run,match) {
  const event=E.callPlay(match);
  run.live.calls.push(event.round);
  return event;
}
// The player sent to a confrontation. Recorded at once too, so it stands even if the page is closed before the round ends.
export function pickActor(run,match,id) {
  const record=E.resolveEvent(match,id);
  run.live.picks.push(id);
  return record;
}
export function roundSeen(run,match) { run.live.rounds=match.log.length; }
// A team with fewer than five starters can't take the field: the match is lost without being played, and pays nothing.
export function forfeitMatch(run,db) {
  idle(run);
  if(run.status!=='hub')throw new Error('Nenhuma partida preparada');
  if(!shortHanded(run))throw new Error('O time está completo: a partida precisa ser jogada');
  return recordMatch(run,db,{score:[0,13],forfeit:true});
}
export function recordMatch(run,db,match) {
  if(run.status==='over')throw new Error('A run já foi encerrada');
  if(run.status!=='hub')throw new Error('Nenhuma partida preparada');
  const won=match.score[0]>match.score[1],stage=stagesOf(run)[run.stage],record=run.record[run.stage],forfeit=!!match.forfeit;
  const label=matchLabel(run.stage,record.w+record.l,run);
  run.packed=[];
  if(won)record.w++;else record.l++;
  const played=forfeit?0:MATCH_PAY+(run.perks.includes('patrocinio')?PV.patrocinio:0);
  // Wins in a row, this one included. The sequence carries over from one stage to the next.
  let streak=0;
  if(won){streak=1;for(let i=run.history.length-1;i>=0&&run.history[i].won;i--)streak++;}
  const streakCoins=on(run,'streak')?Math.min(V.streak,streakBonus(streak)):streakBonus(streak);
  let coins=played+(won?winBonus(run)+(run.perks.includes('bicho')?PV.bicho:0):0)+streakCoins,outcome='continue',spare=0,forgiven=false;
  if(record.l>=stage.losses){
    // Repescagem: the first defeat that would end the run is played, paid and remembered, but doesn't count. The
    // bonus is spent with it and leaves the staff. It doesn't hold in the final (in either game of a final in two).
    if(run.perks.includes('repescagem')&&!run.forgiven&&!label.startsWith('Final')){
      run.forgiven=forgiven=true;record.l--;
      run.perks=run.perks.filter(key=>key!=='repescagem');
    }
    else outcome='eliminated';
  }
  else if(record.w>=stage.wins)outcome=run.stage===STAGES.length-1?'champion':'advanced';
  if(outcome==='advanced'){
    // A stage fits wins+losses-1 games. Winning it early pays the games left unplayed. Each one also pays the price
    // of a new set of offers, because a game that is not played is a visit to the shop that never happens.
    spare=(stage.wins+stage.losses-1-record.w-record.l)*(played+REROLL_COST);
    coins+=stageBonus(run)+spare;
  }
  // What each starter did in a match that was actually played, added up over the run.
  if(match.teams){
    run.tally??={};
    for(const p of match.teams[0].players){const sum=run.tally[p.id]??={m:0,k:0,d:0,a:0};sum.m++;sum.k+=p.k;sum.d+=p.d;sum.a+=p.a;}
  }
  run.coins+=coins;run.live=null;run.usedTeams.push(run.opponent.team);
  run.history.push({stage:run.stage,label,opponent:run.opponent.team,score:[...match.score],won,coins,...(forfeit?{forfeit}:{}),...(forgiven?{forgiven}:{})});
  if(outcome==='eliminated'||outcome==='champion'){run.status='over';run.result=outcome;run.opponent=null;run.shop=null;run.pack=null;}
  else if(outcome==='advanced'){run.stage++;offerPerk(run,db);}
  else prepareHub(run,db);
  return {won,coins,outcome,spare,streak,streakCoins,forfeit,forgiven};
}

// Giving up: the run ends where it stands. Used to drop a Desafio do dia that won't be finished.
export function abandon(run) {
  if(run.status==='over')throw new Error('A run já foi encerrada');
  Object.assign(run,{status:'over',result:'abandoned',live:null,opponent:null,shop:null,pack:null,perkOffer:null});
}

// ---------- Desafio do dia ----------
// One run a day, the same for everybody: the day picks the seed, and the seed picks contracts, draft, bonuses, rivals
// and shops. The day turns at midnight in Brasília, wherever the player is.
const DAILY_FIRST = '2026-10-06';
export function dayKey(date=new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function dailySeed(day) {
  let hash=0x811c9dc5;
  for(const ch of 'univava-draft:'+day){hash^=ch.charCodeAt(0);hash=Math.imul(hash,0x01000193);}
  return hash>>>0;
}
export const dailyNumber = day=>Math.round((Date.parse(day+'T00:00:00Z')-Date.parse(DAILY_FIRST+'T00:00:00Z'))/86400000)+1;
export const dayLabel = day=>day.split('-').reverse().join('/');
// How far a run went, as the end of a sentence: "campeão do Univavá", "caiu na semifinal", "em andamento nos playoffs".
export function resultLine(run) {
  if(run.result==='champion')return 'campeão do Univavá';
  const where=['na classificatória','na fase de grupos','nos playoffs'][run.stage];
  if(run.status!=='over')return `em andamento ${where}`;
  if(run.result==='abandoned')return `desistiu ${where}`;
  if(run.stage<2)return `caiu ${where}`;
  const last=run.history.at(-1)?.label;
  // the final is one game, or two on the período that plays it twice
  return last?.startsWith('Final')?'vice-campeão':last==='Semifinal'?'caiu na semifinal':'caiu nas quartas de final';
}
// The result of a run as a few lines to paste anywhere: which challenge, how far the team went, every match as a
// square (one group of squares per stage) and the totals.
export function shareText(run,team) {
  const wins=run.history.filter(h=>h.won).length,diff=run.history.reduce((sum,h)=>sum+h.score[0]-h.score[1],0);
  const squares=STAGES.map((_,stage)=>run.history.filter(h=>h.stage===stage).map(h=>h.won?'🟩':'🟥').join('')).filter(Boolean).join(' ');
  return [`Univavá Draft · ${modeLine(run)}`,
    `${team||'Seu time'}: ${resultLine(run)}`,squares,
    `${wins} V · ${run.history.length-wins} D · saldo de rounds ${diff>0?'+':''}${diff}`].join('\n');
}
