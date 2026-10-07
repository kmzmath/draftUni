// O álbum de cartinhas: o que o jogador já fez com cada carta, guardado entre as runs.
// É um mapa de id da carta para {m, w, t}: partidas disputadas como titular, vitórias e títulos.

// Stamps the starters of a match that was actually played. A W.O. stamps nobody.
export function stamp(album,ids,{won=false,title=false}={}) {
  for(const id of ids){
    const entry=album[id]??={m:0,w:0,t:0};
    entry.m++;if(won)entry.w++;if(title)entry.t++;
  }
  return album;
}
// How a card stands in the album: never fielded, fielded, or champion with it at least once.
export const cardStatus = (album,id)=>!album[id]?'missing':album[id].t>0?'champion':'have';
// A saved album is only trusted for cards that still exist and counts that make sense.
export function cleanAlbum(raw,byId) {
  const album={},count=n=>Number.isInteger(n)&&n>=0;
  if(!raw||typeof raw!=='object')return album;
  for(const [id,entry] of Object.entries(raw)){
    if(byId.has(id)&&entry&&count(entry.m)&&entry.m>0&&count(entry.w)&&count(entry.t)&&entry.w<=entry.m&&entry.t<=entry.w)album[id]={m:entry.m,w:entry.w,t:entry.t};
  }
  return album;
}
// The album page by page: totals, and every team in alphabetical order with its cards from the highest overall down.
export function albumSummary(album,players) {
  const groups=new Map();
  for(const p of players){if(!groups.has(p.team))groups.set(p.team,[]);groups.get(p.team).push(p);}
  const teams=[...groups].map(([team,cards])=>{
    const have=cards.filter(p=>album[p.id]).length;
    return {team,cards:[...cards].sort((a,b)=>b.ovr-a.ovr||a.name.localeCompare(b.name,'pt-BR')),total:cards.length,have,complete:have===cards.length};
  }).sort((a,b)=>a.team.localeCompare(b.team,'pt-BR'));
  return {total:players.length,have:players.filter(p=>album[p.id]).length,champions:players.filter(p=>album[p.id]?.t>0).length,
    complete:teams.filter(t=>t.complete).length,teams};
}
