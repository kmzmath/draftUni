// As conquistas: os feitos do jogador, marcados para sempre e somando os dois modos de jogo.
// Cada uma tem um nome e o que pede. Nenhuma dá moedas nem bônus: são só para mostrar.
// O que já saiu fica guardado entre as runs como {got:{id:dia}, formations:[...], tosses:n}: o dia em que cada
// conquista saiu; para a Estrategista, as formações com que o time já venceu; e, para a Moeda viciada, quantos
// sorteios seguidos o time venceu (ou perdeu, abaixo de zero).
import * as E from './engine.js?v=b20908dbbf';
import {lineupSlots,lineupError,PERIODS} from './campaign.js?v=b20908dbbf';
import {albumSummary} from './album.js?v=b20908dbbf';

export const GROUPS = ['Campanha','Partida','Jogada de Efeito','Elenco','Álbum'];
export const ACHIEVEMENTS = [
  ['groups','Campanha','Classificado','Chegar à Fase de Grupos'],
  ['playoffs','Campanha','Mata-mata','Chegar aos Playoffs'],
  ['final','Campanha','Finalista','Chegar à final'],
  ['champion','Campanha','Campeão do Univavá','Ser campeão'],
  ['three','Campanha','Tricampeão','Ser campeão 3 vezes'],
  ['unbeaten','Campanha','Invicto','Ser campeão sem perder nenhuma partida'],
  ['wire','Campanha','No sufoco','Avançar de fase no último jogo possível'],
  ['daily','Campanha','Campeão do dia','Ser campeão no Desafio do dia'],
  ['regular','Campanha','Assíduo','Jogar o Desafio do dia em 7 dias'],
  ['passed','Campanha','Aprovado','Ser campeão no 1º período'],
  ['graduate','Campanha','Formado',`Ser campeão no ${PERIODS}º período`],
  ['soclose','Campanha','Tão perto...','Perder a final depois de vencer todos os outros jogos'],
  ['popcorn','Campanha','Pipoqueiros','Perder o primeiro jogo dos Playoffs depois de vencer todos os outros'],
  ['lion','Campanha','Leão de Classificatória','Cair na Fase de Grupos sem vencer nenhum jogo, depois de vencer todos os da classificatória'],
  ['sweep','Partida','Atropelo','Vencer uma partida por 13 a 0'],
  ['swept','Partida','Dia para esquecer','Perder uma partida por 0 a 13'],
  ['overtime','Partida','Prorrogação','Vencer uma partida na prorrogação'],
  ['comeback','Partida','Oso, Oso, Oso','Vencer depois de estar 6 rounds atrás'],
  ['streak','Partida','Embalado','Vencer 5 partidas seguidas na mesma run'],
  ['upset','Partida','Zebra','Vencer um rival com efetivo 3 pontos ou mais acima do seu'],
  ['carry','Partida','Dor nas Costas','Um jogador seu termina a partida com 30 abates ou mais'],
  ['ace','Partida','Ace','Um jogador seu faz os 5 abates de um round'],
  ['eco','Partida','Eco milagroso','Vencer um round de Eco contra uma compra Completa'],
  ['house','Partida','A casa sempre ganha','Perder, sem Jogada de Efeito, um round em que você tinha 85% de chance ou mais'],
  ['collective','Partida','Coletivismo','Vencer uma partida sem usar nenhuma Jogada de Efeito'],
  ['hot','Jogada de Efeito','Mão quente','Vencer todos os confrontos de uma partida (pelo menos 3)'],
  ['detail','Jogada de Efeito','No detalhe','Vencer um confronto no desempate'],
  ['trust','Jogada de Efeito','Eu confio nas minhas chances','Não usar Jogada de Efeito num round em que você tem 15% de chance ou menos'],
  ['prevent','Jogada de Efeito','Melhor prevenir...','Usar uma Jogada de Efeito num round em que você tem 49% de chance'],
  ['sure','Jogada de Efeito','Prefiro a Certeza','Usar uma Jogada de Efeito num round em que você tem 80% de chance ou mais'],
  ['coward','Jogada de Efeito','Time covarde','Perder 4 confrontos seguidos na mesma partida'],
  ['coin','Jogada de Efeito','Moeda viciada','Vencer ou perder 3 sorteios de desempate seguidos'],
  ['home','Elenco','Time da casa','Jogar uma partida com cinco titulares da mesma equipe'],
  ['mains','Elenco','Cada um no seu','Jogar uma partida com os cinco titulares no agente de conforto'],
  ['selecao','Elenco','Seleção','Ter um time com 90 de média efetiva'],
  ['best','Elenco','Melhor do Mundo','Ter um jogador com 93 de overall efetivo no elenco'],
  ['strategist','Elenco','Estrategista','Vencer com cada uma das cinco formações'],
  ['find','Elenco','Achado','Ficar com uma carta de overall 90 ou mais num pacote'],
  ['vault','Elenco','Cofre cheio','Juntar 1.000 moedas'],
  ['refund','Elenco','Quero meu reembolso','Vender um jogador na mesma rodada em que ele saiu de um pacote'],
  ['album50','Álbum','Colecionador','50 cartas no álbum'],
  ['album150','Álbum','Álbum de respeito','150 cartas no álbum'],
  ['albumAll','Álbum','Álbum completo','Todas as cartas no álbum'],
  ['team','Álbum','Equipe completa','Completar uma equipe no álbum']
].map(([id,group,name,text])=>({id,group,name,text}));
export const BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,a]));
// The five formations a team of five can have: the Estrategista asks for a win with each of them.
const FORMATION_KEYS = E.FORMATIONS.filter(f=>f.role).map(f=>f.key);
const SELECAO = 90, BEST = 93, VAULT = 1000;
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

