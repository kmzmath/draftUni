// Regras puras do jogo: draft, sinergia, formação e simulação da partida. Sem DOM.
import {ABILITIES,buyAbilities,utilityCost,ultValue} from './abilities.js?v=ddb9ffb608';
export const ROLES = ['Duelista','Iniciador','Controlador','Sentinela'];
export const AGENTS = Object.fromEntries(Object.entries({
  Duelista:['Jett','Phoenix','Raze','Neon','Reyna','Yoru','Iso','Waylay'],
  Iniciador:['Sova','Breach','Skye','KAY/O','Fade','Gekko','Tejo'],
  Controlador:['Omen','Viper','Brimstone','Astra','Harbor','Clove','Miks'],
  Sentinela:['Killjoy','Cypher','Sage','Chamber','Deadlock','Vyse','Veto']
}).flatMap(([role,names])=>names.map(name=>[name,role])));
export const STAT_NAMES = {acs:'ACS',kast:'KAST',kpr:'KPR',mpr:'MPR',apr:'APR',swing:'SWING'};
export const POOL_SIZE = 8;
// Cards with a real photo are drawn more often: 18% of the base, about 25% of what a run offers.
export const PHOTO_WEIGHT = 1.6;
export const POINTS_PER_OVR = 2;

export const PLAYS = 3;
// The number behind each staff bonus that has one. They are tuned with the simulator, which can also try other numbers
// without touching this file (scripts/simulate.mjs, --bonus=pistoleiros:10), and the texts of the bonuses are written
// from them. olheiro, vitrine and quarta_jogada are what the bonus adds (cards, plays); armeiro, the credits on top of
// the 800 a half starts with; negociador, the discount in percent; viradaGap, how far behind the bonus starts to act;
// baseCount, how many starters get the bonus (its key is still `base`, from when it was called Aposta na base, so that
// a saved run keeps it); contatos, the free changes of offers of each shop; guerreirosRate, the points of chance for
// each point of effective overall the rival has over yours, and guerreiros, the most they add up to; trader, the
// discount in percent on the packs of cards, and traderSell, how much more, in percent, a player who has played for
// the team sells for.
// These are the numbers of the rebalance: each bonus was played alone through thousands of runs and compared with a
// run without any (the third argument of the simulator), and the ones that weighed too much or too little were moved.
export const PERK_VALUES = {polivalencia:3,entrosamento:1,pistoleiros:12,sangue_frio:2,segundo_folego:3,virada:8,viradaGap:2,patrocinio:30,olheiro:1,
  negociador:35,armeiro:400,caixa:400,capitao:3,base:1,baseCount:3,especialistas:2,equilibrio:2,vitrine:4,contatos:2,bicho:40,quarta_jogada:1,psicologo:2,guerreiros:2,guerreirosRate:1,trader:10,traderSell:10};
const PV = PERK_VALUES;
const dots = n=>String(n).replace(/\B(?=(\d{3})+$)/g,'.');
// The names and the texts are the user's; a number that comes from the table is written from it.
const WORDS = ['','A primeira troca','As duas primeiras trocas','As três primeiras trocas'];
export const PERKS = {
  polivalencia:{name:'Elenco polivalente',text:PV.polivalencia>=3?'Seus jogadores não perdem mais overall por jogar em outra função ou com outros agentes'
    :`Penalidades de função caem ${PV.polivalencia} ${PV.polivalencia>1?'pontos':'ponto'}: secundária deixa de custar, fora de função custa -${3-PV.polivalencia}`},
  entrosamento:{name:'Entrosamento',text:`A sinergia de equipe rende +${PV.entrosamento} a mais para cada jogador da equipe`},
  pistoleiros:{name:'Pistoleiros',text:`+${PV.pistoleiros} pontos de chance nos rounds de pistola (1 e 13)`},
  sangue_frio:{name:'Sangue frio',text:`Nos confrontos empatados, +${PV.sangue_frio} de overall só para o desempate`},
  segundo_folego:{name:'Segundo fôlego',text:`Os titulares voltam a ficar disponíveis depois de ${PV.segundo_folego} usos, não 5`},
  virada:{name:'Mentalidade de virada',text:`+${PV.virada} pontos de chance enquanto estiver ${PV.viradaGap} ou mais rounds atrás`},
  patrocinio:{name:'Patrocínio da atlética',text:`+${PV.patrocinio} moedas em cada partida disputada`},
  olheiro:{name:'Olheiro',text:`Cada pacote revela ${3+PV.olheiro} cartas em vez de 3`},
  negociador:{name:'Negociador',text:`Jogadores do mercado e contratos de agente custam ${PV.negociador}% menos`},
  jogada_ensaiada:{name:'Jogada ensaiada',text:'As Jogadas de Efeito do rival também sorteiam um confronto de afinidade da sua formação'},
  armeiro:{name:'Armeiro',text:`Seus jogadores começam cada metade com ${dots(800+PV.armeiro)} créditos e entram de colete nos rounds de pistola`},
  caixa:{name:'Caixa de emergência',text:`Quando seu time perde um round, seus jogadores ganham +${PV.caixa} créditos bônus no próximo round`},
  capitao:{name:'Capitão',text:`O titular de maior overall rende +${PV.capitao}`},
  base:{name:'Reforço',text:`Seus ${PV.baseCount} titulares de menor overall rendem +${PV.base}`},
  especialistas:{name:'Especialistas',text:`No agente de conforto, o jogador rende +${PV.especialistas} em vez de +1`},
  vitrine:{name:'Vitrine',text:`O mercado mostra ${4+PV.vitrine} cartas em vez de 4`},
  contatos:{name:'Contatos',text:`${WORDS[PV.contatos]||`As ${PV.contatos} primeiras trocas`} de ofertas de cada loja ${PV.contatos>1?'são':'é'} grátis`},
  bicho:{name:'Bicho',text:`+${PV.bicho} moedas por vitória`},
  psicologo:{name:'Psicólogo',text:`+${PV.psicologo} pontos de chance nos jogos eliminatórios`},
  guerreiros:{name:'Time de guerreiros',text:`+${PV.guerreirosRate} ${PV.guerreirosRate>1?'pontos':'ponto'} de chance para cada ponto de overall efetivo que o rival tiver a mais que o seu time, até +${PV.guerreiros}`},
  // rare: bônus que aparecem bem menos nas ofertas (veja RARE_WEIGHT em campaign.js).
  equilibrio:{name:'Equilíbrio',text:`Com as quatro funções entre os titulares, +${PV.equilibrio} pontos de chance no ataque e na defesa`,rare:true},
  quarta_jogada:{name:'Quarta jogada',text:`${PLAYS+PV.quarta_jogada} Jogadas de Efeito por partida, em vez de ${PLAYS}`,rare:true},
  repescagem:{name:'Repescagem',text:'A primeira derrota que eliminaria o time não conta. Vale uma vez na run. Não vale na final',rare:true},
  trader:{name:'Trader',text:`Pacotes custam ${PV.trader}% a menos. Um jogador vendido na mesma rodada em que saiu de um pacote vale ${PV.traderSell}% a mais`,rare:true}
};

