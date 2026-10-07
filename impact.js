// Read-only previews use the same campaign operations as the final action.
import * as C from './campaign.js?v=31930249b4';
import * as E from './engine.js?v=31930249b4';

export function teamSnapshot(run,db){
  const lineup=C.lineupSlots(run,db),composition=E.composition(lineup);
  const players=lineup.map(s=>({id:s.player.id,name:s.player.name,agent:s.agent,
    ...E.effective(s.player,s.agent,lineup,run.perks)}));
  return {players,composition,overall:E.avg(players.map(p=>p.value)),
    attack:E.teamStrength(lineup,'Ataque',{perks:run.perks}).total,
    defense:E.teamStrength(lineup,'Defesa',{perks:run.perks}).total,
    formationAttack:E.compositionBonus(lineup,'Ataque',run.perks),formationDefense:E.compositionBonus(lineup,'Defesa',run.perks)};
}
export function previewChange(run,db,change){
  const next={...run,lineup:run.lineup.map(s=>({...s})),bench:[...run.bench],pool:[...run.pool]};
  if(change.type==='agent')C.setAgent(next,db,change.id,change.agent);
  else if(change.type==='swap')C.swapPlayers(next,db,change.id,change.other);
  else if(change.type==='sell')C.sellPlayer(next,db,change.id);
  else if(change.type==='replace'){
    if(!db.byId.has(change.id))throw new Error('Carta desconhecida');
    if(!next.lineup.some(s=>s.id===change.other))throw new Error('Escolha um titular para comparar');
    if(next.lineup.some(s=>s.id===change.id))throw new Error('A carta já está entre os titulares');
    if(!next.bench.includes(change.id))next.bench.push(change.id);
    C.swapPlayers(next,db,change.other,change.id);
  }else throw new Error('Mudança desconhecida');
  return {before:teamSnapshot(run,db),after:teamSnapshot(next,db)};
}
