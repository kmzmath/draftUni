// Read-only previews use the same campaign operations as the final action.
import * as C from './campaign.js?v=0a83137a2f';
import * as E from './engine.js?v=0a83137a2f';

export function teamSnapshot(run,db){
  const lineup=C.lineupSlots(run,db),composition=E.composition(lineup);
  const players=lineup.map(s=>({id:s.player.id,name:s.player.name,agent:s.agent,
    ...E.effective(s.player,s.agent,lineup,run.perks)}));
  return {players,composition,overall:E.avg(players.map(p=>p.value)),
    attack:E.teamStrength(lineup,"Attack",{perks:run.perks}).total,
    defense:E.teamStrength(lineup,"Defense",{perks:run.perks}).total,
    formationAttack:E.compositionBonus(lineup,"Attack",run.perks),formationDefense:E.compositionBonus(lineup,"Defense",run.perks)};
}
// The change is made on a copy of the run, whole: a run is plain JSON (see campaign.js), and an operation may touch
// any part of it (a sale also takes the training of the card and its mark of a card just out of a pack).
export function previewChange(run,db,change){
  const next=JSON.parse(JSON.stringify(run));
  if(change.type==='agent')C.setAgent(next,db,change.id,change.agent);
  else if(change.type==='swap')C.swapPlayers(next,db,change.id,change.other);
  else if(change.type==='sell')C.sellPlayer(next,db,change.id);
  else if(change.type==='replace'){
    if(!db.byId.has(change.id))throw new Error("Unknown card");
    if(!next.lineup.some(s=>s.id===change.other))throw new Error("Choose a starter to compare");
    if(next.lineup.some(s=>s.id===change.id))throw new Error("This card is already in your starting lineup");
    if(!next.bench.includes(change.id))next.bench.push(change.id);
    C.swapPlayers(next,db,change.other,change.id);
  }else throw new Error("Unknown change");
  return {before:teamSnapshot(run,db),after:teamSnapshot(next,db)};
}
