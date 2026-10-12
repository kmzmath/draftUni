// Tutorial e ajuda por tela: um passo a passo que destaca cada elemento da tela e explica o que ele faz.
// As telas não trazem texto explicativo; tudo o que precisa ser explicado mora aqui.

// Cada passo aponta para um elemento (el) e traz um título e um texto. Passos cujo elemento não está na tela são pulados.
const PERIOD_OPENED = {el:'.period-opened',title:'Período liberado',text:'O título abriu um período novo: uma run com a regra mostrada aqui, somada às dos anteriores. Na próxima run você escolhe em qual jogar'};
// One balloon for each thing worth explaining, and none for what the screen already shows. A balloon is long only when
// it is about a rule of the game the player has to understand.
// Where the overall is on a card, as parts of the card: left, top, width, height (the patch of .card-ovr in styles.css).
const OVERALL = [.084,.122,.2,.117];
export const TOURS = {
  home:[
    {el:'.hero-title',title:'Univavá Draft',text:'Você é um bom técnico? Tente montar seu time dos sonhos com as cartinhas de todo mundo que jogou o Univavá, e leve seu time à glória! Passando pelo caminho completo: classificatória, fase de grupos e Playoffs!'},
    {el:'.team-id',title:'Seu time',text:'Dê nome e escudo ao seu time. Clique no escudo para montar o seu'},
    {el:'.mode.free',title:'Modo tradicional',text:'Uma run só sua, quantas vezes quiser: começa num draft e vai até o título ou a eliminação'},
    {el:'.period-pips',title:'Períodos',text:'Cada título abre um período: uma run com uma regra a mais, somada às anteriores. São 10, e você escolhe em qual jogar entre os que já abriu'},
    {el:'.mode.daily',title:'Desafio do dia',text:'Uma run por dia, igual para todo mundo e jogada uma vez só. No fim, copie o resultado e compare com os amigos. Vira à meia-noite de Brasília'},
    {el:'.album-link',title:'Álbum de cartinhas',text:'Toda carta que joga uma partida pelo seu time entra no álbum. Acha que consegue colecionar todo mundo?'},
    {el:'.feats-link',title:'Conquistas',text:'Os feitos do seu time ficam marcados aqui, do 13 a 0 ao título. Consegue completar todas?'},
    {el:'.stats-link',title:'Estatísticas',text:'Tudo o que o seu time já fez, somando todas as runs'},
    {el:'.help',title:'Ajuda',text:'Este botão explica a tela em que você estiver, passo a passo. Sempre que precisar de uma ajudinha é só clicar!'}
  ],
  draft:[
    {el:'.band',title:'O draft',text:'São 6 escolhas: 5 titulares e 1 reserva. Em cada uma você fica com 1 de 3 cartas, sempre de funções diferentes. Cada função aparece pelo menos 2 vezes ao longo do draft'},
    {el:'.contracts',title:'Contratos de agente',text:'Você só pode pickar agentes que você tem o contrato! Cada jogador tem seu main e joga melhor com ele. Estes foram sorteados para esta run, com todas as funções. Você pode comprar novos agentes na loja!'},
    {el:'.offer .facts',title:'Encaixe no seu time',text:'O agente mostrado é o de conforto da carta. Tente usar os mains dos jogadores! Além disso, jogadores da mesma equipe possuem sinergia e jogam melhor juntos!'},
    {el:'.offer .stats',title:'Atributos',text:'ACS, KAST, KPR, MPR, APR e Swing decidem os confrontos da partida. A barrinha mostra de quantos por cento das outras cartas o jogador ganha em cada um'}
  ],
  perk:[
    {el:'.perk-row',title:'Comissão técnica',text:'Escolha 1 de 3 bônus, que vale até o fim da run. Você ganha um depois do draft e outro a cada fase vencida, e pode comprar mais na loja. Os raros aparecem bem menos'}
  ],
  'hub:lineup':[
    {el:'.path-stage.now',title:'A fase',text:'Os losangos são as vitórias que faltam para avançar; os círculos, as derrotas que ainda cabem'},
    {el:'.period-tag',title:'Período',text:'Nesta run valem as regras deste período e de todos os anteriores. Clique para ver a lista'},
    {el:'.stage',title:'Titulares',text:'Clique em um jogador e depois em outro para trocar. Com o banco no meio, você vê o overall efetivo do time antes e depois, e confirma'},
    {el:'.slot .card:has(.card-ovr), .stage:not(:has(.card-ovr)) .slot .card',part:OVERALL,title:'Overall efetivo',text:'A nota muda com a escalação: verde quando o jogador rende mais que o overall da carta, vermelho quando rende menos'},
    {el:'.agent-btn',title:'Agente',text:'Troque o agente do titular. Antes de confirmar, a prévia mostra o overall efetivo do time e a formação, antes e depois'},
    {el:'.slot-team.linked',title:'Sinergia',text:'Escudo aceso: titulares da mesma equipe. O número é o bônus de cada um'},
    {el:'.staff',title:'Comissão técnica',text:'Os bônus desta run e o que cada um faz'},
    {el:'.bench',title:'Banco',text:'Selecione uma carta para ver, trocar de lugar ou vender. Vender um titular sem reserva deixa a vaga aberta até você comprar outra carta'},
    {el:'.identity',title:'Formação',text:'As funções dos cinco agentes definem a formação, que dá ou tira pontos de chance no ataque e na defesa. As etiquetas são os confrontos que mais saem nas suas Jogadas de Efeito. O guia mostra todas as formações'},
    {el:'.formation-strip',title:'Formação',text:'As funções dos cinco agentes definem a formação, que dá ou tira pontos de chance no ataque e na defesa. As etiquetas são os confrontos que mais saem nas suas Jogadas de Efeito. O guia mostra todas as formações'},
    {el:'.panel.next',title:'Próximo adversário',text:'O rival, o overall efetivo dos dois lados e as cinco cartas dele. Clique numa carta para ver os atributos'},
    {el:'.prep-open',more:true,title:'Preparação',text:'Sobrou moeda? Compre pontos de chance, uma Jogada de Efeito a mais ou o estudo do rival para a próxima partida, ou +1 de overall para uma carta pelo resto da run'},
    {el:'[data-action="tab"][data-id="shop"]',title:'Loja',text:'Pacotes, mercado e contratos de agente. As ofertas mudam a cada partida'},
    {el:'[data-action="tab"][data-id="stats"]',title:'Stats',text:'Os atributos do elenco e o que cada jogador fez nesta run'},
    {el:'[data-action="tab"][data-id="rival"]',title:'Rival',text:'O próximo adversário, as cartas dele e a preparação da partida'},
    {el:'[data-action="forfeit"]',title:'W.O.',text:'Com menos de cinco titulares o time não joga. Complete o time na loja, ou perca a partida por W.O.: derrota automática, sem moedas'}
  ],
  'hub:shop':[
    {el:'.wallet',title:'Moedas',text:'Você ganha moedas por partida, por vitória e por fase vencida. Vitórias seguidas pagam um bônus que cresce a cada uma'},
    {el:'.packs',title:'Pacotes',text:'Cada pacote revela 3 cartas da faixa de overall indicada, você escolhe 1'},
    {el:'.pack-funcao',title:'Pacote de função',text:'Só cartas de uma função, na faixa de overall do mercado desta fase. A função segue a ordem mostrada no pacote e avança a cada partida e a cada compra'},
    {el:'.perk-pack',title:'Pacote de vantagens',text:'Abre 3 bônus da comissão técnica que você ainda não tem, e você fica com 1. Cada pacote custa 100 moedas a mais que o anterior'},
    {el:'.market',title:'Mercado',text:'Prefere saber exatamente quem você vai comprar? O mercado traz jogadores prontos para jogar pelo seu time! Você pode comparar como sua equipe ficaria ao substituir um titular por essa carta'},
    {el:'.agent-offers',title:'Contratos de agente',text:'O contrato libera o agente para qualquer titular até o fim da run. A loja avisa quando alguém do elenco tem conforto nele'},
    {el:'[data-action="reroll"]',title:'Trocar ofertas',text:'Paga para sortear novas ofertas de mercado e de contratos agora'}
  ],
  // Steps marked `more` are detail: the tutorial that opens by itself skips them, the Ajuda button shows them all.
  // The scoreboard, the two teams, the squares of the rounds, the abilities and the feed of the round have no step: they
  // speak for themselves.
  'match:board':[
    {el:'.play-call',title:'Jogada de Efeito',text:'São 3 por partida. Usada no freezetime, ela troca o round por um confronto entre um jogador seu e um do rival: quem vence o confronto leva o round. Guarde para um round que parece perdido ou para um que não pode escapar. O rival também tem as dele'},
    {el:'.buys',title:'Chance do round',text:'A chance de cada time no round que vai começar. Ela parte do equipamento que cada um leva; as cartas, a formação e os bônus somam ou tiram pontos. Deixe o ponteiro na barra, ou toque nela, para comparar os dois times'},
    {el:'.buy-plan',more:true,title:'Compra do round',text:'No freezetime você pode mandar na compra: Eco guarda os créditos, Meia gasta até metade e Total gasta tudo. Auto deixa o time decidir. A ordem vale também num round com Jogada de Efeito, sua ou do rival. Em round de pistola e na prorrogação não há o que escolher'},
    {el:'.controls',title:'Ritmo',text:'Começar round inicia o round; durante ele, o mesmo botão pausa. Ao lado fica a velocidade'},
    {el:'.squad.us .cr',more:true,title:'Créditos',text:'Cada jogador paga a própria arma, colete e habilidades. O round rende 3.000 na vitória e de 1.900 a 2.900 na derrota, mais 200 por abate. Quem sobrevive mantém a arma'},
    {el:'.buys p',more:true,title:'Os tipos de compra',text:'Completa: pelo menos quatro com rifle. Forçado: gastou tudo sem conseguir se armar. Parcial e Eco: o time guardou créditos para o round seguinte'},
    {el:'.settings',more:true,title:'Freezetime',text:'No automático o round começa sozinho depois da contagem. Sem Jogada de Efeito na mão ele também passa a começar sozinho, a não ser com Em todo round ligado. Escolher uma compra diferente de Auto segura o round até você começar'}
  ],
  'match:moment':[
    {el:'.moment .band',title:'Jogada de Efeito',text:'Este round será decidido num confronto. Você escolhe o seu jogador sem ver quem vem do outro lado'},
    {el:'.actors',title:'Quem vai',text:'O confronto compara os dois atributos mostrados: quem levar os dois vence, e no 1 a 1 vence o maior overall efetivo. Quem foi só volta a ficar disponível depois que os cinco tiverem ido'},
    {el:'.actor',more:true,title:'Os números',text:'Os atributos que valem neste confronto. A barra mostra de quantos por cento das outras cartas o jogador ganha'}
  ],
  postmatch:[
    {el:'.post-board',title:'Placar final',text:'K, D e A são abates, mortes e assistências. FK são os primeiros abates do round; 2K a Ace, os rounds com 2 a 5 abates. JE são os confrontos vencidos, do total a que ele foi'}
  ],
  end:[
    {el:'[data-action="copy-result"]',title:'Copiar resultado',text:'Copia um resumo da run em texto, para colar onde quiser'},
    PERIOD_OPENED
  ],
  // Opens by itself, once, on the end of the run that opens the first período (see openTour in app.js).
  periods:[PERIOD_OPENED],
  // The screens opened from the home have one balloon each.
  career:[
    {el:'.band',title:'Estatísticas',text:'O que o seu time já fez, somando todas as runs dos dois modos'}
  ],
  team:[
    {el:'.crest-stage',title:'O escudo do time',text:'Monte o escudo do seu time: ele aparece no placar e na imagem do resultado. Cada escolha vale na hora'}
  ],
  feats:[
    {el:'.feat',title:'Conquistas',text:'Quando você consegue um feito, o símbolo acende e o dia fica anotado. Conquistas não dão moedas nem bônus: são só para mostrar'}
  ],
  album:[
    {el:'.album-team',title:'Álbum de cartinhas',text:'A carta entra no álbum quando joga uma partida como titular do seu time. As que faltam aparecem escuras; a estrela marca as que já foram campeãs com você'}
  ]
};