export const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export const avg = a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export const opposite = side=>side==='Ataque'?'Defesa':'Ataque';
export function rng(seed) {
  let n = seed>>>0;
  return ()=>{ n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296; };
}
export function sample(a,random=Math.random) { return a[Math.min(a.length-1,Math.floor(random()*a.length))]; }
export function shuffle(a,random=Math.random) { const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b; }
export const cardWeight = card=>card.photo?PHOTO_WEIGHT:1;
export function weightedSample(list,random=Math.random,weight=cardWeight) {
  if(!list.length)return undefined;
  let roll=random()*list.reduce((sum,item)=>sum+weight(item),0);
  for(const item of list){roll-=weight(item);if(roll<0)return item;}
  return list.at(-1);
}

// ---------- Contratos de agente e draft ----------
export function agentPopularity(players) { const count={};for(const p of players)count[p.comfort]=(count[p.comfort]||0)+1;return count; }
export function startingPool(players,random,count=ROLES.length*2) {
  // Two contracts per role. Popular comfort picks show up a little more often, so most runs start with usable ones.
  const popularity=agentPopularity(players),weight=agent=>Math.sqrt((popularity[agent]||0)+2);
  const pairs=ROLES.map(role=>{
    const options=Object.keys(AGENTS).filter(a=>AGENTS[a]===role),first=weightedSample(options,random,weight);
    return [first,weightedSample(options.filter(a=>a!==first),random,weight)];
  });
  // With fewer contracts than that, the roles left with a single one are drawn; every role keeps at least one.
  const lean=[];
  while(lean.length<ROLES.length*2-count)lean.push(sample(ROLES.filter(role=>!lean.includes(role)),random));
  return ROLES.flatMap((role,i)=>lean.includes(role)?pairs[i].slice(0,1):pairs[i]);
}
// The role a card is drafted as: its own, or for Flex the role it played most.
export function draftRole(player) {
  if(player.role!=='Flex')return player.role;
  return ROLES.reduce((best,role)=>(player.roleMaps[role]||0)>(player.roleMaps[best]||0)?role:best,ROLES[0]);
}
// Six offers of three different roles. Each offer leaves one role out, and no role is left out more than four times,
// so every role is offered at least twice and a team with one of each is always possible.
export function draftPlan(random) {
  const skipped=Object.fromEntries(ROLES.map(role=>[role,0]));
  return Array.from({length:6},()=>{
    const out=sample(ROLES.filter(role=>skipped[role]<4),random);skipped[out]++;
    return shuffle(ROLES.filter(role=>role!==out),random);
  });
}
export function draftChoices(players,picked,random,roles=shuffle(ROLES,random).slice(0,3)) {
  const ids=new Set(picked.map(p=>p.id)),teams=new Set(picked.map(p=>p.team));
  const pool=players.filter(p=>!ids.has(p.id)&&p.ovr>=(picked.length?77:81)&&p.ovr<=(picked.length?84:86));
  // One of the three slots looks first for a teammate of someone already picked, so team synergy stays reachable.
  const mateSlot=picked.length?Math.floor(random()*roles.length):-1;
  return roles.map((role,i)=>{
    const fit=pool.filter(p=>draftRole(p)===role),mates=i===mateSlot?fit.filter(p=>teams.has(p.team)):[];
    return weightedSample(mates.length?mates:fit,random);
  });
}

// ---------- Sinergia e função ----------
export function familiarity(player,agent,perks=[]) {
  const role=AGENTS[agent];
  if(!role) throw new Error('Agente desconhecido');
  if(agent===player.comfort) return {penalty:0,label:'Agente de conforto',comfort:1};
  if(role===player.role || (player.role==='Flex' && (player.roleMaps[role]||0)===Math.max(...Object.values(player.roleMaps)))) return {penalty:0,label:'Função principal',comfort:0};
  const ease=perks.includes('polivalencia')?PV.polivalencia:0;
  if((player.agentMaps[agent]||0)>0 || (player.roleMaps[role]||0)>=Math.max(3,player.maps*.15)) return {penalty:Math.min(0,-1+ease),label:'Função secundária',comfort:0};
  return {penalty:Math.min(0,-3+ease),label:'Fora da função',comfort:0};
}
export function effective(player,agent,lineup,perks=[]) {
  const f=familiarity(player,agent,perks);
  // Team synergy: +1 for every other starter from the same team, so a pair gives +1 each and a full five gives +4.
  const mates=lineup.filter(s=>s.player.team===player.team).length-1;
  const chemistry=mates>0?mates+(perks.includes('entrosamento')?PV.entrosamento:0):0;
  const comfort=f.comfort*(perks.includes('especialistas')?PV.especialistas:1);
  // Staff bonuses that single out starters: the captain (the highest overall; the first of them on a tie) and the
  // ones of lowest overall (the first of them on a tie too).
  const captain=perks.includes('capitao')&&lineup.reduce((best,s)=>s.player.ovr>best.player.ovr?s:best,lineup[0])?.player.id===player.id;
  const young=perks.includes('base')&&[...lineup].sort((a,b)=>a.player.ovr-b.player.ovr).slice(0,PV.baseCount).some(s=>s.player.id===player.id);
  const staff=(captain?PV.capitao:0)+(young?PV.base:0);
  return {value:player.ovr+chemistry+comfort+staff+f.penalty,base:player.ovr,chemistry,comfort,staff,penalty:f.penalty,label:f.label};
}

