// Regras puras do jogo: draft, sinergia, formação e simulação da partida. Sem DOM.
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

export const PERKS = {
  polivalencia:{name:'Elenco polivalente',text:'Penalidades de função caem 1 ponto: secundária deixa de custar, fora de função custa -2'},
  entrosamento:{name:'Entrosamento',text:'A sinergia de equipe rende +1 a mais: dois titulares da mesma equipe já valem +2 cada, três valem +3'},
  pistoleiros:{name:'Pistoleiros',text:'+12 pontos de chance nos rounds de pistola (1 e 13)'},
  sangue_frio:{name:'Sangue frio',text:'Nos confrontos empatados, +2 de overall só para o desempate'},
  segundo_folego:{name:'Segundo fôlego',text:'Os titulares voltam a ficar disponíveis depois de 4 usos, não 5'},
  virada:{name:'Mentalidade de virada',text:'+6 pontos de chance enquanto estiver 3 ou mais rounds atrás'},
  patrocinio:{name:'Patrocínio da atlética',text:'+60 moedas em cada partida disputada'},
  olheiro:{name:'Olheiro',text:'Cada pacote revela 4 cartas em vez de 3'},
  negociador:{name:'Negociador',text:'Jogadores do mercado e contratos de agente custam 20% menos'},
  jogada_ensaiada:{name:'Jogada ensaiada',text:'Suas Jogadas de Efeito sempre sorteiam um confronto de afinidade da sua formação'},
  armeiro:{name:'Armeiro',text:'Seus jogadores começam cada metade com 1.200 créditos e entram de colete nos rounds de pistola'},
  caixa:{name:'Caixa de emergência',text:'+400 créditos para cada jogador seu depois de um round perdido'},
  capitao:{name:'Capitão',text:'O titular de maior overall rende +1'},
  base:{name:'Aposta na base',text:'Titulares com overall até 80 rendem +2'},
  especialistas:{name:'Especialistas',text:'No agente de conforto, o jogador rende +2 em vez de +1'},
  equilibrio:{name:'Equilíbrio',text:'Com as quatro funções entre os titulares, +3 pontos de chance no ataque e na defesa'},
  vitrine:{name:'Vitrine',text:'O mercado mostra 6 cartas em vez de 4'},
  contatos:{name:'Contatos',text:'A primeira troca de ofertas de cada loja é grátis'},
  bicho:{name:'Bicho',text:'+40 moedas por vitória'},
  // rare: bônus que mudam uma regra do jogo. Aparecem bem menos nas ofertas.
  quarta_jogada:{name:'Quarta jogada',text:'4 Jogadas de Efeito por partida, em vez de 3',rare:true},
  repescagem:{name:'Repescagem',text:'A primeira derrota que eliminaria o time não conta. Vale uma vez na run',rare:true}
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
export function startingPool(players,random) {
  // Two contracts per role. Popular comfort picks show up a little more often, so most runs start with usable ones.
  const popularity=agentPopularity(players),weight=agent=>Math.sqrt((popularity[agent]||0)+2);
  return ROLES.flatMap(role=>{
    const options=Object.keys(AGENTS).filter(a=>AGENTS[a]===role),first=weightedSample(options,random,weight);
    return [first,weightedSample(options.filter(a=>a!==first),random,weight)];
  });
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
  const ease=perks.includes('polivalencia')?1:0;
  if((player.agentMaps[agent]||0)>0 || (player.roleMaps[role]||0)>=Math.max(3,player.maps*.15)) return {penalty:-1+ease,label:'Função secundária',comfort:0};
  return {penalty:-3+ease,label:'Fora da função',comfort:0};
}
export function effective(player,agent,lineup,perks=[]) {
  const f=familiarity(player,agent,perks);
  // Team synergy: +1 for every other starter from the same team, so a pair gives +1 each and a full five gives +4.
  const mates=lineup.filter(s=>s.player.team===player.team).length-1;
  const chemistry=mates>0?mates+(perks.includes('entrosamento')?1:0):0;
  const comfort=f.comfort*(perks.includes('especialistas')?2:1);
  // Staff bonuses that single out a starter: the captain (the highest overall; the first of them on a tie) and the low overalls.
  const captain=perks.includes('capitao')&&lineup.reduce((best,s)=>s.player.ovr>best.player.ovr?s:best,lineup[0])?.player.id===player.id;
  const staff=(captain?1:0)+(perks.includes('base')&&player.ovr<=80?2:0);
  return {value:player.ovr+chemistry+comfort+staff+f.penalty,base:player.ovr,chemistry,comfort,staff,penalty:f.penalty,label:f.label};
}

// ---------- Formação ----------
// attack/defense são pontos de chance por round. strong são os confrontos de afinidade nas Jogadas de Efeito:
// aparecem com o dobro da frequência, então vale ter cartas boas nos atributos que eles pedem.
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
    +(perks.includes('equilibrio')&&lineup.length===5&&!c.missing.length?3:0);
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
export const RIVAL_SPREAD=.5;
// The rival of a match. `target` is the strength it must have (see rivalStrength). Every rival is a real team with its
// synergy: the five cards that played the most rounds, each with the +4 of the other four. What a team can vary is how
// many of the five are on their main (the comfort agent, +1), from all of them to none, and it comes with as many as
// bring it closest to the strength asked for. The rival is drawn among all the teams that get within RIVAL_SPREAD of it
// (among the four closest when fewer do).
// rating is the average of the cards; level, the average effective overall of the five; mains, how many are on their main.
export function buildOpponent(players,{target,excludeIds=[],excludeTeams=[]},random) {
  const ids=new Set(excludeIds),skip=new Set(excludeTeams),byTeam={};
  for(const p of players)if(!ids.has(p.id)&&!skip.has(p.team))(byTeam[p.team]??=[]).push(p);
  const off=option=>Math.abs(option.strength-target);
  const options=Object.entries(byTeam).filter(([,list])=>list.length>=5)
    .map(([,list])=>rivalOptions([...list].sort((a,b)=>b.rounds-a.rounds).slice(0,5)).reduce((best,option)=>off(option)<off(best)-1e-9?option:best))
    .sort((a,b)=>off(a)-off(b));
  const close=options.filter(option=>off(option)<=RIVAL_SPREAD+1e-9),pick=sample(close.length>=4?close:options.slice(0,4),random);
  return {...pick,lineup:pick.lineup.map(s=>({...s}))};
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

// ---------- Jogadas de Efeito ----------
// Cada time tem PLAYS jogadas por partida. Uma jogada transforma o round em um confronto: um jogador de cada lado,
// dois atributos, e quem vence o confronto leva o round. Você chama as suas quando quiser (callPlay); o rival usa as
// dele em rounds sorteados. EVENT_TYPES são os confrontos possíveis; when: lado em que cada um pode acontecer.
export const PLAYS=3;
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
  const edgeBonus=own===enemy&&edge?2:0,contestOvr=ownOvr+edgeBonus;
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

// ---------- Economia, armas e coletes ----------
// Preços do jogo. power: a qualidade da arma em relação a um rifle (e do colete em relação ao pesado). Decide o que
// cada jogador compra com o que tem e quem leva mais abates; a chance do round vem do valor do equipamento (prepareRound).
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
export const loadoutValue=p=>WEAPONS[p.weapon].cost+SHIELDS[p.shield].cost;
// How the money on the server splits between the two teams in a round: the first team's share, from 0 to 100, of the
// value of everything both carry. Two teams with nothing but Classics split it evenly.
export function loadoutShare(teams){
  const [ours,theirs]=teams.map(players=>players.reduce((sum,p)=>sum+loadoutValue(p),0));
  return ours+theirs?Math.round(100*ours/(ours+theirs)):50;
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
    // Armeiro (yours only): 400 credits more to start the half, which pay for a light shield on top of the pistol.
    const armed=t===0&&match.perks.includes('armeiro'),start=armed?1200:800;
    for(const p of team.players){
      const [weapon,bought]=sample(PISTOL_BUYS,random),shield=bought||(armed?'Leve':'');
      Object.assign(p,{weapon,shield,credits:start-WEAPONS[weapon].cost-SHIELDS[shield].cost,kept:false});
    }
    return 'Pistola';
  }
  if(match.round>=25)for(const p of team.players){p.credits=5000;p.kept=false;}
  const able=team.players.filter(p=>armed(p,team.wonLast?'Pesado':'Leve')).length>=4;
  const urgent=match.round===12||match.round===24||match.round>=25||match.score[1-t]>=12;
  const gamble=!able&&!urgent&&!team.wonLast&&avg(team.players.map(p=>p.credits))>=2000&&random()<.35;
  const allIn=able||urgent||gamble,reserve=FULL_BUY-(team.wonLast?3000:lossPay(team.lossStreak+1));
  for(const p of team.players){
    const pick=loadout(p,allIn?p.credits:Math.max(0,p.credits-reserve));
    p.weapon=pick.weapon;p.shield=pick.shield;p.credits-=pick.cost;
  }
  if(allIn)return team.players.filter(rifle).length>=4?'Completa':'Forçado';
  return avg(team.players.map(loadoutValue))>=1500?'Parcial':'Eco';
}

// ---------- Partida ----------
export function createMatch({lineup,opponent,seed,perks=[]}){
  const error=validLineup(lineup)||validLineup(opponent.lineup);if(error)throw new Error(error);
  const random=rng(seed);
  // likes: the weapons this player prefers, most liked first. Everyone has a rifle; some are AWPers, a few have a quirk.
  const row=s=>{
    const likes=[random()<.6?'Vandal':'Phantom'];
    if(['Jett','Chamber'].includes(s.agent)&&random()<.5)likes.unshift('Operator','Outlaw','Marshal');
    else if(random()<.2)likes.unshift(sample(['Odin','Judge','Ares','Bucky','Frenzy'],random));
    return {id:s.player.id,name:s.player.name,agent:s.agent,k:0,d:0,a:0,credits:800,weapon:'Classic',shield:'',kept:false,alive:true,likes};
  };
  const team=(name,slots)=>({name,lineup:slots.map(s=>({...s})),players:slots.map(row),lossStreak:0,wonLast:false});
  // plays: what each team still has, [yours, the rival's]; playsMax: what each started the match with.
  const mine=PLAYS+(perks.includes('quarta_jogada')?1:0);
  const match={teams:[team('Seu elenco',lineup),team(opponent.name,opponent.lineup)],perks,random,seed,
    score:[0,0],round:1,startSide:sample(['Ataque','Defesa'],random),plays:[mine,PLAYS],playsMax:[mine,PLAYS],
    used:[],enemyUsed:[],log:[],pending:null,prepared:null,over:false,eventsResolved:0,eventsWon:0};
  prepareRound(match);
  return match;
}
// Compra e força do round que vai começar, e a jogada do rival quando for a vez dela. Roda ao fim do round anterior,
// para que o placar já mostre as armas e os créditos do próximo.
function prepareRound(match){
  const side=sideForRound(match.round,match.startSide),pistol=match.round===1||match.round===13;
  const gear=[0,1].map(t=>buyPhase(match,t));
  // Armament: your share of the value of everything both teams carry into the round (the bar on the scoreboard) is, by
  // itself, your chance in it. 65% of the equipment is 15 points above an even round; the cards move it from there.
  const share=loadoutShare(match.teams.map(team=>team.players)),edge=(share-50)/2;
  const bonus=(pistol&&match.perks.includes('pistoleiros')?12:0)+(match.score[1]-match.score[0]>=3&&match.perks.includes('virada')?6:0);
  const ours=teamStrength(match.teams[0].lineup,side,{gear:edge,perks:match.perks,bonus});
  const theirs=teamStrength(match.teams[1].lineup,opposite(side),{gear:-edge});
  match.prepared={side,gear,share,ours,theirs,chance:roundChance(ours,theirs)};
  if(rivalCalls(match))openPlay(match,1);
}
// Spends one play of team `by` (0 = yours, 1 = the rival's) on the round about to be played and draws the confrontation.
// It says nothing about who is on the other side: the rival's player is only chosen when yours is.
function openPlay(match,by){
  const side=match.prepared.side,strong=composition(match.teams[0].lineup).strong;
  const fits=Object.keys(EVENT_TYPES).filter(key=>!EVENT_TYPES[key].when||EVENT_TYPES[key].when===side);
  // Jogada ensaiada: your own plays only draw among the confrontations of your formation, when the side has one.
  const rehearsed=by===0&&match.perks.includes('jogada_ensaiada')?fits.filter(key=>strong.includes(key)):[];
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
  let outcome='Eliminação';need[1-winner]=5;
  const roll=random();
  if(winnerSide==='Ataque'&&roll<.25){outcome='Spike detonada';need[1-winner]=3+Math.floor(random()*2);}
  else if(winnerSide==='Defesa'&&roll<.18){outcome='Spike desarmada';need[1-winner]=4+Math.floor(random()*2);}
  else if(winnerSide==='Defesa'&&roll<.3){outcome='Tempo esgotado';need[1-winner]=2+Math.floor(random()*3);}
  const favoured=won?prep.chance:1-prep.chance;
  need[winner]=weightedSample([0,1,2,3,4],random,n=>[1,2.2,3,2.6,1.6][n]*Math.exp((.5-favoured)*n*1.2));
  const strike=(team,killer,victim)=>{
    const assists=alive[team].filter(mate=>mate!==killer&&random()<cards.get(mate.id).stats.apr*.45).slice(0,2);
    killer.k++;killer.credits=Math.min(9000,killer.credits+200);victim.d++;victim.alive=false;assists.forEach(mate=>mate.a++);
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
  return {outcome,kills};
}
function finishRound(match,won,event=null){
  const prep=match.prepared,{outcome,kills}=simulateKills(match,won,event);
  match.score[won?0:1]++;
  const over=isMatchOver(...match.score);
  const attackers=prep.side==='Ataque'?0:1,planted=outcome==='Spike detonada'||outcome==='Spike desarmada';
  match.teams.forEach((team,t)=>{
    const victory=t===(won?0:1);
    team.lossStreak=victory?0:team.lossStreak+1;team.wonLast=victory;
    // Round income: 3000 for the win, 1900 to 2900 for the loss as defeats pile up, and 300 for the attackers when the
    // spike was planted. Losing while saving the weapon (time ran out, or the spike went off) pays only 1000.
    const saving=!victory&&(outcome==='Tempo esgotado'||outcome==='Spike detonada');
    // Caixa de emergência (yours only): 400 more on every round lost.
    const relief=t===0&&match.perks.includes('caixa')?400:0;
    for(const p of team.players){
      const pay=(victory?3000:(saving&&p.alive?1000:lossPay(team.lossStreak))+relief)+(t===attackers&&planted?300:0);
      p.credits=Math.min(9000,p.credits+pay);p.kept=p.alive;
      // The dead lose what they carried; after the last round the final scoreboard keeps it.
      if(!p.alive&&!over){p.weapon='Classic';p.shield='';}
      p.alive=true;
    }
  });
  const record={round:match.round,won,score:[...match.score],side:prep.side,gear:prep.gear,share:prep.share,ours:prep.ours,theirs:prep.theirs,
    chance:prep.chance,outcome,kills,event};
  match.log.push(record);match.round++;match.pending=null;match.prepared=null;match.over=over;
  if(!match.over)prepareRound(match);
  return record;
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
  spend(match.used,playerId,perks.includes('segundo_folego')?4:5);spend(match.enemyUsed,enemy.player.id,5);
  const contest=compareContest(actor.player,enemy.player,pending.stats,effective(actor.player,actor.agent,us.lineup,perks).value,
    effective(enemy.player,enemy.agent,them.lineup).value,match.random,{edge:perks.includes('sangue_frio')});
  // The contest is the round: whoever wins it takes the round.
  prep.chance=contest.won?1:0;
  match.eventsResolved++;if(contest.won)match.eventsWon++;
  return finishRound(match,contest.won,{type:pending.type,label:pending.label,stats:pending.stats,by:pending.by,
    actor:actor.player,actorAgent:actor.agent,enemy:enemy.player,enemyAgent:enemy.agent,contest});
}