// A match that was played to the end, right after the campaign recorded it (so `run` is already where the result took
// it). `feats` is what the player has so far: the formation of a win is added to it.
export function fromMatch({match,summary,run},feats) {
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
  if(log.some(round=>{const mine=(round.kills||[]).filter(kill=>kill.team===0);return mine.length>=5&&mine.every(kill=>kill.killer===mine[0].killer);}))got.push('ace');
  if(log.some(round=>round.won&&round.gear?.[0]==='Eco'&&round.gear[1]==='Completa'))got.push('eco');
  if(match.eventsResolved>=3&&match.eventsWon===match.eventsResolved)got.push('hot');
  if(log.some(round=>round.event?.contest?.tiebreak&&round.event.contest.won))got.push('detail');
  // The rounds one by one: the chance each started with, whether a play decided it, whose play it was and how the
  // confrontation went. `left` is how many plays you still had when the round was about to start.
  const shown=round=>Math.round(100*round.odds);
  let left=match.playsMax?.[0]??E.PLAYS,called=0,lostInRow=0;
  for(const round of log){
    const contest=round.event?.contest;
    if(!round.event){
      // a round you could have turned into a confrontation and didn't
      if(left>0&&shown(round)<=TRUST)got.push('trust');
      if(!round.won&&shown(round)>=HOUSE)got.push('house');
    }else if(round.event.by===0){
      called++;left--;
      if(shown(round)===PREVENT)got.push('prevent');
      if(shown(round)>=SURE)got.push('sure');
    }
    if(!contest)continue;
    lostInRow=contest.won?0:lostInRow+1;
    if(lostInRow>=COWARD)got.push('coward');
    // the draws of the coin are counted from match to match: so many won in a row, or so many lost (below zero)
    if(contest.tiebreak==='coin'){
      const run=feats.tosses||0;
      feats.tosses=contest.won?Math.min(9,Math.max(run,0)+1):Math.max(-9,Math.min(run,0)-1);
      if(Math.abs(feats.tosses)>=COIN)got.push('coin');
    }
  }
  if(won&&!called)got.push('collective');
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
