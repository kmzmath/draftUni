// Tutorial e ajuda por tela: um passo a passo que destaca cada elemento da tela e explica o que ele faz.
// As telas não trazem texto explicativo; tudo o que precisa ser explicado mora aqui.

// Cada passo aponta para um elemento (el) e traz um título e um texto. Passos cujo elemento não está na tela são pulados.
const PERIOD_OPENED = {el:'.period-opened',title:'Período liberado',text:'O título abriu um período novo no modo tradicional. Nele vale a regra mostrada aqui, somada às de todos os períodos anteriores: são 10 no total. Na próxima run você escolhe em qual período jogar'};
export const TOURS = {
  home:[
    {el:'.hero-title',title:'Univavá Draft',text:'Você é um bom técnico? Tente montar seu time dos sonhos com as cartinhas de todo mundo que jogou o Univavá, e leve seu time à glória! Passando pelo caminho completo: classificatória, fase de grupos e Playoffs!'},
    {el:'.team-name',title:'Seu time',text:'Dê um nome ao seu time. Ele aparece no placar das partidas e pode ser trocado aqui quando quiser'},
    {el:'.mode.free',title:'Modo tradicional',text:'Uma run sorteada só para você, quantas vezes quiser. Cada run começa com um draft novo e termina no título ou na eliminação'},
    {el:'.period-pips',title:'Períodos',text:'Cada título no modo tradicional abre um período: uma run com uma regra a mais, que se soma às dos períodos anteriores. São 10, do 1º ao 10º. Ao começar uma run você escolhe em qual jogar, entre os que já abriu. Os losangos acesos são os períodos que você já venceu. O Desafio do dia não tem períodos'},
    {el:'.mode.daily',title:'Desafio do dia',text:'Uma run por dia, igual para todo mundo: os mesmos contratos, o mesmo draft, os mesmos bônus oferecidos e os mesmos rivais. Só dá para jogar uma vez. No fim, copie o resultado para comparar com os amigos. O desafio vira à meia-noite de Brasília. As duas runs ficam salvas, cada uma no seu lugar: dá para fechar o jogo e continuar depois'},
    {el:'.career',title:'Seu histórico',text:'Runs jogadas, títulos e a melhor campanha até agora, somando os dois modos'},
    {el:'.album-link',title:'Álbum de cartinhas',text:'Toda carta que joga uma partida pelo seu time entra no álbum. Acha que consegue colecionar todo mundo?'},
    {el:'.feats-link',title:'Conquistas',text:'Os feitos do seu time ficam marcados aqui, do 13 a 0 ao título. Consegue completar todas?'},
    {el:'.stats-link',title:'Estatísticas',text:'Tudo o que o seu time já fez, somando todas as runs: as cartas e as equipes que você mais usou, as vitórias por fase, os rivais que mais enfrentou e o desempenho nos confrontos'},
    {el:'.help',title:'Ajuda',text:'Este botão explica a tela em que você estiver, passo a passo. Sempre que precisar de uma ajudinha é só clicar!'}
  ],
  draft:[
    {el:'.band',title:'O draft',text:'São 6 escolhas: 5 titulares e 1 reserva. Em cada uma você fica com 1 de 3 cartas, sempre de funções diferentes. Cada função aparece pelo menos 2 vezes ao longo do draft'},
    {el:'.contracts',title:'Contratos de agente',text:'Você só pode pickar agentes que você tem o contrato! Cada jogador tem seu main e joga melhor com ele. Estes foram sorteados para esta run, com todas as funções. Você pode comprar novos agentes na loja!'},
    {el:'.offer',title:'A carta',text:'Overall, equipe e atributos do jogador. Clique na carta ou em Escolher para ficar com ela'},
    {el:'.offer .facts',title:'Encaixe no seu time',text:'O agente mostrado é o de conforto da carta. Tente usar os mains dos jogadores! Além disso, jogadores da mesma equipe possuem sinergia e jogam melhor juntos!'},
    {el:'.offer .stats',title:'Atributos',text:'ACS, KAST, KPR, MPR, APR e Swing decidem os confrontos da partida. A barrinha mostra de quantos por cento das demais cartas do jogo o jogador ganha em cada stat: cheia só para o melhor do jogo, vazia para o pior!'},
    {el:'.draft-roster',title:'Seu elenco',text:'As escolhas aparecem aqui com overall, função, agente de conforto e equipe. Clique numa carta para ver os detalhes'}
  ],
  perk:[
    {el:'.perk-row',title:'Comissão técnica',text:'Escolha 1 de 3 bônus. Ele vale até o fim da run. Você ganha um depois do draft e outro a cada fase vencida, e pode comprar mais na loja, no pacote de vantagens: não há limite. Os bônus marcados como Raro aparecem bem menos nas ofertas'}
  ],
  'hub:lineup':[
    {el:'.band',title:'A fase',text:'O jogo da vez e seu saldo de vitórias e derrotas nesta fase. Os losangos no topo mostram quantas vitórias faltam para avançar; os círculos, quantas derrotas ainda cabem'},
    {el:'.period-tag',title:'Período',text:'Esta run é de um período: valem a regra dele e as de todos os anteriores. Clique aqui para ver a lista'},
    {el:'.stage',title:'Titulares',text:'Os cinco que entram na partida. Clique em um jogador e depois em outro para trocar. Quando envolve o banco, você vê quem sai, quem entra e o overall efetivo do time antes e depois, e então confirma'},
    {el:'.slot .card',title:'Overall efetivo',text:'A Nota de cada jogador muda conforme a escalação: verde quando o jogador rende mais que o overall original, vermelho quando rende menos'},
    {el:'.slot .mods:not(:empty)',title:'De onde vem a mudança',text:'Conforto +1: o jogador está no agente mais jogado dele. Equipe: +1 para cada outro titular da mesma equipe, então dois juntos valem +1 cada, três valem +2, quatro +3 e os cinco +4. Função secundária -1. Fora da função -3'},
    {el:'.agent-btn',title:'Agente',text:'Escolha um agente contratado para comparar. A prévia mostra o overall efetivo do time antes e depois, e a formação quando ela muda. Se o agente já estiver em uso, ela inclui a troca entre os dois titulares'},
    {el:'.slot-team.linked',title:'Sinergia',text:'O escudo aceso marca os titulares da mesma equipe, e o número embaixo dele é o bônus que cada um deles recebe'},
    {el:'.staff',title:'Comissão técnica',text:'Os bônus desta run, com o que cada um faz. Você ganha um depois do draft e outro a cada fase vencida, e pode comprar mais na loja'},
    {el:'.bench',title:'Banco',text:'Reservas e vagas livres. Selecione uma carta para ver, trocar de lugar ou vender. Qualquer carta pode ser vendida, inclusive um titular sem reserva: a vaga fica aberta até você comprar outra carta'},
    {el:'.identity',title:'Formação',text:'As funções dos cinco agentes definem a identidade do time. Os números são pontos de chance por round no ataque e na defesa. As etiquetas mostram os confrontos que mais saem nas Jogadas de Efeito com esta formação. Ficar sem uma função custa pontos. O botão Guia de formações mostra todas as formações que existem, como montar cada uma e o que cada uma dá'},
    {el:'.panel.next',title:'Próximo adversário',text:'Aqui você pode ver seu próximo adversário, o overall efetivo dos dois lados e as cinco cartas rivais. Clique numa carta para ver os atributos. Todo rival joga com a sinergia da sua equipe'},
    {el:'[data-action="tab"][data-id="shop"]',title:'Loja',text:'Pacotes, mercado e contratos de agente. As ofertas mudam a cada partida'},
    {el:'[data-action="tab"][data-id="stats"]',title:'Stats',text:'Uma tabela com tudo sobre o seu elenco: overall da carta e efetivo, os seis atributos e o que cada jogador fez nas partidas desta run'},
    {el:'[data-action="play"]',title:'Jogar',text:'Quando a escalação estiver pronta, comece a partida'},
    {el:'[data-action="forfeit"]',title:'W.O.',text:'Com menos de cinco titulares o time não joga. Complete o time na loja, ou perca a partida por W.O.: derrota automática, sem moedas'}
  ],
  'hub:shop':[
    {el:'.wallet',title:'Moedas',text:'Você ganha moedas por partida disputada, por vitória e por fase vencida. Vencer logo depois de outra vitória paga um bônus de sequência, que cresce a cada vitória seguida. Se vencer a fase antes do último jogo, recebe também pelas partidas que sobraram'},
    {el:'.packs',title:'Pacotes',text:'Cada pacote revela 3 cartas da faixa de overall indicada, você escolhe 1'},
    {el:'.pack-funcao',title:'Pacote de função',text:'Só traz cartas de uma função, na faixa de overall do mercado desta fase. Cada partida traz um, de uma função sorteada. Ao comprar, aparece no lugar o pacote de outra função'},
    {el:'.perk-pack',title:'Pacote de vantagens',text:'Abre 3 bônus da comissão técnica que o seu time ainda não tem, e você fica com 1. Não há limite de bônus, mas cada pacote custa 100 moedas a mais que o anterior, até o fim da run'},
    {el:'.market',title:'Mercado',text:'Prefere saber exatamente quem você vai comprar? O mercado traz jogadores prontos para jogar pelo seu time! Você pode comparar como sua equipe ficaria ao substituir um titular por essa carta'},
    {el:'.agent-offers',title:'Contratos de agente',text:'O contrato libera o agente para qualquer titular até o fim da run. A loja avisa quando alguém do elenco tem conforto nele'},
    {el:'[data-action="reroll"]',title:'Trocar ofertas',text:'Paga para sortear novas ofertas de mercado e de contratos agora'}
  ],
  // Steps marked `more` are detail: the tutorial that opens by itself skips them, the Ajuda button shows them all.
  'match:board':[
    {el:'.arena',title:'Placar',text:'Vence quem fizer 13 rounds com 2 de vantagem, e os lados trocam depois do round 12. Antes de cada round, o centro do placar mostra o freezetime: a partida espera, e é a hora de decidir se você usa uma Jogada de Efeito'},
    {el:'.play-call',title:'Jogada de Efeito',text:'Cada time tem 3 por partida; os losangos mostram quantas restam. Use durante o freezetime: o round vira um confronto entre um jogador seu e um do rival, e quem vencer o confronto leva o round. Guarde para um round que parece perdido, como um eco, ou para um que não pode escapar. O rival faz a mesma conta: usa as dele principalmente quando entra pior armado'},
    {el:'.buys',title:'Chance do round',text:'A barra mostra a chance de cada time no round que vai começar, e em cada ponta o nome da compra do time. A chance parte do equipamento: a parte de cada time no valor das armas, dos coletes e das habilidades que os dois levam, com as ultimates em uso contando mais ou menos como um rifle. As cartas, a formação e a comissão técnica somam ou tiram pontos a partir daí. Ela fica sempre entre 8% e 92%. Deixe o ponteiro na barra, ou toque nela, para ver a conta deste round, parte por parte; no nome da compra, o que o time leva'},
    {el:'.squad.us',title:'Seu time',text:'Abates, mortes, assistências, créditos, habilidades, arma e colete de cada jogador, na ordem dos abates. O losango ao lado do nome mostra quem ainda pode ir a um confronto'},
    {el:'.controls',title:'Ritmo',text:'O round começa quando você clica em Começar round. Com ele em andamento, o mesmo botão pausa a partida. Ao lado fica a velocidade. Em Ajustes dá para ligar o automático, em que o round começa sozinho depois de uma contagem'},
    {el:'.timeline',more:true,title:'Rounds',text:'Cada quadrado é um round: verde é round vencido, vermelho é round perdido. O ícone mostra como o round acabou. O losango marca um round com Jogada de Efeito: verde quando foi sua, vermelho quando foi do rival'},
    {el:'.squad.us .cr',more:true,title:'Créditos',text:'Cada jogador tem os próprios créditos e paga a arma, o colete e as habilidades pelos preços do jogo. O round rende 3.000 na vitória e de 1.900 a 2.900 na derrota, mais 200 por abate e 300 para quem ataca quando a spike é plantada. Quem sobrevive mantém a arma, e todo mundo compra colete e habilidades de novo a cada round; quem perde guardando a arma recebe só 1.000'},
    {el:'.squad.us td.ab .abis',more:true,title:'Habilidades',text:'Os quatro ícones são as habilidades do agente. A linha embaixo de cada um mostra quantas cargas o jogador leva para o round, e o ícone fica apagado quando não há nenhuma. A de assinatura tem sempre uma carga de graça; as outras são compradas depois da arma e do colete. O último ícone é a ultimate: a linha enche com um ponto por abate e um por morte, e com todos os pontos ela é usada no round seguinte, quando o ícone acende. Na troca de lado os pontos voltam a zero, como os créditos, e na prorrogação ninguém tem ultimate'},
    {el:'.squad.us .abis.narrow',more:true,title:'Habilidades',text:'Os quatro ícones são as habilidades do agente. A linha embaixo de cada um mostra quantas cargas o jogador leva para o round, e o ícone fica apagado quando não há nenhuma. A de assinatura tem sempre uma carga de graça; as outras são compradas depois da arma e do colete. O último ícone é a ultimate: a linha enche com um ponto por abate e um por morte, e com todos os pontos ela é usada no round seguinte, quando o ícone acende. Na troca de lado os pontos voltam a zero, como os créditos, e na prorrogação ninguém tem ultimate'},
    {el:'.buys p',more:true,title:'Os tipos de compra',text:'O time decide junto. Completa: pelo menos quatro com rifle. Eco e Parcial: cada um gasta só o que ainda deixa um rifle e um colete pesado para o round seguinte. Forçado: gasta tudo sem conseguir se armar, porque o round não pode esperar ou porque resolveu arriscar'},
    {el:'.feed',more:true,title:'O round',text:'Os abates acontecem um a um: quem eliminou quem, e com qual arma. No fim aparece quem levou o round'},
    {el:'.settings',more:true,title:'Freezetime',text:'Por padrão o round só começa quando você clica em Começar round. Com o automático ligado, ele começa sozinho quando a contagem chega ao fim; 3 segundos é o padrão, e a velocidade da partida não muda esse tempo. Sem jogadas na mão, ou quando a jogada do round é do rival, não há espera'}
  ],
  'match:moment':[
    {el:'.moment .band',title:'Jogada de Efeito',text:'Este round vai ser decidido num confronto. A faixa diz quem chamou a jogada, você ou o rival; nos dois casos é você quem escolhe o seu jogador, sem ver quem vem do outro lado'},
    {el:'.actors',title:'Quem vai',text:'O confronto compara os dois atributos mostrados acima das cartas: quem levar os dois vence, e em 1 a 1 vence o maior overall efetivo. Vencer ganha o round; perder entrega o round. Quem foi fica indisponível até os cinco terem ido'},
    {el:'.actor',more:true,title:'Os números',text:'Os números grandes de cada carta são os atributos que valem neste confronto, e a barra mostra de quantos por cento das outras cartas do jogo o jogador ganha nisso'}
  ],
  postmatch:[
    {el:'.post-head',title:'Resultado',text:'O placar final e o adversário'},
    {el:'.mvp',title:'Destaque',text:'Seu jogador com a melhor partida, com abates, mortes e assistências'},
    {el:'.post-board',title:'Placar final',text:'O que cada jogador fez na partida, em ordem de abates. K, D e A são abates, mortes e assistências, e +/- é o saldo entre abates e mortes. FK conta os rounds em que ele fez o primeiro abate. 2K, 3K, 4K e Ace contam os rounds em que ele fez 2, 3, 4 ou 5 abates. JE mostra os confrontos das Jogadas de Efeito que ele venceu, do total a que foi'},
    {el:'.rewards',title:'Moedas',text:'O que a partida rendeu e quantos confrontos você venceu nas Jogadas de Efeito, suas e do rival'}
  ],
  end:[
    {el:'.band',title:'Fim da run',text:'Até onde a campanha chegou'},
    {el:'.history',title:'Campanha',text:'Todas as partidas da run, com adversário e placar'},
    {el:'[data-action="copy-result"]',title:'Copiar resultado',text:'Copia um resumo em texto: até onde o time foi, cada partida como um quadrado verde ou vermelho, vitórias, derrotas e saldo de rounds. É só colar onde quiser'},
    PERIOD_OPENED,
    {el:'[data-action="new-run"]',title:'De novo',text:'Uma nova run começa com outro sorteio de contratos e outro draft'}
  ],
  // Opens by itself, once, on the end of the run that opens the first período (see openTour in app.js).
  periods:[PERIOD_OPENED],
  career:[
    {el:'.band',title:'Estatísticas',text:'As partidas que o seu time já disputou e a parte delas que venceu, somando todas as runs dos dois modos'},
    {el:'.stats-tabs',title:'Quatro abas',text:'Campanha mostra onde as runs acabaram e as vitórias por fase. Elenco, as cartas, as equipes, as formações e os agentes que você mais usou. Rivais, os times que mais enfrentou. Confrontos, como o time se sai nas Jogadas de Efeito'},
    {el:'.stat-panel',title:'Como ler',text:'Cada coluna tem o seu nome. Uso (ou Frequência, ou Parte) é quanto aquilo apareceu: a barra e a porcentagem são a parte dele no total de partidas, runs ou confrontos. Depois vem quantas vezes foi, e Vitórias é a parte dessas vezes que você venceu. As cartas e as equipes vêm do álbum, e tocar numa carta abre a carta'}
  ],
  feats:[
    {el:'.band',title:'Conquistas',text:'Quantos feitos você já marcou, somando o Desafio do dia e o modo tradicional'},
    {el:'.feat',title:'Um feito',text:'Cada conquista diz o que pede. Quando você consegue, o símbolo acende e o dia fica anotado. Conquistas não dão moedas nem bônus: são só para mostrar'}
  ],
  album:[
    {el:'.band',title:'Álbum de cartinhas',text:'Quantas cartas você já tem, quantas já foram campeãs com você e quantas equipes estão completas'},
    {el:'.album-team',title:'Uma equipe',text:'As cartas de cada equipe, do maior overall para o menor. A carta entra no álbum quando joga uma partida como titular do seu time, em qualquer modo. As que faltam aparecem escuras. A estrela marca as que já foram campeãs com você'},
    {el:'.album-card',title:'A carta',text:'Clique para ver a carta inteira e o que ela já fez pelo seu time: partidas, vitórias e títulos'},
    {el:'.album-filters',title:'Filtro',text:'Mostra todas, só as que você tem, só as que faltam ou só as campeãs'}
  ]
};

