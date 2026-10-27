// Tutorial e ajuda por tela: um passo a passo que destaca cada elemento da tela e explica o que ele faz.
// As telas não trazem texto explicativo; tudo o que precisa ser explicado mora aqui.

// Cada passo aponta para um elemento (el) e traz um título e um texto. Passos cujo elemento não está na tela são pulados.
const PERIOD_OPENED = {el:'.period-opened',title:"Semester unlocked",text:"Your title unlocked a new semester: a run with the rule shown here, plus every previous rule. Choose your semester when you start your next run"};
// One balloon for each thing worth explaining, and none for what the screen already shows. A balloon is long only when
// it is about a rule of the game the player has to understand.
// Where the overall is on a card, as parts of the card: left, top, width, height (the patch of .card-ovr in styles.css).
const OVERALL = [.08,.182,.2,.09];
export const TOURS = {
  home:[
    {el:'.hero-title',title:'Univavá Draft',text:"Think you've got what it takes to coach? Build your dream team with cards of everyone who played Univavá, and lead them to glory! Go all the way through the Qualifier, Group Stage and Playoffs!"},
    {el:'.team-id',title:"Your team",text:"Give your team a name and a crest. Click the crest to design your own"},
    {el:'.mode.free',title:"Classic Mode",text:"A run of your own, as often as you like: start with a draft and play until you win the title or get eliminated"},
    {el:'.period-pips',title:"Semesters",text:"Each title unlocks a semester: a run with one more rule added to the previous ones. There are 10, and you can choose any semester you have unlocked"},
    {el:'.mode.daily',title:"Daily Challenge",text:"One run a day, the same for everyone, with only one attempt. Copy your result at the end and compare with friends. Resets at midnight Brasília time (UTC−3)"},
    {el:'.album-link',title:"Card album",text:"Every card that plays a match for your team joins the album. Think you can collect them all?"},
    {el:'.feats-link',title:"Achievements",text:"Your team's achievements are recorded here, from a 13–0 win to a championship title. Can you unlock them all?"},
    {el:'.stats-link',title:"Statistics",text:"Everything your team has done across all your runs"},
    {el:'.help',title:"Help",text:"This button explains the current screen step by step. Click it whenever you need a hand!"}
  ],
  draft:[
    {el:'.band',title:"The draft",text:"Make 6 picks: 5 starters and 1 substitute. Each time, keep 1 of 3 cards, all from different roles. Every role appears at least twice during the draft"},
    {el:'.contracts',title:"Agent contracts",text:"You can only field agents you have signed! Each player has a main and plays better on that agent. Your contracts are drawn at the start of the run, covering all four roles. Buy more agents in the shop!"},
    {el:'.offer .facts',title:"Fitting into your team",text:"The agent shown is the card's comfort pick. Try to put players on their mains! Players from the same team also have synergy and play better together!"},
    {el:'.offer .stats',title:"Attributes",text:"ACS, KAST, KPR, DPR, APR and Swing decide match showdowns. Each bar shows what percentage of the other cards this player beats in that attribute"}
  ],
  perk:[
    {el:'.perk-row',title:"Coaching Staff",text:"Choose 1 of 3 bonuses that lasts for the rest of the run. You get one after the draft and another for each stage cleared, and can buy more in the shop. Rare bonuses appear much less often"}
  ],
  'hub:lineup':[
    {el:'.path-stage.now',title:"The stage",text:"Diamonds show the wins you still need to advance; circles show how many losses you can still take"},
    {el:'.period-tag',title:"Semester",text:"This run uses the rules of this semester and every previous one. Click to see the list"},
    {el:'.stage',title:"Starters",text:"Click one player, then another, to swap them. When the bench is involved, you can compare your team's effective overall before and after, then confirm"},
    {el:'.slot .card:has(.card-ovr), .stage:not(:has(.card-ovr)) .slot .card',part:OVERALL,title:"Effective overall",text:"The rating changes with your lineup: green when a player performs above their card overall, red when they perform below it"},
    {el:'.agent-btn',title:"Agent",text:"Change a starter's agent. Before you confirm, the preview shows your team's effective overall and formation before and after"},
    {el:'.slot-team.linked',title:"Synergy",text:"A lit crest marks starters from the same team. The number is each player's bonus"},
    {el:'.staff',title:"Coaching Staff",text:"Your bonuses for this run and what each one does"},
    {el:'.bench',title:"Bench",text:"Select a card to view, swap or sell it. Selling a starter with no substitute leaves an empty slot until you buy another card"},
    {el:'.identity',title:"Formation",text:"Your five agents' roles determine your formation, which adds or removes percentage points of win chance on attack and defense. The tags show the showdowns your Power Plays draw from. The guide shows every formation"},
    {el:'.formation-strip',title:"Formation",text:"Your five agents' roles determine your formation, which adds or removes percentage points of win chance on attack and defense. The tags show the showdowns your Power Plays draw from. The guide shows every formation"},
    {el:'.panel.next',title:"Next opponent",text:"Your opponent, both teams' effective overall and their five cards. Click a card to see its attributes"},
    {el:'.prep-open',more:true,title:"Preparation",text:"Got coins left? Buy extra win chance, another Power Play or opponent scouting for the next match, or give a card +1 overall for the rest of the run"},
    {el:'[data-action="tab"][data-id="shop"]',title:"Shop",text:"Packs, market players and agent contracts. Offers change after each match"},
    {el:'[data-action="tab"][data-id="stats"]',title:'Stats',text:"Your roster's attributes and what each player has done in this run"},
    {el:'[data-action="tab"][data-id="rival"]',title:"Opponent",text:"Your next opponent, their cards and match preparation"},
    {el:'[data-action="forfeit"]',title:"FF",text:"With fewer than five starters, your team cannot play. Complete your lineup in the shop or forfeit: an automatic loss with no coins earned"}
  ],
  'hub:shop':[
    {el:'.wallet',title:"Coins",text:"Earn coins for playing matches, winning and clearing stages. Consecutive wins pay a bonus that grows with each win"},
    {el:'.packs',title:"Packs",text:"Each pack reveals 3 cards in the overall range shown. Keep 1"},
    {el:'.pack-funcao',title:"Role pack",text:"Cards from a single role, in this stage's market overall range. The role follows the order shown on the pack and advances after every match and every purchase"},
    {el:'.perk-pack',title:"Perk Pack",text:"Reveals 3 coaching staff bonuses you do not already have. Keep 1. Each pack costs 100 coins more than the previous one"},
    {el:'.market',title:"Market",text:"Want to know exactly who you're buying? The market offers players ready to join your team! Compare how your lineup would look with that card replacing a starter"},
    {el:'.agent-offers',title:"Agent contracts",text:"A contract unlocks an agent for any starter for the rest of the run. The shop tells you when someone on your roster has that agent as their comfort pick"},
    {el:'[data-action="reroll"]',title:"Refresh offers",text:"Pay to draw fresh market players and agent contracts right away"}
  ],
  // Steps marked `more` are detail: the tutorial that opens by itself skips them, the Ajuda button shows them all.
  // The scoreboard, the two teams, the squares of the rounds, the abilities and the feed of the round have no step: they
  // speak for themselves.
  'match:board':[
    {el:'.play-call',title:"Power Play",text:"You get 3 per match. Use one during freezetime to turn the round into a showdown between one of your players and an opponent: whoever wins the showdown wins the round. Save them for rounds that look lost or ones you cannot afford to lose. Your opponent has their own, too"},
    {el:'.buys',title:"Round win chance",text:"Each team's chance of winning the upcoming round. It starts with their equipment; cards, formation and bonuses add or remove percentage points. Hover over the bar or tap it to compare both teams"},
    {el:'.controls',title:"Pace",text:"Start round begins the round; during play, the same button pauses it. Speed controls are beside it"},
    {el:'.squad.us .cr',more:true,title:"Credits",text:"Each player pays for their own weapon, shields and abilities. A round pays 3,000 credits for a win and 1,900 to 2,900 for a loss, plus 200 per kill. Survivors keep their weapons"},
    {el:'.buys p',more:true,title:"Buy types",text:"Each team chooses its own buy: save credits in a round that looks lost, or spend everything when it can turn the round. Full: at least four players with rifles. Force Buy: spent everything but could not fully gear up. Partial and Eco: saved credits for the next round"},
    {el:'.settings',more:true,title:'Freezetime',text:"On automatic, the round starts when the countdown ends. With no Power Plays left, or when your opponent calls the play, the match does not wait"}
  ],
  'match:moment':[
    {el:'.moment .band',title:"Power Play",text:"This round will be decided by a showdown. Choose your player without knowing who your opponent will send"},
    {el:'.actors',title:"Who goes in",text:"The showdown compares the two attributes shown: win both to take it. If each player wins one, the higher effective overall wins. A player becomes available again only after all five have been used"},
    {el:'.actor',more:true,title:"The numbers",text:"The attributes used in this showdown. Each bar shows what percentage of the other cards this player beats"}
  ],
  postmatch:[
    {el:'.post-board',title:"Final scoreboard",text:"K, D and A are kills, deaths and assists. FK counts opening kills; 2K through Ace count rounds with 2 to 5 kills. PP shows showdowns won out of showdowns played"}
  ],
  end:[
    {el:'[data-action="copy-result"]',title:"Copy result",text:"Copy a text summary of your run to paste anywhere"},
    PERIOD_OPENED
  ],
  // Opens by itself, once, on the end of the run that opens the first período (see openTour in app.js).
  periods:[PERIOD_OPENED],
  // The screens opened from the home have one balloon each.
  career:[
    {el:'.band',title:"Statistics",text:"What your team has done across all runs in both modes"}
  ],
  team:[
    {el:'.crest-stage',title:"Your team crest",text:"Design your team crest: it appears on the scoreboard and in your result image. Each choice takes effect immediately"}
  ],
  feats:[
    {el:'.feat',title:"Achievements",text:"When you earn an achievement, its symbol lights up and the date is recorded. Achievements give no coins or bonuses: they're for bragging rights"}
  ],
  album:[
    {el:'.album-team',title:"Card album",text:"A card joins the album when it starts a match for your team. Missing cards are dark; a star marks cards that have won a title with you"}
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
    <div class="tour-actions">${index?"<button class=\"btn small\" data-tour=\"back\">Back</button>":''}<button class="btn small primary" data-tour="next">${index===steps.length-1?"Got it":"Next"}</button><button class="link" data-tour="off">Skip tutorial</button></div>`;
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
