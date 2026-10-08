// As habilidades de cada agente, com os preços do jogo. Elas não mudam o que acontece dentro do round: valem pelo que
// custam, como as armas e os coletes (veja loadoutValue em engine.js), e aparecem no placar.
// c e q: as básicas, compradas por carga. e: a de assinatura, com uma carga de graça todo round e, em alguns agentes,
// cargas a mais à venda. x: a ultimate, com os pontos que pede (um por abate e um por morte).
// Each basic or signature ability is written [name, price of a charge, most charges, charges given every round].
const KITS = {
  Astra:[['Gravity Well',0,1,1],['Nova Pulse',0,1,1],['Stars',150,5,1],['Cosmic Divide',7]],  // the stars pay for the rest
  Breach:[['Aftershock',200,1],['Flashpoint',250,2],['Fault Line',0,1,1],['Rolling Thunder',8]],
  Brimstone:[['Stim Beacon',200,1],['Incendiary',250,1],['Sky Smoke',100,3,1],['Orbital Strike',8]],
  Chamber:[['Trademark',200,1],['Headhunter',100,8],['Rendezvous',0,1,1],['Tour De Force',8]],
  Clove:[['Pick-me-up',200,1],['Meddle',250,1],['Ruse',150,2,1],['Not Dead Yet',8]],
  Cypher:[['Trapwire',200,2],['Cyber Cage',100,2],['Spycam',0,1,1],['Neural Theft',7]],
  Deadlock:[['Barrier Mesh',300,1],['Sonic Sensor',200,2],['GravNet',0,1,1],['Annihilation',7]],
  Fade:[['Prowler',250,2],['Seize',200,1],['Haunt',0,1,1],['Nightfall',8]],
  Gekko:[['Mosh Pit',250,1],['Wingman',300,1],['Dizzy',0,1,1],['Thrash',8]],
  Harbor:[['Storm Surge',200,1],['High Tide',300,1],['Cove',0,1,1],['Reckoning',7]],
  Iso:[['Contingency',200,1],['Undercut',300,1],['Double Tap',0,1,1],['Kill Contract',7]],
  Jett:[['Cloudburst',200,2],['Updraft',150,1],['Tailwind',0,1,1],['Blade Storm',8]],
  'KAY/O':[['FRAG/ment',200,1],['FLASH/drive',250,2],['ZERO/point',0,1,1],['NULL/cmd',8]],
  Killjoy:[['Nanoswarm',200,2],['Alarmbot',200,1],['Turret',0,1,1],['Lockdown',9]],
  Miks:[['M-pulse',300,2],['Harmonize',200,1],['Waveform',100,2,1],['Bassquake',8]],
  Neon:[['Fast Lane',250,1],['Relay Bolt',250,1],['High Gear',0,1,1],['Overdrive',8]],
  Omen:[['Shrouded Step',100,2],['Paranoia',250,1],['Dark Cover',150,2,1],['From the Shadows',7]],
  Phoenix:[['Blaze',150,1],['Hot Hands',200,1],['Curveball',250,2,1],['Run it Back',7]],
  Raze:[['Boom Bot',300,1],['Blast Pack',200,2],['Paint Shells',0,1,1],['Showstopper',8]],
  Reyna:[['Leer',250,2],['Devour',200,2,1],['Dismiss','q'],['Empress',7]],                    // two abilities, one set of charges
  Sage:[['Barrier Orb',300,1],['Slow Orb',200,2],['Healing Orb',0,1,1],['Resurrection',7]],
  Skye:[['Regrowth',150,1],['Trailblazer',300,1],['Guiding Light',250,2,1],['Seekers',8]],
  Sova:[['Owl Drone',400,1],['Shock Bolt',150,2],['Recon Bolt',0,1,1],["Hunter's Fury",8]],
  Tejo:[['Stealth Drone',400,1],['Special Delivery',200,1],['Guided Salvo',150,2,1],['Armageddon',9]],
  Veto:[['Crosscut',200,2],['Chokehold',200,1],['Interceptor',0,1,1],['Evolution',7]],
  Viper:[['Snake Bite',300,1],['Poison Cloud',200,1],['Toxic Screen',0,1,1],["Viper's Pit",9]],
  Vyse:[['Razorvine',150,2],['Shear',200,1],['Arc Rose',0,1,1],['Steel Garden',8]],
  Waylay:[['Saturate',300,1],['Lightspeed',300,1],['Refract',0,1,1],['Convergent Paths',8]],
  Yoru:[['Fakeout',200,1],['Blindside',250,1],['Gatecrash',150,2,1],['Dimensional Drift',8]]
};
export const SLOTS = ['c','q','e'];
const ability = ([name,cost,max,free=0])=>typeof cost==='string'?{name,shared:cost}:{name,cost,max,free};
export const ABILITIES = Object.fromEntries(Object.entries(KITS).map(([agent,[c,q,e,[name,points]]])=>[agent,{c:ability(c),q:ability(q),e:ability(e),x:{name,points}}]));
// The abilities a player pays for: every one that has charges of its own.
const paid = agent=>SLOTS.map((slot,i)=>({...ABILITIES[agent][slot],i})).filter(each=>!each.shared);
// What every charge of an agent costs, the free ones aside.
export const utilityCost = agent=>paid(agent).reduce((sum,each)=>sum+(each.max-each.free)*each.cost,0);
// What a player takes into a round with a budget: the charges given for free plus the ones the budget pays for, the
// cheapest first. `charges` follows SLOTS; an ability that shares its charges with another shows the same number.
export function buyAbilities(agent,budget) {
  const kit=paid(agent),charges=SLOTS.map(slot=>ABILITIES[agent][slot].free||0);
  let spent=0;
  for(;;){
    const next=kit.filter(each=>charges[each.i]<each.max&&each.cost<=budget-spent).sort((a,b)=>a.cost-b.cost||a.i-b.i)[0];
    if(!next)break;
    charges[next.i]++;spent+=next.cost;
  }
  SLOTS.forEach((slot,i)=>{const shared=ABILITIES[agent][slot].shared;if(shared)charges[i]=charges[SLOTS.indexOf(shared)];});
  return {charges,spent};
}
// An ultimate in use counts as equipment in the round, at so many credits for each point it asks for: about three
// points of round chance between two fully armed teams, and much more for a team on an eco.
export const ULT_POINT_VALUE = 750;
export const ultValue = agent=>ABILITIES[agent].x.points*ULT_POINT_VALUE;
// The name an ability's icon is indexed under in assets.json: agent and ability, letters and digits only.
const plain = text=>text.toLowerCase().replace(/[^a-z0-9]/g,'');
export const abilityKey = (agent,name)=>`${plain(agent)}_${plain(name)}`;
