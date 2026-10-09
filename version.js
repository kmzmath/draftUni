// Sempre na versão publicada. O site publicado leva a versão da montagem no endereço do código do jogo
// (app.js?v=..., veja scripts/make_site.mjs) e diz qual é a versão publicada num arquivo pequeno ao lado da página,
// version.json. O navegador guarda a página por um tempo, e uma aba restaurada nem chega a pedi-la de novo: por isso
// é o próprio jogo que compara as duas versões (ao abrir, ao voltar para a aba, de tempos em tempos) e se muda para a
// nova. Aqui fica o que essa conversa tem de regra; quem pergunta e quem recarrega é app.js.

export const VERSION_FILE = 'version.json';
// The published version is asked for at most this often, and a version whose address still brought the old page is
// tried again only after this long.
export const ASK_EVERY = 60_000;
export const RETRY_AFTER = 120_000;

// The build this code belongs to: the version on its own address. Null where the game is not the published site (the
// local server serves the code without one), and then nothing is ever checked.
export function runningBuild(url) {
  try{return new URL(url).searchParams.get('v')||null;}catch{return null;}
}
// What version.json says, when it says it properly.
export const readBuild = data=>data&&typeof data==='object'&&typeof data.v==='string'&&/^[0-9a-z]{6,40}$/i.test(data.v)?data.v:null;
// The address that loads a build past every cache: the page's own, with the build on it.
export function buildAddress(href,build) {
  const url=new URL(href);
  url.searchParams.set('v',build);url.hash='';
  return url.href;
}
// The same address without the build, for the address bar once the page is loaded.
export function cleanAddress(href) {
  const url=new URL(href);
  url.searchParams.delete('v');
  return url.href;
}
// Whether to move to the published build. `tried` is the last move made in this visit ({build, at}): the host may go
// on serving the old page at the new address for a moment, and the game must not reload over and over.
export function shouldSwitch({running,published,tried,now}) {
  if(!running||!published||published===running)return false;
  return !(tried&&tried.build===published&&now-tried.at<RETRY_AFTER);
}
