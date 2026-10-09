// A imagem do resultado de uma run, para copiar e colar: o desafio, o time, até onde foi, os titulares e cada partida.
// shareModel diz o que vai na imagem (texto e medidas); shareImage desenha isso num canvas e devolve o PNG.
import * as C from './campaign.js?v=b20908dbbf';

const WIDTH = 1200, MARGIN = 48, CARD = {w:200,h:320,gap:26}, ROW = 54;
const TOP = 380, CARDS_AT = TOP+34, LIST_AT = CARDS_AT+CARD.h+86, FOOT = 112;
const COLOR = {purple:'#5300eb',deep:'#230b4d',lime:'#d1f350',cream:'#fdfaf4',black:'#141414',coral:'#ff5d73',grey:'#bebebe',text:'#5f5f5f'};
const FONT = {display:'"Schabo Condensed",Impact,sans-serif',ui:'"Foundry Gridnik","Barlow",sans-serif',body:'"Barlow",sans-serif',data:'"Barlow Condensed","Arial Narrow",sans-serif'};

export function shareModel(run,team,db) {
  const wins=run.history.filter(h=>h.won).length,diff=run.history.reduce((sum,h)=>sum+h.score[0]-h.score[1],0),line=C.resultLine(run);
  const matches=run.history.map(h=>({label:h.label,opponent:h.opponent,score:h.forfeit?'W.O.':`${h.score[0]}-${h.score[1]}`,won:h.won}));
  return {
    kicker:`Univavá Draft · ${C.modeLine(run)}`,
    title:line[0].toUpperCase()+line.slice(1),champion:run.result==='champion',team:team||'Seu time',
    totals:`${wins} V · ${run.history.length-wins} D · saldo de rounds ${diff>0?'+':''}${diff}`,
    cards:C.lineupSlots(run,db).map(s=>({image:s.player.image,name:s.player.name,agent:s.agent})),
    matches,width:WIDTH,height:LIST_AT+Math.ceil(matches.length/2)*ROW+FOOT
  };
}