// What the tutorial that opens by itself shows for a screen: every step except the ones marked as detail.
export const briefSteps = key=>(TOURS[key]||[]).filter(step=>!step.more);

let state=null;
const visible = el=>el&&el.getClientRects().length>0;
function place() {
  if(!state)return;
  const step=state.steps[state.index],target=document.querySelector(step.el),hole=state.root.querySelector('.tour-hole'),card=state.root.querySelector('.tour-card');
  // (a step may point at a part of its element: the overall on a card)
  const pad=8,whole=target.getBoundingClientRect(),[x,y,w,h]=step.part||[0,0,1,1];
  const r={left:whole.left+whole.width*x,top:whole.top+whole.height*y,right:whole.left+whole.width*(x+w),bottom:whole.top+whole.height*(y+h)};
  const box={left:Math.max(4,r.left-pad),top:Math.max(4,r.top-pad),right:Math.min(innerWidth-4,r.right+pad),bottom:Math.min(innerHeight-4,r.bottom+pad)};
  Object.assign(hole.style,{left:box.left+'px',top:box.top+'px',width:box.right-box.left+'px',height:box.bottom-box.top+'px'});
  // The card goes under the element when there is room, above it otherwise, and never leaves the viewport.
  const width=card.offsetWidth,height=card.offsetHeight,below=innerHeight-box.bottom>=height+20,above=box.top>=height+20;
  const top=below?box.bottom+12:above?box.top-height-12:Math.max(12,innerHeight-height-12);
  const left=Math.min(Math.max(12,(box.left+box.right)/2-width/2),innerWidth-width-12);
  Object.assign(card.style,{left:left+'px',top:top+'px'});
}
// The balloon slides to the next step, and its buttons slide with it under the pointer. A click or an arrow key that
// comes while it is still arriving is the rest of the gesture that brought the step (a double click, a finger that
// bounced, a key held down): it would skip a step nobody saw, or close the help. Such a gesture is let go by.
const SAME_GESTURE = 350;
const early = ()=>Date.now()<state.guard;
function show() {
  const {steps,index,root}=state,step=steps[index];
  root.querySelector('.tour-card').innerHTML=`<p class="tour-count">${index+1} / ${steps.length}</p><h2 id="tour-title">${step.title}</h2><p>${step.text}</p>
    <div class="tour-actions">${index?'<button class="btn small" data-tour="back">Voltar</button>':''}<button class="btn small primary" data-tour="next">${index===steps.length-1?'Entendi':'Próximo'}</button><button class="link" data-tour="off">Pular Tutorial</button></div>`;
  document.querySelector(step.el).scrollIntoView({block:'center',behavior:'instant'});
  place();
  root.querySelector('[data-tour="next"]').focus({preventScroll:true});
}
export const tourOpen = ()=>!!state;
export function closeTour() {
  if(!state)return;
  const {root,onClose}=state;state=null;root.remove();
  removeEventListener('resize',place);removeEventListener('scroll',place,true);document.removeEventListener('keydown',keys,true);
  onClose?.();
}
// One step on, or back. A step whose element is no longer on the screen leaves the walk, so the count never carries a
// number that nobody gets to see.
function move(delta) {
  let index=state.index+delta;
  while(index>=0&&index<state.steps.length&&!visible(document.querySelector(state.steps[index].el))){state.steps.splice(index,1);if(delta<0)index--;}
  if(index>=state.steps.length)return closeTour();
  state.index=Math.max(0,index);show();
  state.guard=Date.now()+SAME_GESTURE;
}
function keys(event) {
  if(event.key==='Escape'){event.preventDefault();closeTour();}
  else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();if(!early())move(event.key==='ArrowRight'?1:-1);}
}
// Starts the walkthrough for a screen: the short one when `brief` is set, the whole one otherwise. Returns false when
// nothing on the screen can be explained.
export function startTour(key,{onClose,onOff,brief=false}={}) {
  closeTour();
  const steps=(brief?briefSteps(key):TOURS[key]||[]).filter(step=>visible(document.querySelector(step.el)));
  if(!steps.length)return false;
  const root=document.createElement('div');
  root.id='tour';root.setAttribute('role','dialog');root.setAttribute('aria-labelledby','tour-title');
  root.innerHTML='<div class="tour-hole"></div><div class="tour-card"></div>';
  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-tour]')?.dataset.tour;
    if(!action||early())return;
    if(action==='off'){onOff?.();closeTour();}
    else move(action==='next'?1:-1);
  });
  document.body.append(root);
  state={steps,index:0,root,onClose,guard:0};
  addEventListener('resize',place);addEventListener('scroll',place,true);document.addEventListener('keydown',keys,true);
  show();
  return true;
}