// What the tutorial that opens by itself shows for a screen: every step except the ones marked as detail.
export const briefSteps = key=>(TOURS[key]||[]).filter(step=>!step.more);

let state=null;
const visible = el=>el&&el.getClientRects().length>0;
function place() {
  if(!state)return;
  const step=state.steps[state.index],target=document.querySelector(step.el),hole=state.root.querySelector('.tour-hole'),card=state.root.querySelector('.tour-card');
  const pad=8,r=target.getBoundingClientRect();
  const box={left:Math.max(4,r.left-pad),top:Math.max(4,r.top-pad),right:Math.min(innerWidth-4,r.right+pad),bottom:Math.min(innerHeight-4,r.bottom+pad)};
  Object.assign(hole.style,{left:box.left+'px',top:box.top+'px',width:box.right-box.left+'px',height:box.bottom-box.top+'px'});
  // The card goes under the element when there is room, above it otherwise, and never leaves the viewport.
  const width=card.offsetWidth,height=card.offsetHeight,below=innerHeight-box.bottom>=height+20,above=box.top>=height+20;
  const top=below?box.bottom+12:above?box.top-height-12:Math.max(12,innerHeight-height-12);
  const left=Math.min(Math.max(12,(box.left+box.right)/2-width/2),innerWidth-width-12);
  Object.assign(card.style,{left:left+'px',top:top+'px'});
}
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
function move(delta) {
  if(state.index+delta>=state.steps.length)return closeTour();
  state.index=Math.max(0,state.index+delta);show();
}
function keys(event) {
  if(event.key==='Escape'){event.preventDefault();closeTour();}
  else if(event.key==='ArrowRight'){event.preventDefault();move(1);}
  else if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
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
    if(action==='next')move(1);else if(action==='back')move(-1);else if(action==='off'){onOff?.();closeTour();}
  });
  document.body.append(root);
  state={steps,index:0,root,onClose};
  addEventListener('resize',place);addEventListener('scroll',place,true);document.addEventListener('keydown',keys,true);
  show();
  return true;
}