// ---------- Formação ----------
// attack/defense são pontos de chance por round. strong são os confrontos de afinidade nas Jogadas de Efeito: são
// eles que as suas jogadas sorteiam, e nas do rival saem com o dobro da frequência, então vale ter cartas boas nos
// atributos que eles pedem.
const IDENTITIES = {
  ponta:{name:'Ponta de lança',attack:4,defense:-1,strong:['entry','duel']},
  informacao:{name:'Informação primeiro',attack:2,defense:1,strong:['execute','retake']},
  dominio:{name:'Domínio de mapa',attack:1,defense:2,strong:['postplant','execute']},
  ancora:{name:'Dupla âncora',attack:-1,defense:4,strong:['anchor','retake']},
  fortaleza:{name:'Fortaleza',attack:-3,defense:12,strong:['anchor','retake','postplant']},
  livre:{name:'Formação incompleta',attack:0,defense:0,strong:[]}
};
const DOUBLE = {Duelista:'ponta',Iniciador:'informacao',Controlador:'dominio',Sentinela:'ancora'};
// Pontos de chance que o time perde, em cada lado, por não ter nenhum agente da função.
export const MISSING_COST = {Controlador:{Ataque:5,Defesa:5},Iniciador:{Ataque:3,Defesa:3},Duelista:{Ataque:4,Defesa:0},Sentinela:{Ataque:0,Defesa:4}};
// O guia das formações: a função em que cada uma se apoia e quantos agentes dela são precisos (max quando um grupo
// maior já é outra formação). A ordem é a do desempate: com duas funções empatadas, vale a primeira da lista. 'livre' é
// o que sobra quando nenhuma função aparece duas vezes, o que só acontece com menos de cinco titulares.
export const FORMATIONS = [['ponta','Duelista',2],['informacao','Iniciador',2],['dominio','Controlador',2],['ancora','Sentinela',2,2],['fortaleza','Sentinela',3],['livre',null,0]]
  .map(([key,role,min,max=null])=>({key,role,min,max,...IDENTITIES[key]}));
export function composition(lineup) {
  const count=Object.fromEntries(ROLES.map(r=>[r,0]));
  lineup.forEach(s=>{if(AGENTS[s.agent])count[AGENTS[s.agent]]++;});
  const top=Math.max(...Object.values(count));
  const key=count.Sentinela>=3?'fortaleza':top>=2?DOUBLE[ROLES.find(r=>count[r]===top)]:'livre';
  return {count,key,...IDENTITIES[key],missing:ROLES.filter(r=>count[r]===0)};
}
export function compositionBonus(lineup,side,perks=[]) {
  const c=composition(lineup);
  return (side==='Ataque'?c.attack:c.defense)-c.missing.reduce((sum,role)=>sum+MISSING_COST[role][side],0)
    +(perks.includes('equilibrio')&&lineup.length===5&&!c.missing.length?PV.equilibrio:0);
}
export function validLineup(lineup,pool=null) {
  if(lineup.length!==5) return 'Escale exatamente cinco titulares';
  if(new Set(lineup.map(s=>s.player.id)).size!==5) return 'Um jogador só pode ocupar uma vaga';
  if(lineup.some(s=>!AGENTS[s.agent])) return 'Escolha um agente válido para cada titular';
  if(new Set(lineup.map(s=>s.agent)).size!==5) return 'Cada titular precisa de um agente diferente';
  const unsigned=pool&&lineup.find(s=>!pool.includes(s.agent));
  if(unsigned) return `${unsigned.agent} não tem contrato com a sua equipe`;
  return null;
}
// Each player on the best agent still free: his main (the comfort agent) first, then the one he played most in his
// role. `mains` is how many players, counted from the first, may be on their main; the others go to another agent of
// their role and play without the comfort bonus.
export function assignAgents(players,pool=null,{mains=players.length}={}) {
  const used=new Set(),agents=pool||Object.keys(AGENTS);
  return players.map((player,i)=>{
    const rank=agent=>{const f=familiarity(player,agent);return (f.comfort+f.penalty)*1000+(player.agentMaps[agent]||0);};
    const agent=agents.filter(a=>!used.has(a)&&(i<mains||a!==player.comfort)).sort((a,b)=>rank(b)-rank(a))[0];
    used.add(agent);return {player,agent};
  });
}
// How hard a rival is, as one number on the scale of an overall. Two things make a rival hard: the level it plays at
// (cards plus comfort and synergy: what moves the chance of every round) and the cards themselves (their attributes are
// what wins the confrontations of the Jogadas de Efeito). Measured over thousands of matches, a point of cards weighs
// half of what a point of level does, so strength is the level twice and the cards once.
export const rivalStrength=(level,rating)=>(2*level+rating)/3;
// How far from the strength asked for a rival may be.
export const RIVAL_SPREAD=1;
// How often the rival is a stronger team that comes with players out of their roles, when one fits the game.
export const RIVAL_TRADED=.1;
// The rival of a match. `target` is the strength it must have (see rivalStrength). Every rival is a real team with its
// synergy: the five cards that played the most rounds, each with the +4 of the other four. What a team can vary is how
// many of the five are on their main (the comfort agent, +1), from all of them to none, and it comes with as many as
// bring it closest to the strength asked for. The rival is drawn among all the teams that get within RIVAL_SPREAD of it
// (among the four closest when fewer do).
// Now and then (RIVAL_TRADED) the rival is instead a team too strong for the game however it came, with players out
// of their roles: two of the five have traded agents (never more: it comes only a little weaker). The agents and the
// formation are the team's own, and each of the two plays under what anybody pays out of his role (see familiarity). Weaker for it, the team
// gets as close to the strength asked as the usual candidates go (a point, or as far as the fourth of them where fewer
// than four are within a point: the first game of a run, in a base with few weak teams). `traded` is how many of the
// five play another's agent. Nothing announces it: who looks at the rival's cards sees the agents and the numbers.
// `recent` is the memory of the teams met in the last runs, the latest last: the ones met longest ago (or never) come
// first, and the draw is made among that half of the candidates. A team does not come back while others wait.
// rating is the average of the cards; level, the average effective overall of the five; mains, how many are on their main.
export function buildOpponent(players,{target,excludeIds=[],excludeTeams=[],recent=[]},random) {
  const ids=new Set(excludeIds),skip=new Set(excludeTeams),byTeam={};
  for(const p of players)if(!ids.has(p.id)&&!skip.has(p.team))(byTeam[p.team]??=[]).push(p);
  const off=option=>Math.abs(option.strength-target),within=option=>off(option)<=RIVAL_SPREAD+1e-9;
  const closest=options=>options.reduce((best,option)=>off(option)<off(best)-1e-9?option:best);
  const squads=Object.values(byTeam).filter(list=>list.length>=5).map(list=>[...list].sort((a,b)=>b.rounds-a.rounds));
  const options=squads.map(list=>closest(rivalOptions(list.slice(0,5)))).sort((a,b)=>off(a)-off(b));
  const close=options.filter(within),usual=close.length>=4?close:options.slice(0,4);
  const reach=Math.max(RIVAL_SPREAD,off(usual.at(-1))),taken=new Set(usual.map(option=>option.name));
  const traded=squads.map(list=>list.slice(0,5)).filter(five=>!taken.has(five[0].team)&&rivalOptions(five).every(option=>option.strength>target))
    .map(tradedOptions).filter(list=>list.length).map(closest).filter(option=>off(option)<=reach+1e-9).sort((a,b)=>off(a)-off(b));
  const chance=random(),pick=sample(longestUnmet(traded.length&&chance<RIVAL_TRADED?traded:usual,recent),random);
  return {...pick,lineup:pick.lineup.map(s=>({...s}))};
}
// The half of the candidates the team has gone the longest without meeting. The ones never met come first and all of
// them stay, even when they are more than half: the memory only holds back teams that were met.
function longestUnmet(candidates,recent) {
  const when=option=>recent.lastIndexOf(option.name),unmet=candidates.filter(option=>when(option)<0).length;
  if(unmet===candidates.length)return candidates;
  return candidates.map((option,i)=>[option,i]).sort((a,b)=>when(a[0])-when(b[0])||a[1]-b[1]).slice(0,Math.max(unmet,Math.ceil(candidates.length/2))).map(([option])=>option);
}
// What a given five can be with agents traded: two of the players, each playing the other's agent, on top of every
// way the team comes whole (from everybody on his main down to nobody). Only the trades that put both out of their
// roles count: a trade inside a role changes nothing. Worked out once for each five.
const TRADES=(()=>{const pairs=[];for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)pairs.push([i,j]);return pairs;})();
const TRADED_OPTIONS=new Map();
function tradedOptions(five){
  const key=five.map(p=>p.id).join(' ');
  if(!TRADED_OPTIONS.has(key)){
    const name=five[0].team,rating=avg(five.map(p=>p.ovr)),options=[];
    for(const count of [5,4,3,2,1,0]){
      const whole=assignAgents(five,null,{mains:count});
      for(const trade of TRADES){
        const lineup=whole.map(s=>({...s})),[i,j]=trade;
        lineup[i].agent=whole[j].agent;lineup[j].agent=whole[i].agent;
        if(!trade.every(k=>familiarity(lineup[k].player,lineup[k].agent).penalty<0))continue;
        const level=avg(lineup.map(s=>effective(s.player,s.agent,lineup).value));
        options.push({name,rating,level,strength:rivalStrength(level,rating),mains:lineup.filter(s=>s.agent===s.player.comfort).length,lineup,traded:2});
      }
    }
    TRADED_OPTIONS.set(key,options);
  }
  return TRADED_OPTIONS.get(key);
}
// What a given five can be as a rival, from everybody on his main down to nobody (so, on a tie, the fuller one wins).
// It only depends on who the five are, so it is worked out once: a run asks for a rival before every match, and a
// simulation thousands of times.
const RIVAL_OPTIONS=new Map();
function rivalOptions(five){
  const key=five.map(p=>p.id).join(' ');
  if(!RIVAL_OPTIONS.has(key)){
    const name=five[0].team,rating=avg(five.map(p=>p.ovr));
    RIVAL_OPTIONS.set(key,[5,4,3,2,1,0].map(count=>{
      const lineup=assignAgents(five,null,{mains:count}),level=avg(lineup.map(s=>effective(s.player,s.agent,lineup).value));
      return {name,rating,level,strength:rivalStrength(level,rating),mains:lineup.filter(s=>s.agent===s.player.comfort).length,lineup};
    }));
  }
  return RIVAL_OPTIONS.get(key);
}

