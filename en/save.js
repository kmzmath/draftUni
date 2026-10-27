// O que protege uma run salva quando o jogo está aberto em mais de uma aba.
// Cada gravação deixa a run uma revisão à frente (run.rev). Uma aba que ainda tem a mesma run numa revisão anterior
// ficou para trás: se gravasse, desfaria o que a outra aba fez (um pacote aberto, uma partida perdida).

// The same run: same seed and same day of the Desafio do dia (a run of the traditional mode has no day).
const sameRun = (a,b)=>a.seed===b.seed&&(a.daily||null)===(b.daily||null);
// Whether `mine`, the run a tab holds, is behind `stored`, what is saved right now. A different run is never "behind":
// a new run takes the place of the old one whatever their revisions.
export function staleSave(stored,mine) {
  if(!stored||!mine||typeof stored!=='object')return false;
  return sameRun(stored,mine)&&(stored.rev||0)>(mine.rev||0);
}
// Marks the run for one more save.
export function stampSave(run) { run.rev=(run.rev||0)+1;return run; }
