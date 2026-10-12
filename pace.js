// O ritmo da partida na tela: quanto dura cada batida e quanto se espera antes de cada round.

// How long each beat of a match stays on screen at normal speed, in milliseconds, and how each speed scales it.
// buy is the time between two rounds when there is nothing to decide; start, kill and end are the beats of a round;
// call is how long the rival's Jogada de Efeito is announced for, before the freezetime of its round (the strip of
// .rival-call in styles.css lasts the same).
export const BEAT = {buy:900,start:700,kill:620,end:1150,call:1900};
export const PACE = {1:1,2:.55,4:.28};
// The freezetime the player can pick, in seconds.
export const FREEZE_OPTIONS = [1,2,3,5,10];
export const FREEZE_DEFAULT = 3;
export const cleanFreeze = value=>FREEZE_OPTIONS.includes(value)?value:FREEZE_DEFAULT;
// Whether the round starts by itself after the freezetime. By default it doesn't: it waits for the click. A saved
// "automatic" only counts when the player chose it (freezeSet), because it used to be saved as the default.
export const savedFreezeAuto = saved=>saved?.freezeSet===true&&saved.freezeAuto===true;
// What the freezetime clock shows: the whole seconds still to go, as m:ss. It reads 0:03 for the first second of a
// three-second freezetime and reaches 0:00 exactly when the time is up.
export function freezeClock(elapsed,total) {
  const left=Math.max(0,Math.ceil((total-elapsed)/1000));
  return `${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
}

// The wait before a round starts. There is a freezetime whenever there is something to decide: a Jogada de Efeito to
// call (one in hand, and none on the round yet) or the purchase of the round to order (`buyable`: see canBuy in the
// engine; it is so on a round the rival called a play on, too). With nothing to decide the round simply follows the
// last one.
// The freezetime waits for a click (wait is null) while there is a play in hand, unless the player chose the automatic
// one; with no play left it counts down by itself, a fixed number of real seconds (match speed doesn't shorten it),
// unless the player asked for the freezetime in every round (`always`), which keeps it as it is with a play in hand.
// And an order for the purchase other than the team's own (`plan`) holds the round whatever the rest: the coach is
// deciding, and the count only runs while the purchase is left to the team.
export function beforeRound({pending,plays,auto,seconds,speed,always=false,buyable=false,plan='auto'}) {
  if(!(plays>0&&!pending)&&!buyable)return {wait:BEAT.buy*PACE[speed],freeze:false};
  const waits=plan!=='auto'||(!auto&&(plays>0||always));
  return {wait:waits?null:seconds*1000,freeze:true};
}
// The announcement of the rival's play is a thing to read: the speed of the match doesn't shorten it.
export const callBeat = ()=>BEAT.call;
// How many kills are on screen when a round starts. The freezetime already showed the buys, so the round opens on its
// first kill instead of showing them once more.
export const openingKills = kills=>Math.min(1,kills);
// How long the round on screen stays on its current beat: the buy, one more kill, or the result.
export const playbackBeat = (shown,kills,speed)=>(shown===0?BEAT.start:shown<kills?BEAT.kill:BEAT.end)*PACE[speed];