const picture = src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
// Text that never runs past its box: the size comes down until it fits.
function fit(c,text,family,size,max,weight=400) {
  do{c.font=`${weight} ${size}px ${family}`;}while(c.measureText(text).width>max&&(size-=2)>12);
  return size;
}
function spaced(c,px) { if('letterSpacing' in c)c.letterSpacing=`${px}px`; }
// Draws the model and resolves to a PNG blob. Browser only: it needs the page's fonts and the card images.
export async function shareImage(model) {
  const canvas=document.createElement('canvas'),c=canvas.getContext('2d'),{width:W,height:H}=model;
  canvas.width=W;canvas.height=H;
  const [cards]=await Promise.all([Promise.all(model.cards.map(card=>picture(card.image))),
    ...['400 60px "Schabo Condensed"','700 20px "Foundry Gridnik"','600 20px "Barlow"','600 20px "Barlow Condensed"','700 20px "Barlow Condensed"'].map(font=>document.fonts.load(font).catch(()=>{}))]);
  // Background: the purple of the game, lighter at the top, darker at the bottom.
  c.fillStyle=COLOR.purple;c.fillRect(0,0,W,H);
  const glow=c.createRadialGradient(W/2,-120,0,W/2,-120,900);glow.addColorStop(0,'#6d2bff');glow.addColorStop(1,'rgba(109,43,255,0)');
  c.fillStyle=glow;c.fillRect(0,0,W,H);
  const shade=c.createLinearGradient(0,H*.5,0,H);shade.addColorStop(0,'rgba(35,11,77,0)');shade.addColorStop(1,'rgba(35,11,77,.9)');
  c.fillStyle=shade;c.fillRect(0,0,W,H);
  // The lime strip that runs along the top of every Univavá banner.
  c.fillStyle=COLOR.lime;c.fillRect(0,0,W,34);
  c.fillStyle=COLOR.black;c.font=`700 14px ${FONT.ui}`;c.textBaseline='middle';spaced(c,5);
  c.fillText('2026 · UNIVAVÁ · '.repeat(12),10,18);
  // The cream band, with its cut corners: which run this is, how far it went, whose team it was.
  const x=MARGIN,y=70,w=W-2*MARGIN,h=TOP-y-36,cut=22;
  c.beginPath();c.moveTo(x+cut,y);c.lineTo(x+w-cut,y);c.lineTo(x+w,y+cut);c.lineTo(x+w,y+h-cut);c.lineTo(x+w-cut,y+h);c.lineTo(x+cut,y+h);c.lineTo(x,y+h-cut);c.lineTo(x,y+cut);c.closePath();
  c.fillStyle=COLOR.cream;c.fill();
  c.textBaseline='alphabetic';c.fillStyle=COLOR.black;c.font=`700 21px ${FONT.ui}`;spaced(c,3);
  c.fillText(model.kicker.toUpperCase(),x+40,y+52);
  spaced(c,1);c.fillStyle=COLOR.purple;
  const size=fit(c,model.title.toUpperCase(),FONT.display,150,w-80);
  c.fillText(model.title.toUpperCase(),x+38,y+92+size*.8);
  spaced(c,0);c.fillStyle=COLOR.text;fit(c,`${model.team} · ${model.totals}`,FONT.body,30,w-80,600);
  c.fillText(`${model.team} · ${model.totals}`,x+40,y+h-30);
  // The starters, centred whatever their number, each with the agent under the card.
  const row=model.cards.length*CARD.w+(model.cards.length-1)*CARD.gap;
  model.cards.forEach((card,i)=>{
    const left=(W-row)/2+i*(CARD.w+CARD.gap);
    c.save();c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=22;c.shadowOffsetY=12;
    if(cards[i])c.drawImage(cards[i],left,CARDS_AT,CARD.w,CARD.h);
    c.restore();
    c.fillStyle='#fff';c.textAlign='center';spaced(c,2);c.font=`600 22px ${FONT.data}`;
    c.fillText(card.agent.toUpperCase(),left+CARD.w/2,CARDS_AT+CARD.h+38);
  });
  // Every match, in two columns: a lime or coral edge, the game, the opponent, the score.
  c.textAlign='left';
  const half=Math.ceil(model.matches.length/2),col=(w-24)/2;
  model.matches.forEach((match,i)=>{
    const left=x+(i<half?0:col+24),top=LIST_AT+(i<half?i:i-half)*ROW;
    c.fillStyle='rgba(20,20,20,.72)';c.fillRect(left,top,col,ROW-6);
    c.fillStyle=match.won?COLOR.lime:COLOR.coral;c.fillRect(left,top,6,ROW-6);
    c.textBaseline='middle';
    c.fillStyle=COLOR.grey;spaced(c,2);c.font=`600 17px ${FONT.data}`;
    c.fillText(match.label.toUpperCase(),left+22,top+(ROW-6)/2+1);
    const labelEnd=left+22+c.measureText(match.label.toUpperCase()).width+18;
    c.fillStyle='#fff';spaced(c,0);c.textAlign='right';c.font=`400 36px ${FONT.display}`;
    c.fillText(match.score,left+col-16,top+(ROW-6)/2+2);
    const scoreStart=left+col-16-c.measureText(match.score).width-16;
    c.textAlign='left';fit(c,match.opponent,FONT.ui,18,Math.max(60,scoreStart-labelEnd),700);
    c.fillText(match.opponent,labelEnd,top+(ROW-6)/2+1);
  });
  // The signature.
  c.textBaseline='alphabetic';spaced(c,1);c.font=`400 46px ${FONT.display}`;
  c.fillStyle='#fff';c.fillText('UNIVAVÁ',x,H-40);
  c.fillStyle=COLOR.lime;c.fillText('DRAFT',x+c.measureText('UNIVAVÁ ').width,H-40);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('A imagem não pôde ser gerada')),'image/png'));
}
// Puts the image on the clipboard. Where the browser doesn't allow that, the image is saved as a file instead.
// Resolves to 'copied' or 'saved'.
export async function copyShareImage(model) {
  const image=shareImage(model);
  if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){
    try{await navigator.clipboard.write([new ClipboardItem({'image/png':image})]);return 'copied';}catch{/* falls back to saving */}
  }
  const link=document.createElement('a'),url=URL.createObjectURL(await image);
  link.href=url;link.download='univava-draft.png';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  return 'saved';
}
