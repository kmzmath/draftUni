// Os sons do jogo, feitos na hora pelo navegador (Web Audio), sem arquivo de áudio para carregar.
// Por enquanto é um só: o de uma conquista que sai.

// The chime of a conquest: a major chord played one note after the other, going up, with the last one left to ring.
// Each note is its pitch (Hz), when it starts and how long it sounds (seconds): E5, G sharp 5, B5 and E6.
export const CHIME = [[659.25,0,.2],[830.61,.085,.2],[987.77,.17,.24],[1318.51,.255,.62]];
const VOLUME = .15;

// One audio context for the whole game, made the first time a sound is asked for. A browser only lets a page make
// sound after the person has touched it; a conquest always comes right after a click, so by then it is allowed.
let audio=null;
export function playChime() {
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    audio??=new Context();
    if(audio.state==='suspended')audio.resume();
    const start=audio.currentTime+.02,out=audio.createGain();
    out.gain.value=VOLUME;out.connect(audio.destination);
    for(const [pitch,at,length] of CHIME){
      // each note is a soft body with a quieter voice an octave above it, which gives it the ring of a bell
      for(const [shape,times,level] of [['triangle',1,1],['sine',2,.28]]){
        const voice=audio.createOscillator(),loud=audio.createGain();
        voice.type=shape;voice.frequency.value=pitch*times;
        loud.gain.setValueAtTime(0,start+at);
        loud.gain.linearRampToValueAtTime(level,start+at+.012);
        loud.gain.exponentialRampToValueAtTime(.001,start+at+length);
        voice.connect(loud);loud.connect(out);
        voice.start(start+at);voice.stop(start+at+length+.03);
      }
    }
  }catch{/* without sound the banner still says it all */}
}