// ---------- Força do time ----------
// Fixed scales from the supplied 2026 distribution; not changed per matchup.
const SCALE={acs:[143,244],kast:[.5909,.764],kpr:[.48,.85],mpr:[.64,.83],apr:[.15,.36],swing:[-4.9,2.8]};
export function normalizeStat(key,value){const [lo,hi]=SCALE[key];const n=clamp(30+(value-lo)/(hi-lo)*40,10,90);return key==='mpr'?100-n:n;}
const SIDE_WEIGHTS={Ataque:{acs:.18,kpr:.24,kast:.20,mpr:.10,apr:.18,swing:.10},Defesa:{acs:.12,kpr:.16,kast:.25,mpr:.22,apr:.15,swing:.10}};
// Linear fit of the weighted stat score against overall over the season's 510 cards (r≈0.84). It converts stats into
// "overall-equivalent" points, so a bonus of +1 effective overall is worth exactly what one natural point is.
const STAT_FIT={Ataque:{at82:49.73,slope:2.918},Defesa:{at82:50.05,slope:2.912}};
function playerPoints(slot,lineup,side,perks) {
  const weights=SIDE_WEIGHTS[side],fit=STAT_FIT[side],p=slot.player;
  const score=Object.entries(weights).reduce((total,[key,weight])=>total+normalizeStat(key,p.stats[key])*weight,0);
  const stats=(score-fit.at82)/fit.slope;
  return POINTS_PER_OVR*(.6*stats+.4*(p.ovr-82)+effective(p,slot.agent,lineup,perks).value-p.ovr);
}
export function teamStrength(lineup,side,{gear=0,perks=[],bonus=0}={}) {
  const roster=avg(lineup.map(s=>playerPoints(s,lineup,side,perks))),formation=compositionBonus(lineup,side,perks);
  return {total:roster+formation+gear+bonus,roster,formation,gear,bonus};
}
export function roundChance(ours,theirs){return clamp(.5+(ours.total-theirs.total)/100,.08,.92);}
export function sideForRound(round,start='Ataque'){
  if(round<=12)return start;if(round<=24)return opposite(start);return round%2===1?start:opposite(start);
}
export function isMatchOver(a,b){return Math.max(a,b)>=13&&Math.abs(a-b)>=2;}
// Overtime starts after the 24 rounds of the two halves. Every round of it is the same: see buyPhase.
export const isOvertime=round=>round>24;

// ---------- Jogadas de Efeito ----------
// Cada time tem PLAYS jogadas por partida. Uma jogada transforma o round em um confronto: um jogador de cada lado,
// dois atributos, e quem vence o confronto leva o round. Você chama as suas quando quiser (callPlay); o rival usa as
// dele em rounds sorteados. EVENT_TYPES são os confrontos possíveis; when: lado em que cada um pode acontecer.
export const EVENT_TYPES={
  entry:{label:'ENTRADA',title:'Abra o bombsite',stats:['kpr','kast'],when:'Ataque'},
  execute:{label:'EXECUÇÃO',title:'Faça a execução encaixar',stats:['apr','kast'],when:'Ataque'},
  postplant:{label:'PÓS-PLANT',title:'A spike está no chão',stats:['acs','mpr'],when:'Ataque'},
  anchor:{label:'ÂNCORA',title:'Não entregue o bombsite',stats:['kast','mpr'],when:'Defesa'},
  retake:{label:'RETAKE',title:'Ainda dá para retomar',stats:['apr','swing'],when:'Defesa'},
  duel:{label:'DUELO',title:'Um ângulo, dois jogadores',stats:['acs','kpr'],when:null},
  clutch:{label:'CLUTCH 1 x 1',title:'Um jogador. Um round',stats:['swing','mpr'],when:null}
};
export function compareContest(ours,theirs,keys,ownOvr,enemyOvr,random=Math.random,{edge=false}={}){
  let own=0,enemy=0;
  const comparisons=keys.map(key=>{
    const a=ours.stats[key],b=theirs.stats[key];const diff=(a-b)*(key==='mpr'?-1:1);
    const result=Math.abs(diff)<1e-9?'tie':diff>0?'win':'loss';
    if(result==='tie'){own+=.5;enemy+=.5;}else if(result==='win')own++;else enemy++;
    return {key,ours:a,theirs:b,result};
  });
  let tiebreak=null,won;
  const edgeBonus=own===enemy&&edge?PV.sangue_frio:0,contestOvr=ownOvr+edgeBonus;
  if(own!==enemy)won=own>enemy;
  else if(contestOvr!==enemyOvr){won=contestOvr>enemyOvr;tiebreak=edgeBonus?'perk':'overall';}
  else{won=random()<.5;tiebreak='coin';}
  return {won,own,enemy,comparisons,tiebreak,ownOvr,enemyOvr,edgeBonus,contestOvr};
}
// Whether the rival spends a Jogada de Efeito on the round about to be played. It reads the armament: the less of
// the equipment on the server is its own, the more the round looks lost and the more a confrontation is worth to it.
// So its plays go mostly to its ecos and half buys, hardly ever to a round it enters better armed. With the match
// slipping away it stops saving them. Never on the first round, and never two rounds in a row.
function rivalCalls(match){
  if(match.plays[1]<=0||match.round===1||match.log.at(-1)?.event?.by===1)return false;
  const armed=100-match.prepared.share,[us,them]=match.score;
  let odds=armed<=30?.8:armed<=42?.45:armed<50?.1:armed<58?.03:.01;
  if(us>=12)odds=Math.max(odds,armed<58?.85:.3);
  else if(us>=10&&us>them)odds=Math.max(odds,armed<50?.5:.12);
  return match.random()<odds;
}
export function availableActors(match){return match.teams[0].lineup.map(s=>s.player.id).filter(id=>!match.used.includes(id));}
function spend(list,id,cycle){list.push(id);if(list.length>=cycle)list.length=0;}

// ---------- Economia, armas, coletes e habilidades ----------
// Preços do jogo. power: a qualidade da arma em relação a um rifle (e do colete em relação ao pesado). Decide o que
// cada jogador compra com o que tem e quem leva mais abates; a chance do round vem do valor do equipamento (prepareRound).
// As habilidades (abilities.js) são compradas depois da arma e do colete, com o que sobra do orçamento do round, e
// gastas nele: no round seguinte todo mundo compra de novo. Elas e a ultimate em uso contam no valor do equipamento.
// fan: arma de gosto, só entra na compra de quem a prefere (AWP, metralhadora, escopeta e o rifle de cada um).
export const WEAPONS={
  Classic:{cost:0,power:-20},Frenzy:{cost:450,power:-16,fan:true},Ghost:{cost:500,power:-16},Bandit:{cost:600,power:-15},
  Sheriff:{cost:800,power:-13},Bucky:{cost:850,power:-13,fan:true},Marshal:{cost:950,power:-12,fan:true},Stinger:{cost:1100,power:-11},
  Spectre:{cost:1600,power:-7},Ares:{cost:1600,power:-7,fan:true},Judge:{cost:1850,power:-6,fan:true},Bulldog:{cost:2050,power:-4},
  Guardian:{cost:2250,power:-3},Outlaw:{cost:2400,power:-2,fan:true},Phantom:{cost:2900,power:0,fan:true},Vandal:{cost:2900,power:0,fan:true},
  Odin:{cost:3200,power:0,fan:true},Operator:{cost:4700,power:4,fan:true}
};
export const SHIELDS={'':{cost:0,power:-6},Leve:{cost:400,power:-3},Pesado:{cost:1000,power:0}};
// Rifle and heavy shield: what a player needs to be fully armed.
export const FULL_BUY=WEAPONS.Vandal.cost+SHIELDS.Pesado.cost;
export const loadoutPoints=p=>WEAPONS[p.weapon].power+SHIELDS[p.shield].power;
// What a player carries into the round, at its price: weapon and shield (armsValue), the abilities he paid for and,
// when he is using his ultimate in this round, what an ultimate is worth.
export const armsValue=p=>WEAPONS[p.weapon].cost+SHIELDS[p.shield].cost;
export const loadoutValue=p=>armsValue(p)+(p.util||0)+(p.ultOn?ultValue(p.agent):0);
// How the money on the server splits between the two teams in a round: the first team's share of the value of
// everything both carry. Two teams with nothing at all split it evenly. No team is ever left without a part of it:
// the share goes from 1 to 99, because no round is impossible, however poorly armed a team walks into it.
export function loadoutShare(teams){
  const [ours,theirs]=teams.map(players=>players.reduce((sum,p)=>sum+loadoutValue(p),0));
  return ours+theirs?clamp(Math.round(100*ours/(ours+theirs)),1,99):50;
}
// The best a player can carry for a budget: the weapon and the shield that add the most points. A weapon kept from the
// round before is free. Ties go to the weapon he likes most, then to the cheaper pair.
export function loadout(p,budget){
  const taste=weapon=>{const i=p.likes.indexOf(weapon);return i<0?p.likes.length:i;};
  let best=null;
  for(const [weapon,w] of Object.entries(WEAPONS)){
    const keeps=p.kept&&weapon===p.weapon;
    if(w.fan&&!keeps&&!p.likes.includes(weapon))continue;
    for(const [shield,s] of Object.entries(SHIELDS)){
      const pick={weapon,shield,cost:(keeps?0:w.cost)+s.cost};
      if(pick.cost>budget)continue;
      const gain=best?w.power+s.power-loadoutPoints(best):1;
      if(gain>0||(gain===0&&(taste(weapon)<taste(best.weapon)||(taste(weapon)===taste(best.weapon)&&pick.cost<best.cost))))best=pick;
    }
  }
  return best;
}
const PISTOL_BUYS=[['Classic','Leve'],['Ghost',''],['Ghost',''],['Frenzy',''],['Bandit',''],['Sheriff','']];
const lossPay=streak=>1900+500*Math.min(streak-1,2);
// How often the spike was planted in a round that ended by elimination, by the side that won it.
const PLANT_ODDS={Ataque:.6,Defesa:.2};
// The abilities for the round, out of what the player still has of his budget once weapon and shield are paid.
function equip(p,budget){
  const {charges,spent}=buyAbilities(p.agent,Math.max(0,Math.min(budget,p.credits)));
  p.abi=charges;p.util=spent;p.credits-=spent;
}
const rifle=p=>WEAPONS[p.weapon].power>=0;
// Armed: can pay for a rifle and the shield asked for, or kept a rifle and only needs the shield.
const armed=(p,shield)=>p.credits>=WEAPONS.Vandal.cost+SHIELDS[shield].cost||(p.kept&&rifle(p)&&p.credits>=SHIELDS[shield].cost);
// The team's call for the round. It spends everything when four players can arm themselves, when the round can't wait
// (last of the half, match point against, overtime) or when it decides to gamble after a loss. Otherwise it saves: each
// player only spends what still leaves him a full buy next round. A team coming from a loss counts on losing again; a
// team coming from a win counts on the win and wants rifle and heavy shield before it calls itself armed, which is
// what makes it play the round after a pistol win on cheaper guns.
// The name says what the team ended up carrying: Completa with four rifles, Forçado without them; and when saving,
// Parcial with something bought, Eco with little more than pistols.
function buyPhase(match,t){
  const team=match.teams[t],random=match.random;
  if(match.round===1||match.round===13){
    team.lossStreak=0;team.wonLast=false;
    // Armeiro (yours only): more credits to start the half, which pay for a light shield on top of the pistol.
    const armed=t===0&&match.perks.includes('armeiro'),start=800+(armed?PV.armeiro:0);
    for(const p of team.players){
      const [weapon,bought]=sample(PISTOL_BUYS,random),shield=bought||(armed?'Leve':'');
      // A half starts from scratch: the credits, the weapons and the points towards the ultimate.
      Object.assign(p,{weapon,shield,credits:start-WEAPONS[weapon].cost-SHIELDS[shield].cost,kept:false,ult:0});
      equip(p,p.credits);
    }
    return 'Pistola';
  }
  // Overtime: every round starts from the same place, whatever happened in the one before. Everybody has 5000
  // credits, no weapon is kept and nobody has an ultimate: the points are wiped, and none are earned (see strike).
  if(isOvertime(match.round))for(const p of team.players){p.credits=5000;p.kept=false;p.ult=0;}
  const able=team.players.filter(p=>armed(p,team.wonLast?'Pesado':'Leve')).length>=4;
  const urgent=match.round===12||match.round===24||match.round>=25||match.score[1-t]>=12;
  const gamble=!able&&!urgent&&!team.wonLast&&avg(team.players.map(p=>p.credits))>=2000&&random()<.35;
  // What the team counts on being paid for the next round. A player who saves keeps what a full buy with all his
  // abilities will cost him then.
  const allIn=able||urgent||gamble,income=team.wonLast?3000:lossPay(team.lossStreak+1);
  for(const p of team.players){
    const budget=allIn?p.credits:Math.max(0,p.credits-(FULL_BUY+utilityCost(p.agent)-income)),pick=loadout(p,budget);
    p.weapon=pick.weapon;p.shield=pick.shield;p.credits-=pick.cost;
    equip(p,budget-pick.cost);
  }
  if(allIn)return team.players.filter(rifle).length>=4?'Completa':'Forçado';
  return avg(team.players.map(armsValue))>=1500?'Parcial':'Eco';
}

// ---------- Partida ----------
// decisive: an elimination game (see mustWin in campaign.js), which is where the Psicólogo acts.
export function createMatch({lineup,opponent,seed,perks=[],ownPlays=PLAYS,decisive=false}){
  const error=validLineup(lineup)||validLineup(opponent.lineup);if(error)throw new Error(error);
  const random=rng(seed);
  // likes: the weapons this player prefers, most liked first. Everyone has a rifle; some are AWPers, a few have a quirk.
  const row=s=>{
    const likes=[random()<.6?'Vandal':'Phantom'];
    if(['Jett','Chamber'].includes(s.agent)&&random()<.5)likes.unshift('Operator','Outlaw','Marshal');
    else if(random()<.2)likes.unshift(sample(['Odin','Judge','Ares','Bucky','Frenzy'],random));
    // abi: the charges of each ability held for the round (see SLOTS); util: what was paid for them; ult: the points
    // towards the ultimate, which go back to zero at the side swap and stay there in overtime; ultOn: the ultimate is
    // being used in the round on screen.
    return {id:s.player.id,name:s.player.name,agent:s.agent,k:0,d:0,a:0,credits:800,weapon:'Classic',shield:'',kept:false,alive:true,likes,abi:[0,0,0],util:0,ult:0,ultOn:false};
  };
  const team=(name,slots)=>({name,lineup:slots.map(s=>({...s})),players:slots.map(row),lossStreak:0,wonLast:false});
  // plays: what each team still has, [yours, the rival's]; playsMax: what each started the match with.
  const mine=ownPlays+(perks.includes('quarta_jogada')?PV.quarta_jogada:0);
  const match={teams:[team('Seu elenco',lineup),team(opponent.name,opponent.lineup)],perks,decisive,random,seed,
    score:[0,0],round:1,startSide:sample(['Ataque','Defesa'],random),plays:[mine,PLAYS],playsMax:[mine,PLAYS],
    used:[],enemyUsed:[],log:[],pending:null,prepared:null,over:false,eventsResolved:0,eventsWon:0};
  // gap: how far the rival's effective overall is above yours (0 when it isn't), which is what the Time de guerreiros
  // plays with. The starters don't change during a match, so it is the same in every round.
  const level=(slots,own=[])=>avg(slots.map(s=>effective(s.player,s.agent,slots,own).value));
  match.gap=Math.max(0,Math.round((level(opponent.lineup)-level(lineup,perks))*10)/10);
  prepareRound(match);
  return match;
}
// Compra e força do round que vai começar, e a jogada do rival quando for a vez dela. Roda ao fim do round anterior,
// para que o placar já mostre as armas e os créditos do próximo.
function prepareRound(match){
  const side=sideForRound(match.round,match.startSide),pistol=match.round===1||match.round===13;
  const gear=[0,1].map(t=>buyPhase(match,t));
  // Ultimates: whoever has the points when the round is about to start uses the ultimate in it, and starts counting
  // again from zero.
  for(const p of match.teams.flatMap(team=>team.players)){p.ultOn=p.ult>=ABILITIES[p.agent].x.points;if(p.ultOn)p.ult=0;}
  // Armament: your share of the value of everything both teams carry into the round (the bar on the scoreboard) is, by
  // itself, your chance in it. 65% of the equipment is 15 points above an even round; the cards move it from there.
  const share=loadoutShare(match.teams.map(team=>team.players)),edge=(share-50)/2;
  const has=key=>match.perks.includes(key);
  const bonus=(pistol&&has('pistoleiros')?PV.pistoleiros:0)+(match.score[1]-match.score[0]>=PV.viradaGap&&has('virada')?PV.virada:0)+(match.decisive&&has('psicologo')?PV.psicologo:0)
    +(has('guerreiros')?Math.min(PV.guerreiros,PV.guerreirosRate*match.gap):0);
  const ours=teamStrength(match.teams[0].lineup,side,{gear:edge,perks:match.perks,bonus});
  const theirs=teamStrength(match.teams[1].lineup,opposite(side),{gear:-edge});
  // chance: what the round is drawn with; a confrontation turns it into 1 or 0. odds: the chance the round started
  // with, which is what the bar on the scoreboard shows and stays as it was whatever decides the round.
  const chance=roundChance(ours,theirs);
  match.prepared={side,gear,share,ours,theirs,chance,odds:chance};
  if(rivalCalls(match))openPlay(match,1);
}
// Spends one play of team `by` (0 = yours, 1 = the rival's) on the round about to be played and draws the confrontation.
// It says nothing about who is on the other side: the rival's player is only chosen when yours is.
function openPlay(match,by){
  const side=match.prepared.side,strong=composition(match.teams[0].lineup).strong;
  const fits=Object.keys(EVENT_TYPES).filter(key=>!EVENT_TYPES[key].when||EVENT_TYPES[key].when===side);
  // Your own plays only draw among the confrontations of your formation, when the side has one. With the Jogada
  // ensaiada the rival's plays do too; without it they draw among all, the ones of your formation at twice the weight.
  const rehearsed=by===0||match.perks.includes('jogada_ensaiada')?fits.filter(key=>strong.includes(key)):[];
  const options=rehearsed.length?rehearsed:fits;
  const type=weightedSample(options,match.random,key=>(key==='clutch'?.7:1)*(strong.includes(key)?2:1));
  match.plays[by]--;
  match.pending={type,...EVENT_TYPES[type],round:match.round,side,by,available:availableActors(match)};
  return match.pending;
}
// Your Jogada de Efeito, on the round about to be played. One play per round, whoever calls it.
export function callPlay(match){
  if(match.over)throw new Error('A partida já foi encerrada');
  if(match.pending)throw new Error('Este round já tem uma Jogada de Efeito');
  if(match.plays[0]<=0)throw new Error('Seu time não tem mais Jogadas de Efeito nesta partida');
  return openPlay(match,0);
}
// Distribui abates, mortes e assistências de um round já decidido, respeitando quem venceu e o confronto da Jogada de Efeito.
function simulateKills(match,won,event){
  const random=match.random,prep=match.prepared,winner=won?0:1,winnerSide=won?prep.side:opposite(prep.side);
  const cards=new Map(match.teams.flatMap(t=>t.lineup.map(s=>[s.player.id,s.player])));
  const alive=match.teams.map(t=>[...t.players]),need=[0,0],kills=[],guarded=new Set();
  let outcome='Eliminação',planted=false;need[1-winner]=5;
  const roll=random();
  if(winnerSide==='Ataque'&&roll<.25){outcome='Spike detonada';planted=true;need[1-winner]=3+Math.floor(random()*2);}
  else if(winnerSide==='Defesa'&&roll<.18){outcome='Spike desarmada';planted=true;need[1-winner]=4+Math.floor(random()*2);}
  else if(winnerSide==='Defesa'&&roll<.3){outcome='Tempo esgotado';need[1-winner]=2+Math.floor(random()*3);}
  // A round that ends with one side wiped out may have had the spike planted on the way: usually when the attack won
  // it, now and then when the defence did (the plant that came just before the last attackers fell).
  else planted=random()<PLANT_ODDS[winnerSide];
  const favoured=won?prep.chance:1-prep.chance;
  need[winner]=weightedSample([0,1,2,3,4],random,n=>[1,2.2,3,2.6,1.6][n]*Math.exp((.5-favoured)*n*1.2));
  const strike=(team,killer,victim)=>{
    const assists=alive[team].filter(mate=>mate!==killer&&random()<cards.get(mate.id).stats.apr*.45).slice(0,2);
    killer.k++;killer.credits=Math.min(9000,killer.credits+200);victim.d++;victim.alive=false;assists.forEach(mate=>mate.a++);
    // A point towards the ultimate for the kill and one for the death, up to what the ultimate asks for. Not in
    // overtime, where there are no ultimates.
    if(!isOvertime(match.round))for(const each of [killer,victim])each.ult=Math.min(ABILITIES[each.agent].x.points,each.ult+1);
    alive[1-team].splice(alive[1-team].indexOf(victim),1);need[1-team]--;
    kills.push({team,killer:killer.id,killerName:killer.name,victim:victim.id,victimName:victim.name,weapon:killer.weapon,assists:assists.map(mate=>mate.name),assistIds:assists.map(mate=>mate.id)});
  };
  const row=(t,id)=>match.teams[t].players.find(p=>p.id===id);
  const actor=event&&row(0,event.actor.id),rival=event&&row(1,event.enemy.id);
  const clutch=event?.type==='clutch';
  if(clutch){outcome='Clutch';need[0]=need[1]=4;guarded.add(actor.id).add(rival.id);}
  else if(event){
    // The contest is the first blood of the round, whoever ends up winning it.
    const t=event.contest.won?0:1;need[1-t]=Math.max(1,need[1-t]);
    if(t===0)strike(0,actor,weightedSample(alive[1],random,p=>cards.get(p.id).stats.mpr**3));else strike(1,rival,actor);
  }
  while(need[0]+need[1]>0){
    // A team about to be wiped can't trade back, so its last death closes the round.
    const open=[0,1].filter(t=>need[t]>0&&!(need[t]===1&&alive[t].length===1&&need[1-t]>0));
    const t=open.length===2?(random()<need[0]/(need[0]+need[1])?0:1):open[0];
    // Whoever came without a shield falls more easily; whoever carries a better weapon gets more of the kills.
    const victim=weightedSample(alive[t].filter(p=>!guarded.has(p.id)),random,p=>cards.get(p.id).stats.mpr**3*(1-SHIELDS[p.shield].power/12));
    const killer=weightedSample(alive[1-t],random,p=>cards.get(p.id).stats.kpr**2*(1+WEAPONS[p.weapon].power/50));
    strike(1-t,killer,victim);
  }
  if(clutch){if(event.contest.won)strike(0,actor,rival);else strike(1,rival,actor);}
  return {outcome,kills,planted};
}
function finishRound(match,won,event=null){
  const prep=match.prepared,{outcome,kills,planted}=simulateKills(match,won,event);
  match.score[won?0:1]++;
  const over=isMatchOver(...match.score);
  const attackers=prep.side==='Ataque'?0:1;
  match.teams.forEach((team,t)=>{
    const victory=t===(won?0:1);
    team.lossStreak=victory?0:team.lossStreak+1;team.wonLast=victory;
    // Round income: 3000 for the win, 1900 to 2900 for the loss as defeats pile up, and 300 for the attackers when the
    // spike was planted, however the round ended. Losing while saving the weapon (time ran out, or the spike went
    // off) pays only 1000.
    const saving=!victory&&(outcome==='Tempo esgotado'||outcome==='Spike detonada');
    // Caixa de emergência (yours only): more credits on every round lost.
    const relief=t===0&&match.perks.includes('caixa')?PV.caixa:0;
    for(const p of team.players){
      const pay=(victory?3000:(saving&&p.alive?1000:lossPay(team.lossStreak))+relief)+(t===attackers&&planted?300:0);
      p.credits=Math.min(9000,p.credits+pay);p.kept=p.alive;
      // The dead lose what they carried; after the last round the final scoreboard keeps it.
      if(!p.alive&&!over){p.weapon='Classic';p.shield='';}
      p.alive=true;
    }
  });
  const record={round:match.round,won,score:[...match.score],side:prep.side,gear:prep.gear,share:prep.share,ours:prep.ours,theirs:prep.theirs,
    chance:prep.chance,odds:prep.odds,outcome,planted,kills,event};
  match.log.push(record);match.round++;match.pending=null;match.prepared=null;match.over=over;
  if(!match.over)prepareRound(match);
  return record;
}
// What each player did over a match, read from its rounds: the rounds in which he made the first kill (fk), the
// rounds in which he made two, three, four and five kills (k2, k3, k4, ace) and, of the confrontations of the Jogadas
// de Efeito he went to (plays), the ones he won (playsWon). Only who did any of it is there; NO_STATS is the rest.
export const NO_STATS={fk:0,k2:0,k3:0,k4:0,ace:0,plays:0,playsWon:0};
export function matchStats(match){
  const stats={},of=id=>stats[id]??={...NO_STATS};
  for(const round of match.log){
    const kills=round.kills||[],made={};
    if(kills.length)of(kills[0].killer).fk++;
    for(const kill of kills)made[kill.killer]=(made[kill.killer]||0)+1;
    for(const [id,count] of Object.entries(made))if(count>=2)of(id)[count>=5?'ace':'k'+count]++;
    const contest=round.event?.contest;
    if(contest){
      const ours=of(round.event.actor.id),theirs=of(round.event.enemy.id);
      ours.plays++;theirs.plays++;
      (contest.won?ours:theirs).playsWon++;
    }
  }
  return stats;
}
export function advanceRound(match){
  if(match.over)return null;
  if(match.pending)return {event:match.pending};
  return finishRound(match,match.random()<match.prepared.chance);
}
export function resolveEvent(match,playerId){
  const pending=match.pending;if(!pending)throw new Error('Nenhuma Jogada de Efeito aguarda decisão');
  if(!availableActors(match).includes(playerId))throw new Error('Este jogador não está disponível agora');
  const [us,them]=match.teams,prep=match.prepared,perks=match.perks;
  const actor=us.lineup.find(s=>s.player.id===playerId);
  // The other side burns through its five players too, and tends to send whoever is best suited among those left.
  const fit=s=>avg(pending.stats.map(key=>normalizeStat(key,s.player.stats[key])));
  const rivals=them.lineup.filter(s=>!match.enemyUsed.includes(s.player.id)).sort((a,b)=>fit(b)-fit(a));
  const enemy=weightedSample(rivals,match.random,s=>[5,3,1,1,1][rivals.indexOf(s)]);
  spend(match.used,playerId,perks.includes('segundo_folego')?PV.segundo_folego:5);spend(match.enemyUsed,enemy.player.id,5);
  const contest=compareContest(actor.player,enemy.player,pending.stats,effective(actor.player,actor.agent,us.lineup,perks).value,
    effective(enemy.player,enemy.agent,them.lineup).value,match.random,{edge:perks.includes('sangue_frio')});
  // The contest is the round: whoever wins it takes the round.
  prep.chance=contest.won?1:0;
  match.eventsResolved++;if(contest.won)match.eventsWon++;
  return finishRound(match,contest.won,{type:pending.type,label:pending.label,stats:pending.stats,by:pending.by,
    actor:actor.player,actorAgent:actor.agent,enemy:enemy.player,enemyAgent:enemy.agent,contest});
}
