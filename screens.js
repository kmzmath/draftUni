// As telas do jogo. Cada função recebe o contexto (base, run, partida, estado de interface) e devolve HTML.
// As telas mostram dados e ações; as explicações ficam no tutorial (tour.js).
import * as E from './engine.js?v=7b9b1b6e5a';
import * as C from './campaign.js?v=7b9b1b6e5a';
import {previewChange} from './impact.js?v=7b9b1b6e5a';
import {FREEZE_OPTIONS,freezeClock} from './pace.js?v=7b9b1b6e5a';
import {albumSummary,cardStatus} from './album.js?v=7b9b1b6e5a';
import * as A from './achievements.js?v=7b9b1b6e5a';
import * as ST from './stats.js?v=7b9b1b6e5a';
import * as B from './abilities.js?v=7b9b1b6e5a';
import {esc,num,signed,statText,statLabel,meter,stats,tierOf,roleKey,roleIcon,roleTag,formationIcon,achievementIcon,agentIcon,abilityIcon,agentChip,coin,cardArt,teamColor,teamInfo,teamLogo,teamFlag,teamMark,roundIcon,brandArt,mapFor,cutout,hasPhoto,mug,weapon,ticker,STAT_HELP} from './ui.js?v=7b9b1b6e5a';

const plural = (n,one,many)=>`${n} ${n===1?one:many}`;
const names = list=>list.map(p=>esc(p.name)).join(list.length===2?' e ':', ');
// What a buy button says: the action with its price, or why it can't be done. When coins are short the price stays.
const buyLabel = (action,price,blocked)=>blocked==='Faltam moedas'?`<span>Faltam moedas</span>${coin(price)}`:blocked||`${action} ${coin(price)}`;
// The Jogadas de Efeito a team still has in the match, as lit and unlit marks.
const playPips = (left,total)=>`<span class="plays" role="img" aria-label="Jogadas de Efeito: ${left} de ${total}">${Array.from({length:total},(_,i)=>`<i class="${i<left?'on':''}"></i>`).join('')}</span>`;
const capital = text=>text[0].toUpperCase()+text.slice(1);
// The name the player gave the team on the first screen.
const ourName = ctx=>esc(ctx.team||'Seu time');
const effectiveOf = (slot,lineup,perks=[])=>E.effective(slot.player,slot.agent,lineup,perks).value;
const effectiveAvg = (lineup,perks=[])=>E.avg(lineup.map(s=>effectiveOf(s,lineup,perks)));
// Brand pictures from the Univavá site (crest, stickers). Each one is simply absent when the art is not installed.
const mark = (key,name,alt='')=>brandArt(key)?`<img class="${name}" src="${esc(brandArt(key))}" alt="${esc(alt)}" draggable="false">`:'';
const crest = ()=>mark('crest','crest');
// The cream banner used by the tournament: lime ticker on top, purple headline.
const band = (kicker,title,note='',kind='')=>`<header class="band ${kind}">${ticker()}<div class="band-body"><div><p class="band-kicker">${kicker}</p><h1>${title}</h1></div>${note?`<p class="band-note">${note}</p>`:''}</div></header>`;
// How an eliminated run reads, by where it stopped.
const exitLine = run=>capital(C.resultLine(run));
// Team name with logo, state flag and university.
function teamLine(name) {
  const t=teamInfo(name);
  return `<p class="team-line">${teamLogo(name)}<span><b>${esc(name)}</b><small ${t.org?`data-tip="${esc(t.org)}"`:''}>${teamFlag(name)}${esc([t.orgTag,t.state].filter(Boolean).join(' · '))}</small></span></p>`;
}

// ---------- Moldura ----------
function path(run) {
  return `<ol class="path" aria-label="Campanha">${C.stagesOf(run).map((stage,i)=>{
    const record=run.record[i],state=run.result==='champion'||i<run.stage?'done':i===run.stage?'now':'next';
    const pips=(count,filled,kind)=>Array.from({length:count},(_,n)=>`<i class="pip ${kind} ${n<filled?'on':''}"></i>`).join('');
    return `<li class="path-stage ${state}"><span class="path-name">${stage.name}</span><span class="pips" role="img" aria-label="${record.w} de ${stage.wins} vitórias, ${record.l} de ${stage.losses} derrotas">${pips(stage.wins,record.w,'win')}<i class="pip-gap"></i>${pips(stage.losses,record.l,'loss')}</span></li>`;
  }).join('')}</ol>`;
}
export function chrome(ctx,content) {
  const run=ctx.run,inRun=run&&!['home','album','feats','career'].includes(ctx.screen);
  return `<header class="ribbon"><div class="ribbon-bar">
    <button class="brand" data-action="home" ${ctx.screen==='match'?'disabled':''} aria-label="Univavá Draft: tela inicial">${crest()}<b>UNIVAVÁ</b><em>DRAFT</em></button>
    ${inRun?path(run):'<span class="ribbon-fill"></span>'}
    <div class="ribbon-end">${inRun&&run.daily?`<span class="mode-tag" data-tip="Desafio do dia ${C.dayLabel(run.daily)}">Desafio #${C.dailyNumber(run.daily)}</span>`:''}${
      inRun&&run.ascension?`<button class="mode-tag period-tag" data-action="period-rules"${ctx.screen==='match'?' disabled':''} aria-label="${C.periodName(run.ascension)}: regras desta run"><b>${run.ascension}º</b><span> período</span></button>`:''}${inRun?`<span class="wallet" data-tip="Moedas da run">${coin(run.coins)}</span>`:''}<button class="help" data-action="help" aria-label="Ajuda: explica esta tela passo a passo"><i aria-hidden="true">?</i>Ajuda</button></div>
  </div>${ticker()}</header>
  <main id="main" class="screen screen-${ctx.screen}">${content}</main>`;
}

// ---------- Início ----------
// The first screen offers the two ways to play, side by side: the traditional mode first, then the Desafio do dia (one
// run a day, the same for everybody). Each tile shows where that run stands and what can be done with it. Once a título has
// opened the períodos, the tile of the traditional mode also carries ten marks: the períodos already won.
function modes(ctx) {
  const {slots,today,career}=ctx,free=slots.free,daily=slots.daily;
  const going=daily&&daily.status!=='over',day=going?daily.daily:today;
  const done=going?'':daily?.daily===today?C.resultLine(daily):career.daily[today]?.line||'';
  const freeOn=free&&free.status!=='over',periods=C.periodsOf(career);
  return `<div class="modes">
    <article class="mode free"><p class="eyebrow">${free?C.modeLine(free):'Modo tradicional'}</p>
      <h2>${esc(capital(free?C.resultLine(free):'nenhuma run'))}</h2>${
        periods.period?`<span class="period-pips" role="img" aria-label="Períodos vencidos: ${periods.cleared} de ${C.PERIODS}">${Array.from({length:C.PERIODS},(_,i)=>`<i class="pip win${i<periods.cleared?' on':''}"></i>`).join('')}</span>`:''}
      <div class="mode-actions">${freeOn?'<button class="btn primary big" data-action="continue">Continuar run</button><button class="btn" data-action="new-run">Nova run</button>'
        :'<button class="btn primary big" data-action="new-run">Começar run</button>'}</div></article>
    <article class="mode daily"><p class="eyebrow">Desafio do dia · #${C.dailyNumber(day)} · ${C.dayLabel(day)}</p>
      <h2>${esc(capital(going?C.resultLine(daily):done||'ainda não jogado'))}</h2>
      <div class="mode-actions">${going?'<button class="btn primary big" data-action="daily">Continuar desafio</button><button class="link" data-action="daily-quit">Desistir</button>'
        :done?'<button class="btn" data-action="copy-result" data-id="daily">Copiar resultado</button>'
        :'<button class="btn primary big" data-action="daily">Jogar desafio</button>'}</div></article>
  </div>`;
}
export function home(ctx) {
  const {career}=ctx,summary=albumSummary(ctx.album,ctx.db.players),feats=A.count(ctx.feats),matches=ST.played(ctx.album).n;
  return `<section class="hero">
    <div class="hero-copy">
      ${mark('lockup','lockup','Valorant Universitário')||'<p class="eyebrow">Valorant universitário</p>'}
      <h1 class="hero-title">UNIVAVÁ <em>DRAFT</em></h1>
      <label class="team-name"><span>Seu time</span><input data-input="team" value="${esc(ctx.team)}" maxlength="24" placeholder="Nome do time" autocomplete="off" spellcheck="false" enterkeyhint="done"></label>
      ${modes(ctx)}
      <div class="hero-foot">
        <dl class="career"><div><dt>Runs</dt><dd>${career.runs}</dd></div><div><dt>Títulos</dt><dd>${career.titles}</dd></div><div><dt>Melhor campanha</dt><dd>${esc(career.best||'-')}</dd></div></dl>
        <button class="album-link" data-action="album" aria-label="Álbum de cartinhas: ${summary.have} de ${summary.total}"><span>Álbum</span><b>${summary.have}<small> / ${summary.total}</small></b></button>
        <button class="album-link feats-link" data-action="feats" aria-label="Conquistas: ${feats.have} de ${feats.total}"><span>Conquistas</span><b>${feats.have}<small> / ${feats.total}</small></b></button>
        <button class="album-link stats-link" data-action="career" aria-label="Estatísticas: ${matches} partidas"><span>Estatísticas</span><b>${num(matches)}<small> ${matches===1?'partida':'partidas'}</small></b></button>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">
      ${mark('stamp','sticker stamp')}
      <div class="hero-fan">${ctx.showcase.map((p,i)=>`<img class="card" style="--i:${i}" src="${p.image}" alt="" width="450" height="720">`).join('')}</div>
      ${mark('pennant','sticker pennant')}${mark('finger','sticker finger')}${mark('oval','sticker oval')}
    </div>
  </section>`;
}

// ---------- Draft ----------
function facts(player,pool,others) {
  const owned=pool.includes(player.comfort),fits=pool.filter(agent=>E.familiarity(player,agent).penalty===0);
  const mates=others.filter(p=>p.team===player.team&&p.id!==player.id);
  return `<ul class="facts">
    <li class="${owned?'good':'muted'}">${agentChip(player.comfort)}<span>${owned?'Possui contrato!':'sem contrato'}</span></li>
    <li class="${fits.length?'':'bad'}">${roleTag(player.role)}<span>${fits.length?fits.map(esc).join(', '):'sem agente'}</span></li>
    ${mates.length?`<li class="good">Equipe de ${names(mates)}</li>`:''}</ul>`;
}
export function draft(ctx) {
  const {db,run}=ctx,picked=run.draft.picked.map(id=>db.byId.get(id)),n=picked.length;
  return `${band(`Draft · escolha ${n+1} de 6`,n===0?'Seu elenco começa aqui':n===5?'Falta o reserva':'Quem completa o time?','','compact')}
  <aside class="contracts tray"><p class="label">Seus contratos de agente</p>
    <div class="chips">${run.pool.map(agent=>agentChip(agent)).join('')}</div></aside>
  <div class="offers">${run.draft.choices.map((id,i)=>{const p=db.byId.get(id);return `<article class="offer tray" style="--i:${i};--team:${teamColor(p.team)}">
    <button class="offer-art" data-action="draft-pick" data-id="${p.id}" aria-label="Escolher ${esc(p.name)}">${cardArt(p,{eager:true})}</button>
    <div class="offer-info">
      <h2>${esc(p.name)}</h2>${teamLine(p.team)}
      ${facts(p,run.pool,picked)}
      ${stats(p)}
      <button class="btn primary" data-action="draft-pick" data-id="${p.id}" aria-label="Escolher ${esc(p.name)}">Escolher</button>
    </div></article>`;}).join('')}</div>
  <div class="draft-roster" aria-label="Elenco escolhido">${Array.from({length:6},(_,i)=>{const p=picked[i];
    return p?`<button class="mini" data-action="detail" data-id="${p.id}" aria-label="${esc(p.name)}, overall ${p.ovr}, ${esc(p.role)}, ${esc(p.comfort)}, ${esc(p.team)}">${cardArt(p)}<span class="mini-info"><b>${esc(p.name)}</b><small class="role-${roleKey(p.role)}">${roleIcon(p.role)}${agentIcon(p.comfort)}${teamLogo(p.team)}</small></span><i class="mini-ovr">${p.ovr}</i></button>`
      :`<div class="mini empty ${i===n?'next':''}"><i>${i===5?'R':i+1}</i><span>${i===5?'Reserva':'Titular'}</span></div>`;}).join('')}</div>`;
}

// ---------- Comissão técnica ----------
export function perk(ctx) {
  const run=ctx.run,groups=run.stage===1&&brandArt('groupsBanner');
  return `<div class="perk-screen">
    ${groups?`<img class="stage-banner" src="${esc(groups)}" alt="Fase de Grupos" width="1200" height="300">`:''}
    ${band(`${run.perkBought?'Pacote de vantagens':'Comissão técnica'} · bônus ${run.perks.length+1}`,run.perkBought?'Mais um reforço':run.stage===2?'Playoffs':run.stage===1?'Classificados!':'Um reforço fora das cartas')}
    <div class="perk-row">${run.perkOffer.map((key,i)=>`<button class="perk-card ${E.PERKS[key].rare?'rare':''}" style="--i:${i}" data-action="perk" data-id="${key}">${E.PERKS[key].rare?'<i class="rare-tag">Raro</i>':''}<b>${E.PERKS[key].name}</b><span>${E.PERKS[key].text}</span><em>Escolher</em></button>`).join('')}</div>
  </div>`;
}

// ---------- Elenco, loja e próximo jogo ----------
// A starter with teammates among the five: the logo of the team is lit in the team's colour, with the bonus each of
// them gets under it.
function starter(slot,i,lineup,ctx) {
  const p=slot.player,eff=E.effective(p,slot.agent,lineup,ctx.run.perks),selected=ctx.ui.selected===p.id;
  const mods=[eff.comfort&&`<span class="good">Conforto +${eff.comfort}</span>`,eff.chemistry&&`<span class="good">Equipe +${eff.chemistry}</span>`,eff.staff&&`<span class="good">Comissão +${eff.staff}</span>`,eff.penalty&&`<span class="bad">${eff.label} ${signed(eff.penalty)}</span>`].filter(Boolean);
  return `<div class="slot ${selected?'selected':''}" style="--i:${i};--team:${teamColor(p.team)}">
    <button class="slot-card" data-action="select" data-id="${p.id}" aria-pressed="${selected}" aria-label="${esc(p.name)}, titular, overall efetivo ${eff.value}">${cardArt(p,{effective:eff.value})}</button>
    <button class="agent-btn role-${roleKey(E.AGENTS[slot.agent])}" data-action="agent" data-id="${p.id}" aria-label="Agente de ${esc(p.name)}: ${slot.agent}. Trocar">${agentIcon(slot.agent)}<b>${slot.agent}</b><i aria-hidden="true">▾</i></button>
    <p class="mods">${mods.join('')}</p>
    <span class="slot-team${eff.chemistry?' linked':''}" role="img" aria-label="${esc(p.team)}${eff.chemistry?`: sinergia +${eff.chemistry}`:''}" data-tip="${esc(p.team)}">${teamLogo(p.team)}${eff.chemistry?`<b>+${eff.chemistry}</b>`:''}</span>
  </div>`;
}
function lineupTab(ctx) {
  const {db,run,ui}=ctx,lineup=C.lineupSlots(run,db),bench=run.bench.map(id=>db.byId.get(id));
  const picked=ui.selected&&db.byId.get(ui.selected);
  return `<div class="stage tray">
      <div class="stage-row">${lineup.map((slot,i)=>starter(slot,i,lineup,ctx)).join('')}${Array.from({length:5-lineup.length},()=>'<div class="slot empty"><span>Vaga</span></div>').join('')}</div>
    </div>
    ${picked?`<div class="selection" aria-live="polite"><p><b>${esc(picked.name)}</b> selecionado</p>
        <div><button class="btn small" data-action="detail" data-id="${picked.id}">Ver carta</button>
        <button class="btn small" data-action="sell" data-id="${picked.id}">Vender ${coin(C.sellValue(picked))}</button>
        <button class="link" data-action="deselect">Cancelar</button></div></div>`:''}
    <div class="under-stage"><div class="bench">
      <p class="label">Reservas <span>${C.rosterIds(run).length} / ${C.rosterMax(run)}</span></p>
      <div class="bench-row">${bench.map(p=>`<button class="bench-card ${ui.selected===p.id?'selected':''}" data-action="select" data-id="${p.id}" aria-pressed="${ui.selected===p.id}" aria-label="${esc(p.name)}, reserva">${cardArt(p)}<span>${agentIcon(p.comfort)}${esc(p.comfort)}</span></button>`).join('')}
        ${Array.from({length:C.rosterMax(run)-5-bench.length},()=>`<div class="bench-card empty"><span>Vaga</span></div>`).join('')}</div>
    </div>${staff(run)}</div>
    <div class="contracts tray"><p class="label">Contratos de agente <span>${run.pool.length} / ${Object.keys(E.AGENTS).length}</span></p>
      <div class="chips">${E.ROLES.flatMap(role=>run.pool.filter(agent=>E.AGENTS[agent]===role)).map(agent=>{
        const user=lineup.find(s=>s.agent===agent);return agentChip(agent,user?`<small>${esc(user.player.name)}</small>`:'');}).join('')}</div></div>`;
}
function marketCard(offer,ctx) {
  const {db,run}=ctx,p=db.byId.get(offer.id),price=C.playerPrice(run,p),roster=C.rosterIds(run).map(id=>db.byId.get(id));
  const blocked=offer.sold?'Comprado':roster.length>=C.rosterMax(run)?'Elenco cheio':run.coins<price?'Faltam moedas':'';
  return `<article class="market-card ${offer.sold?'sold':''}">
    <button class="market-art" data-action="detail" data-id="${p.id}" aria-label="Ver carta de ${esc(p.name)}">${cardArt(p)}</button>
    ${teamLine(p.team)}
    ${facts(p,run.pool,roster)}
    ${run.lineup.length?`<button class="btn small" data-action="compare" data-id="${p.id}">Comparar com titular</button>`:''}
    <button class="btn ${blocked?'':'primary'}" data-action="buy-player" data-id="${p.id}" ${blocked?'disabled':''}>${buyLabel('Comprar',price,blocked)}</button>
  </article>`;
}
// The order the role pack goes through, under the pack: the four roles as icons with arrows between them, and the
// one of this shop lit.
const roleName = role=>C.packName({role}).replace('Pacote de ','');
const roleOrder = now=>`<span class="role-order" role="img" aria-label="Ordem dos pacotes de função: ${C.ROLE_ORDER.map(roleName).join(', ')}. Agora: ${roleName(now)}">${
  C.ROLE_ORDER.map(role=>`<b class="role-step role-${roleKey(role)}${role===now?' on':''}">${roleIcon(role)}</b>`).join('<em aria-hidden="true">→</em>')}</span>`;
function shopTab(ctx) {
  const {db,run}=ctx,roster=C.rosterIds(run).map(id=>db.byId.get(id)),full=roster.length>=C.rosterMax(run);
  // The three packs by overall, and the role pack of this shop: one role, in the colour and with the symbol of that role.
  const packs=[...C.packsOf(run),C.rolePack(run)].filter(Boolean),reroll=C.rerollCost(run),perkCost=C.perkPackCost(run);
  return `<div class="shop">
    <section class="shop-block"><h2>Pacotes</h2>
      <div class="packs">${packs.map((pack,i)=>{const blocked=full?'Elenco cheio':run.coins<pack.cost?'Faltam moedas':'';
        return `<button class="pack pack-${pack.key} ${pack.role?'role-'+roleKey(pack.role):''}" style="--i:${i}" data-action="open-pack" data-id="${pack.key}" ${blocked?'disabled':''}>
          <span class="pack-art" aria-hidden="true">${pack.role?roleIcon(pack.role):crest()}</span><b>${pack.role?pack.name.replace('Pacote de ',''):pack.name}</b><small>${pack.role?'Pacote de função · ':'Overall '}${pack.range[0]} a ${pack.range[1]}</small><span class="price">${buyLabel('',pack.cost,blocked)}</span>${pack.role?roleOrder(pack.role):''}</button>`;}).join('')}</div></section>
    ${perkCost===null?'':`<section class="shop-block"><h2>Vantagens</h2>
      <button class="perk-pack" data-action="open-perk-pack" ${run.coins<perkCost?'disabled':''}>
        <span class="pack-art" aria-hidden="true">${crest()}</span>
        <span class="perk-pack-info"><b>Pacote de vantagens</b><small>1 de 3 bônus da comissão técnica · você tem ${run.perks.length}</small></span>
        <span class="price">${buyLabel('',perkCost,run.coins<perkCost?'Faltam moedas':'')}</span></button></section>`}
    <section class="shop-block"><h2>Mercado</h2>
      <div class="market ${run.shop.market.length>4?'wide':''}">${run.shop.market.map(offer=>marketCard(offer,ctx)).join('')}</div></section>
    <section class="shop-block"><h2>Contratos de agente</h2>
      <div class="agent-offers">${run.shop.agents.map(offer=>{const fans=roster.filter(p=>p.comfort===offer.agent),price=C.agentPrice(run),blocked=offer.sold?'Contratado':run.coins<price?'Faltam moedas':'';
        return `<article class="agent-offer role-${roleKey(E.AGENTS[offer.agent])} ${offer.sold?'sold':''}">${agentIcon(offer.agent)}
          <div><b>${offer.agent}</b><small>${roleIcon(E.AGENTS[offer.agent])}${E.AGENTS[offer.agent]}</small>${fans.length?`<p class="good">Conforto de ${names(fans)}</p>`:''}</div>
          <button class="btn ${blocked?'':'primary'}" data-action="buy-agent" data-id="${offer.agent}" ${blocked?'disabled':''}>${buyLabel('Contratar',price,blocked)}</button></article>`;}).join('')}</div></section>
    <footer class="shop-foot"><button class="btn" data-action="reroll" ${run.coins<reroll?'disabled':''}>Trocar ofertas ${reroll?coin(reroll):'<b class="good">grátis</b>'}</button></footer>
  </div>`;
}
// The two teams of the next match and what stands in its way. Fewer than five starters can't play: the only way
// forward is to complete the team or lose by W.O.
function fixture(ctx) {
  const {db,run}=ctx,mine=C.lineupSlots(run,db),rival=C.opponentLineup(run,db),short=C.shortHanded(run);
  return {mine,rival,short,error:short?(mine.length===4?'Falta 1 titular':`Faltam ${5-mine.length} titulares`):C.lineupError(run,db)};
}
function nextMatch(ctx) {
  const {run}=ctx,rivalTeam=run.opponent.team,info=teamInfo(rivalTeam),map=mapFor(run.matchSeed);
  const {mine,rival,short,error}=fixture(ctx),comp=E.composition(rival);
  return `<section class="panel next" style="--team:${teamColor(rivalTeam)}">
    ${map?`<div class="map-shot" style="background-image:url(${esc(map.file)})"><span>Mapa</span><b>${esc(map.name)}</b></div>`:''}
    <div class="versus-head">${crest()}<i>x</i>${teamLogo(rivalTeam)}</div>
    <p class="eyebrow">Próximo adversário</p>
    <h2>${esc(rivalTeam)}</h2>
    ${info.org?`<p class="team-org">${teamFlag(rivalTeam)}<span>${esc(info.org)}${info.state?' · '+esc(info.state):''}</span></p>`:''}
    <div class="versus"><div><b>${mine.length?num(effectiveAvg(mine,run.perks),1):'-'}</b><small>seu efetivo</small></div><i>x</i><div class="them"><b>${num(effectiveAvg(rival),1)}</b><small>efetivo deles</small></div></div>
    <p class="tags"><span class="formation-tag">${formationIcon(comp.key)}${comp.name}</span></p>
    <div class="rival-cards">${rival.map(s=>`<button data-action="detail" data-id="${s.player.id}" aria-label="Ver carta de ${esc(s.player.name)}, ${s.agent}">${cardArt(s.player,{effective:effectiveOf(s,rival)})}<span class="${s.agent===s.player.comfort?'main ':''}role-${roleKey(E.AGENTS[s.agent])}" ${s.agent===s.player.comfort?'data-tip="No main: +1"':''}>${agentIcon(s.agent)}</span></button>`).join('')}</div>
    ${error?`<p class="warn" role="alert">${esc(error)}</p>`:''}
    ${short?'<button class="btn danger big" data-action="forfeit">Perder por W.O.</button>':`<button class="btn primary big" data-action="play" ${error?'disabled':''}>Jogar partida</button>`}
  </section>`;
}
// On a narrow screen the rival's panel is far down the page. This bar holds on to the bottom of the screen there (a
// wide screen doesn't show it) and keeps the way into the match at hand: who the rival is, how the two teams compare,
// and the button. A touch on the rival goes to his panel.
function playBar(ctx) {
  const run=ctx.run,rivalTeam=run.opponent.team,{mine,rival,short,error}=fixture(ctx);
  return `<div class="play-bar" style="--team:${teamColor(rivalTeam)}">
    <button class="play-rival" data-action="see-rival" aria-label="Ver o próximo adversário: ${esc(rivalTeam)}">${teamLogo(rivalTeam)}<span><small>${esc(rivalTeam)}</small>${
      error?`<em>${esc(error)}</em>`:`<span class="play-versus"><b class="us">${num(effectiveAvg(mine,run.perks),1)}</b><i>x</i><b class="them">${num(effectiveAvg(rival),1)}</b></span>`}</span></button>
    ${short?'<button class="btn danger" data-action="forfeit">Perder por W.O.</button>':`<button class="btn primary" data-action="play" ${error?'disabled':''}>Jogar partida</button>`}
  </div>`;
}
const eventName = key=>E.EVENT_TYPES[key].label.toLowerCase();
// The role a formation stands on gives it its colour; the incomplete one has none.
const formationTone = key=>{const role=E.FORMATIONS.find(f=>f.key===key)?.role;return role?'role-'+roleKey(role):'';};
function identity(ctx) {
  const lineup=C.lineupSlots(ctx.run,ctx.db),comp=E.composition(lineup);
  const side=name=>{const value=E.compositionBonus(lineup,name,ctx.run.perks);return `<div class="${value>0?'good':value<0?'bad':''}"><b>${signed(value)}</b><small>${name.toLowerCase()}</small></div>`;};
  return `<section class="panel identity ${formationTone(comp.key)}">
    <div class="identity-head">${formationIcon(comp.key)}<div><p class="eyebrow">Sua formação</p><h3>${comp.name}</h3></div></div>
    <div class="role-counts">${E.ROLES.map(role=>`<span class="role-${roleKey(role)} ${comp.count[role]?'':'none'}" role="img" aria-label="${role}: ${comp.count[role]}" data-tip="${role}">${roleIcon(role)}<b>${comp.count[role]}</b></span>`).join('')}</div>
    <div class="sides">${side('Ataque')}${side('Defesa')}</div>
    <p class="tags">${comp.strong.map(key=>`<span>${eventName(key)}</span>`).join('')}${comp.missing.map(role=>`<span class="bad">sem ${role.toLowerCase()}</span>`).join('')}</p>
    <button class="btn small guide-btn" data-action="formations">Guia de formações</button>
  </section>`;
}
// The staff bonuses of the run, each with what it does written under its name.
function staff(run) {
  return run.perks.length?`<section class="panel staff"><p class="eyebrow">Comissão técnica</p><ul>${run.perks.map(key=>`<li class="${E.PERKS[key].rare?'rare':''}"><b>${E.PERKS[key].name}</b><span>${E.PERKS[key].text}</span></li>`).join('')}</ul></section>`:'';
}
// Stats: everything about the roster in one table. The card's own numbers (overall and the six attributes) and what
// each player did in the matches of this run. A click on a column puts the table in order by it, best first; another
// click goes back to starters first.
const STAT_COLS = ['acs','kast','kpr','mpr','apr','swing'];
function statsTab(ctx) {
  const {db,run,ui}=ctx,lineup=C.lineupSlots(run,db),tally=run.tally||{};
  const rows=[...lineup.map(s=>({p:s.player,agent:s.agent,eff:effectiveOf(s,lineup,run.perks)})),...run.bench.map(id=>({p:db.byId.get(id),agent:null,eff:null}))];
  const done=(r,key)=>tally[r.p.id]?.[key]||0;
  const value={ovr:r=>r.p.ovr,eff:r=>r.eff??-1,games:r=>done(r,'m'),k:r=>done(r,'k'),d:r=>-done(r,'d'),a:r=>done(r,'a')};
  // MPR and deaths read the other way round: fewer is better, so fewer comes first.
  for(const key of STAT_COLS)value[key]=r=>r.p.stats[key]*(key==='mpr'?-1:1);
  const sort=value[ui.sort]?ui.sort:null;
  if(sort)rows.sort((a,b)=>value[sort](b)-value[sort](a));
  const head=(key,label,tip)=>`<th scope="col"><button data-action="stats-sort" data-id="${key}" aria-pressed="${sort===key}" data-tip="${tip}">${label}</button></th>`;
  return `<div class="stats-wrap tray"><table class="stats-table">
    <thead><tr class="groups"><td colspan="3"></td><th scope="colgroup" colspan="2">Overall</th><th scope="colgroup" colspan="6">Atributos</th><th scope="colgroup" colspan="4">Nesta run</th></tr>
      <tr><th scope="col">Jogador</th><th scope="col">Função</th><th scope="col">Agente</th>
      ${head('ovr','Carta','Overall da carta')}${head('eff','Efetivo','Overall com conforto, equipe, comissão e função')}
      ${STAT_COLS.map(key=>head(key,statLabel(key),STAT_HELP[key])).join('')}
      ${head('games','J','Partidas como titular nesta run')}${head('k','K','Abates nesta run')}${head('d','D','Mortes nesta run')}${head('a','A','Assistências nesta run')}</tr></thead>
    <tbody>${rows.map(r=>{const p=r.p;
      return `<tr data-id="${p.id}" class="${r.agent?'':'reserve'}">
        <th scope="row"><button class="stats-who" data-action="detail" data-id="${p.id}" aria-label="Ver carta de ${esc(p.name)}">${mug(p.id)}<span><b>${esc(p.name)}</b><small>${teamLogo(p.team)}${esc(p.team)}</small></span></button></th>
        <td>${roleTag(p.role)}</td>
        <td>${r.agent?agentChip(r.agent):'<span class="muted">Reserva</span>'}</td>
        <td class="num big">${p.ovr}</td><td class="num big ${r.eff>p.ovr?'good':r.eff!==null&&r.eff<p.ovr?'bad':''}">${r.eff??'-'}</td>
        ${STAT_COLS.map(key=>`<td class="num ${tierOf(key,p.stats[key])}">${statText(key,p.stats[key])}</td>`).join('')}
        <td class="num run">${done(r,'m')}</td><td class="num">${done(r,'k')}</td><td class="num">${done(r,'d')}</td><td class="num">${done(r,'a')}</td></tr>`;}).join('')}</tbody></table></div>`;
}
export function hub(ctx) {
  const tab=ctx.ui.tab,run=ctx.run,stage=C.stagesOf(run)[run.stage],record=run.record[run.stage];
  return `${band(stage.name,C.nextMatchLabel(run),`${record.w} V · ${record.l} D`,'compact')}
  <div class="hub ${tab==='stats'?'wide':''}">
    <section class="hub-main">
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected="${tab==='lineup'}" data-action="tab" data-id="lineup">Escalação</button>
        <button role="tab" aria-selected="${tab==='shop'}" data-action="tab" data-id="shop">Loja</button>
        <button role="tab" aria-selected="${tab==='stats'}" data-action="tab" data-id="stats">Stats</button>
      </div>
      ${tab==='shop'?shopTab(ctx):tab==='stats'?statsTab(ctx):lineupTab(ctx)}
    </section>
    <aside class="hub-side">${nextMatch(ctx)}${identity(ctx)}</aside>
  </div>${playBar(ctx)}`;
}

// ---------- Partida ----------
const half = round=>round>24?'Prorrogação':round>12?'2ª metade':'1ª metade';
// What the match screen shows right now. While a round is being played back (or a confrontation is on screen), the
// engine has already resolved it, so the screen is rebuilt from the state before the round plus the kills shown so far.
function matchView(ctx) {
  const m=ctx.match,live=ctx.ui.play||ctx.ui.duel,last=m.log.at(-1);
  const rows=(players,state={})=>players.map((p,i)=>({...p,order:i,dead:false,...state}));
  if(!live)return {teams:m.teams.map(t=>rows(t.players)),score:m.score,plays:m.plays,log:m.log,round:m.over?m.log.length:m.round,over:m.over,
    side:m.over?last.side:m.prepared.side,gear:m.over?null:m.prepared.gear,record:last,kills:last?last.kills:[],done:true,fresh:-1};
  const record=live.record,shown=live.shown||0,teams=live.before.teams.map(players=>rows(players));
  const row=(t,id)=>teams[t].find(p=>p.id===id);
  record.kills.slice(0,shown).forEach((kill,i)=>{
    const killer=row(kill.team,kill.killer),victim=row(1-kill.team,kill.victim);
    killer.k++;killer.credits=Math.min(9000,killer.credits+200);victim.d++;victim.dead=true;
    if(!E.isOvertime(record.round))for(const each of [killer,victim])each.ult=Math.min(B.ABILITIES[each.agent].x.points,each.ult+1);
    kill.assistIds.forEach(id=>row(kill.team,id).a++);
    if(i===shown-1){killer.hit=true;victim.fell=true;}
  });
  return {teams,score:live.before.score,plays:live.before.plays,log:m.log.slice(0,-1),round:record.round,over:false,side:record.side,gear:record.gear,
    record,kills:record.kills.slice(0,shown),done:shown===record.kills.length,fresh:shown-1,playing:true};
}
// The match header. Its centre says where the round stands: during the freezetime it carries the countdown (the app
// keeps it ticking between renders, see runClock), stripes run across the header and a line drains along its bottom.
// Everything keeps its place from one phase to the next, so nothing under the header moves.
function scorebug(ctx,view) {
  const m=ctx.match,map=mapFor(m.seed),freeze=view.over?null:ctx.ui.freeze,counting=freeze&&!freeze.manual,elapsed=counting?Date.now()-freeze.start:0;
  const [ours,theirs]=m.teams.map(team=>{const comp=E.composition(team.lineup);return `<small class="formation-tag">${formationIcon(comp.key)}${comp.name}</small>`;});
  // The stripes run on a clock of their own (--phase), so a redraw of the screen doesn't make them jump back.
  return `<header class="arena ${freeze?'freezing':''}" style="--phase:-${Date.now()%1100}ms;${map?`background-image:linear-gradient(180deg,rgba(20,20,20,.55),rgba(20,20,20,.92)),url(${esc(map.file)})`:''}">
    ${map?`<p class="arena-map"><span>Mapa</span><b>${esc(map.name)}</b></p>`:''}
    <div class="bug">
      <div class="bug-team us"><div><b>${ourName(ctx)}</b><p class="bug-meta">${ours}${playPips(view.plays[0],m.playsMax[0])}</p></div>${crest()}</div>
      <div class="bug-score" role="img" aria-label="Placar: você ${view.score[0]}, rival ${view.score[1]}${freeze?'. Freezetime':''}"><b class="us">${view.score[0]}</b>
        <span class="bug-mid"><small>${view.over?'Fim de jogo':'Round '+view.round}</small>${counting?`<b id="freeze-clock" class="freeze-clock">${freezeClock(elapsed,freeze.total)}</b>`:''}<i>${view.over?'':freeze?'Freezetime':half(view.round)}</i></span>
        <b class="them">${view.score[1]}</b></div>
      <div class="bug-team them">${teamLogo(m.teams[1].name)}<div><b>${esc(m.teams[1].name)}</b><p class="bug-meta">${playPips(view.plays[1],m.playsMax[1])}${theirs}</p></div></div>
    </div>
    <p class="bug-side">${view.over?'&nbsp;':`Você ${view.side==='Ataque'?'ataca':'defende'}`}</p>
    ${counting?`<i class="freeze-line" aria-hidden="true"><i style="animation-duration:${freeze.total}ms;animation-delay:${-elapsed}ms"></i></i>`:''}
  </header>`;
}
function timeline(view) {
  const total=Math.max(24,view.log.length+(view.over?0:1));
  return `<ol class="timeline" aria-label="Rounds">${Array.from({length:total},(_,i)=>{const r=view.log[i];
    const what=`Round ${i+1}${r?': '+(r.won?'vencido':'perdido')+' · '+r.outcome+(r.event?` · Jogada de Efeito ${r.event.by?'do rival':'sua'}: ${r.event.label}`:''):''}`;
    return `<li class="${r?(r.won?'won':'lost'):i===view.round-1&&!view.over?'now':''} ${r?.event?`decisive ${r.event.by?'them':'us'}`:''} ${i===12?'half':''}" aria-label="${what}" data-tip="${what}">${r?roundIcon(r.outcome):`<span>${i+1}</span>`}</li>`;}).join('')}</ol>`;
}
// The round ahead, one team against the other: a single bar split by the chance each has in it, the very number the
// round is drawn with (see roundChance in engine.js), with the name of each team's buy at its end. The chance starts
// from the equipment (the tips say what each team carries) and the cards, the formation and the staff move it; it is
// the chance the round started with, so a round decided by a confrontation still shows it.
function buyBar(ctx,view) {
  if(!view.gear)return '';
  const odds=(view.playing?view.record.odds:ctx.match.prepared?.odds)??E.loadoutShare(view.teams)/100;
  const ours=Math.round(100*odds),[mine,rival]=view.gear,them=esc(ctx.match.teams[1].name);
  const carried=view.teams.map(players=>{
    const worth=players.reduce((sum,p)=>sum+E.armsValue(p)+(p.util||0),0),ults=players.filter(p=>p.ultOn).length;
    return `¤ ${num(worth)} em armas, coletes e habilidades${ults?` · ${ults} ${ults===1?'ultimate':'ultimates'} em uso`:''}`;
  });
  return `<div class="buys" role="img" aria-label="Chance no round. ${ourName(ctx)}: ${ours}%, compra ${mine}. ${them}: ${100-ours}%, compra ${rival}.">
    <p><b class="us">${mine}<i>${ours}%</i></b><b class="them"><i>${100-ours}%</i>${rival}</b></p>
    <div class="buys-bar"><i class="us" style="width:${ours}%" data-tip="${ourName(ctx)}: ${carried[0]}"></i><i class="them" data-tip="${them}: ${carried[1]}"></i></div>
  </div>`;
}
// The four abilities of a player's agent as he holds them for the round. Under each icon runs a line, filled by the
// charges he has out of the most there are; an ability without a charge is dimmed. The last one is the ultimate: its
// line fills with the points, and it lights up in the round it is used in. The scoreboard carries the strip twice:
// in a column of its own, and inside the weapon's cell for the narrow screens, where that column doesn't fit (one of
// the two is always hidden, and only the first is read out).
function abilities(p,narrow=false) {
  const kit=B.ABILITIES[p.agent],said=[];
  const icons=B.SLOTS.map((slot,i)=>{
    const own=kit[slot].shared?kit[kit[slot].shared]:kit[slot],held=p.abi?.[i]||0,name=kit[slot].name;
    said.push(`${name} ${held} de ${own.max}`);
    return `<span class="abi${held?'':' off'}" style="--got:${Math.round(100*held/own.max)}%" data-tip="${esc(name)} · ${held} de ${own.max} ${own.max===1?'carga':'cargas'}">${abilityIcon(p.agent,name)}</span>`;
  });
  const x=kit.x,points=p.ult||0;
  said.push(p.ultOn?`${x.name} em uso`:`${x.name} ${points} de ${x.points} pontos`);
  icons.push(`<span class="abi ult${p.ultOn?' on':''}" style="--got:${p.ultOn?100:Math.round(100*points/x.points)}%" data-tip="${esc(x.name)} · ${p.ultOn?'em uso neste round':`${points} de ${x.points} pontos`}">${abilityIcon(p.agent,x.name)}</span>`);
  return `<span class="abis${narrow?' narrow" aria-hidden="true"':`" role="img" aria-label="Habilidades: ${esc(said.join(', '))}"`}>${icons.join('')}</span>`;
}
// The scoreboard of one team, ordered by kills. Rows carry data-flip so the app can animate them changing places.
function teamTable(ctx,view,t) {
  const name=ctx.match.teams[t].name,used=new Set(ctx.match.used);
  const rows=[...view.teams[t]].sort((a,b)=>b.k-a.k||a.d-b.d||b.a-a.a||a.order-b.order);
  return `<table class="squad ${t?'them':'us'}">
    <caption>${t?teamLogo(name):crest()}<b>${t?esc(name):ourName(ctx)}</b></caption>
    <thead><tr><th scope="col" class="c-mug"><span class="sr-only">Foto</span></th><th scope="col" class="c-agent"><span class="sr-only">Agente</span></th><th scope="col">Jogador</th><th scope="col" aria-label="Abates" data-tip="Abates">K</th><th scope="col" aria-label="Mortes" data-tip="Mortes">D</th><th scope="col" aria-label="Assistências" data-tip="Assistências">A</th><th scope="col">Créditos</th><th scope="col" class="c-ab">Habilidades</th><th scope="col">Arma</th></tr></thead>
    <tbody>${rows.map(p=>`<tr data-flip="${p.id}" class="${p.dead?'dead':''} ${p.fell?'fell':''}"><td class="c-mug">${mug(p.id)}</td><td class="c-agent role-${roleKey(E.AGENTS[p.agent])}">${agentIcon(p.agent)}</td>
        <th scope="row"><span class="who"><b>${esc(p.name)}</b><small>${p.agent}</small></span>${t?'':`<i class="ready ${used.has(p.id)?'spent':''}" role="img" aria-label="${used.has(p.id)?'Já foi a um confronto':'Pode ir a um confronto'}" data-tip="${used.has(p.id)?'Já foi a um confronto':'Pode ir a um confronto'}"></i>`}</th>
        <td class="k ${p.hit?'hit':''}">${p.k}</td><td class="d">${p.d}</td><td class="a">${p.a}</td><td class="cr"><i>¤</i> ${num(p.credits)}</td><td class="ab">${abilities(p)}</td><td class="wp">${weapon(p.weapon,{label:false,shield:p.shield})}${abilities(p,true)}</td></tr>`).join('')}</tbody></table>`;
}
function feed(view) {
  const r=view.record;
  if(!r)return `<section class="feed tray"><p class="eyebrow">Round 1</p><h3>Pistolas</h3></section>`;
  return `<section class="feed tray ${view.done?(r.won?'won':'lost'):''}"><p class="eyebrow">${view.done?roundIcon(r.outcome):''}Round ${r.round}${view.done?' · '+r.outcome:''}</p>
    <h3>${view.done?(r.won?'Round vencido':'Round perdido'):'Em jogo'}</h3>
    <ol class="kills">${view.kills.map((k,i)=>`<li class="${k.team?'them':'us'} ${i===view.fresh?'new':''}"><b>${esc(k.killerName)}</b>${weapon(k.weapon,{label:false})}<b>${esc(k.victimName)}</b></li>`).join('')}</ol></section>`;
}
// One line of controls, always in the same place: the Jogada de Efeito (alive only during the freezetime, when it
// pulses), one button that starts the round or pauses it, the speed, and the freezetime settings behind Ajustes.
function controls(ctx,view) {
  const ui=ctx.ui,prefs=ctx.prefs,m=ctx.match,left=view.plays[0],freeze=ui.freeze,between=!view.playing&&!m.pending;
  const layered=!!(ui.duel||m.pending&&ui.showEvent&&!ui.play);
  if(view.over)return `<section class="controls over"><button class="btn primary big" data-action="see-result">Ver resultado</button></section>`;
  return `<section class="controls ${freeze?'freezing':''}" style="--phase:-${Date.now()%1000}ms" aria-label="Controles da partida">
    ${left?`<button class="btn play-call" data-action="play-call" ${between?'':'disabled'}><span>Jogada de Efeito</span>${playPips(left,m.playsMax[0])}</button>`
      :'<p class="plays-out" role="status">Todas as Jogadas de Efeito já utilizadas, freezetime desabilitado</p>'}
    <button class="btn flow ${freeze?'start':ui.paused?'primary':''}" data-action="${freeze?'start-round':'pause'}" ${layered?'disabled':''}>${freeze?'<span>Começar<span class="wide"> round</span></span>':ui.paused?'Retomar':'Pausar'}</button>
    <div class="speed" role="group" aria-label="Velocidade">${[1,2,4].map(s=>`<button data-action="speed" data-id="${s}" aria-pressed="${ui.speed===s}">${s}x</button>`).join('')}</div>
    <div class="settings"><button class="btn gear" data-action="settings" aria-expanded="${!!ui.settings}">Ajustes</button>
      ${ui.settings?`<div class="settings-pop" role="group" aria-label="Freezetime antes de cada round"><p class="label">Freezetime</p>
        <button class="auto" data-action="freeze-auto" aria-pressed="${prefs.freezeAuto}">Automático</button>
        <div class="speed">${FREEZE_OPTIONS.map(s=>`<button data-action="freeze-time" data-id="${s}" aria-pressed="${prefs.freeze===s}" ${prefs.freezeAuto?'':'disabled'}>${s}s</button>`).join('')}</div></div>`:''}</div>
  </section>`;
}
function moment(ctx) {
  const m=ctx.match,event=m.pending,free=new Set(E.availableActors(m)),lineup=m.teams[0].lineup;
  return `<section class="moment" aria-labelledby="moment-title">
    <header class="band compact">${ticker()}<div class="band-body"><div><p class="band-kicker">Round ${event.round} · ${event.side} · ${event.by?'Jogada de Efeito do rival':'Sua Jogada de Efeito'}</p><h1 id="moment-title">${event.title}</h1></div></div></header>
    <p class="moment-rule"><span class="tag">${event.label}</span>${event.stats.map(key=>`<b data-tip="${STAT_HELP[key]}">${statLabel(key)}</b>`).join('<i>+</i>')}</p>
    <div class="actors">${lineup.map((s,i)=>{const open=free.has(s.player.id),eff=effectiveOf(s,lineup,m.perks);
      return `<button class="actor ${open?'':'spent'}" style="--i:${i}" data-action="actor" data-id="${s.player.id}" ${open?'':'disabled'} aria-label="${esc(s.player.name)}${open?'':', já agiu'}">
        ${cardArt(s.player,{effective:eff})}
        <span class="actor-info"><span class="actor-name"><b>${esc(s.player.name)}</b><small>${agentIcon(s.agent)}${s.agent}</small></span>
        <span class="actor-stats">${event.stats.map(key=>`<span><small>${statLabel(key)}</small><b>${statText(key,s.player.stats[key],true)}</b>${meter(key,s.player.stats[key])}</span>`).join('')}</span>
        <em>${open?'Mandar':'Já agiu'}</em></span></button>`;}).join('')}</div>
  </section>`;
}
// The confrontation is shown in steps, driven by the app's clock: the two cards, then each attribute first as "?"
// and then revealed, and finally who took the round. duelStepMs says how long each step stays on screen.
function duelRows(contest) {
  const rows=contest.comparisons.map(v=>({kind:v.result,ours:statText(v.key,v.ours,true),label:statLabel(v.key),theirs:statText(v.key,v.theirs,true)}));
  // One attribute each: the effective overall decides. When that is level too, the row says so and a draw follows.
  if(contest.tiebreak){
    const level=contest.tiebreak==='coin',label=contest.edgeBonus?`Overall + Sangue frio (+${contest.edgeBonus})`:'Overall efetivo';
    rows.push({kind:level?'tie':`tie ${contest.won?'win':'loss'}`,ours:contest.contestOvr,label:level?`${label} · empate`:label,theirs:contest.enemyOvr});
    if(level)rows.push({kind:`tie ${contest.won?'win':'loss'}`,ours:contest.won?'✓':'-',label:'Sorteio',theirs:contest.won?'-':'✓',draw:true});
  }
  return rows;
}
// The score under the table: a point for each attribute taken (half each when it is level) and, when something else
// had to decide it (the overall, the draw), one more point for who took that. A confrontation never ends level.
const duelScore = contest=>[contest.own+(contest.tiebreak&&contest.won?1:0),contest.enemy+(contest.tiebreak&&!contest.won?1:0)];
export const duelSteps = contest=>2*duelRows(contest).length+2;
// The step in which the draw is asked is the toss of the coin: it gets the time a toss takes to be watched.
const TOSS_MS = 1900;
export function duelStepMs(contest,step) {
  if(step===0)return 1100;
  if(step===duelSteps(contest)-1)return 2400;
  if(step%2===0)return 950;
  return duelRows(contest)[(step-1)/2]?.draw?TOSS_MS:850;
}
// The draw of a confrontation that was level even on the overall: a coin with a team on each side. It spins for as
// long as its step lasts (five turns, and half a turn more when the rival's side ends up) and then lies on the side
// of who took it. `clock` is how long the step lasts and how much of it has gone by, so a screen that is drawn
// again in the middle of the toss goes on from where the coin was instead of tossing it again.
function tossCoin(ctx,contest,state,{ms,elapsed}) {
  return `<span class="toss ${state}" aria-hidden="true" style="--ms:${ms}ms;--at:${-elapsed}ms"><i class="coin-toss ${state}" style="--end:${1800+(contest.won?0:180)}deg"><span class="face us">${crest()}</span><span class="face them">${teamLogo(ctx.match.teams[1].name)}</span></i></span><em>Sorteio</em>`;
}
// One side of the confrontation. `team` is the line under the name: the rival's team, or the player's own.
// A player with a photo stands next to his card, on the outer side: photo then card for yours, card then photo for the
// rival. They are written in that order so the layout doesn't depend on reordering them.
function duelist(player,agent,side,team,effective) {
  const card=cardArt(player,{effective}),photo=cutout(player);
  return `<figure class="duel-card ${side} ${photo?'with-photo':''}">${side==='them'?card+photo:photo+card}
    <figcaption><b>${esc(player.name)}</b><small>${agentIcon(agent)}${agent}</small>${team}</figcaption></figure>`;
}
function momentResult(ctx) {
  const {record:r,step}=ctx.ui.duel,event=r.event,c=event.contest,rows=duelRows(c),called=step===duelSteps(c)-1,[ours,theirs]=duelScore(c);
  // Row i is asked at step 1+2i and revealed at step 2+2i.
  // How long the step on screen lasts and how far into it the clock is: the app says both (see duelClock).
  const clock={ms:ctx.ui.duel.stepMs??duelStepMs(c,step),elapsed:ctx.ui.duel.stepAt?Math.max(0,Math.round(Date.now()-ctx.ui.duel.stepAt)):0};
  const row=(v,i)=>{const asked=1+2*i,shown=step>asked;
    if(step<asked)return '';
    return `<div class="duel-row ${v.draw?'draw ':''}${shown?v.kind:''} ${step===asked?'new':''}"><b class="${shown?(step===asked+1?'pop':''):'ask'}">${shown?v.ours:'?'}</b><span>${
      v.draw?tossCoin(ctx,c,shown?'landed':'tossing',clock):v.label}</span><b class="${shown?(step===asked+1?'pop':''):'ask'}">${shown?v.theirs:'?'}</b></div>`;};
  return `<section class="moment resolved ${called?(r.won?'won':'lost'):''}" aria-labelledby="moment-title">
    <p class="eyebrow" id="moment-title">Round ${r.round} · ${event.by?'Jogada de Efeito do rival':'Sua Jogada de Efeito'} · ${event.label}</p>
    <div class="duel">
      ${duelist(event.actor,event.actorAgent,'us',`<span class="team">${crest()}<span>${ourName(ctx)}</span></span>`,c.ownOvr)}
      <div class="duel-table">${rows.map(row).join('')}
        ${called?`<p class="duel-score new"><b>${num(ours,ours%1?1:0)}</b><i>x</i><b>${num(theirs,theirs%1?1:0)}</b></p>`:''}
      </div>
      ${duelist(event.enemy,event.enemyAgent,'them',teamMark(event.enemy.team),c.enemyOvr)}
    </div>
    ${called?`<div class="aftermath new ${r.won?'won':'lost'}"><strong>${r.won?'Round vencido':'Round perdido'}</strong></div>`:'<div class="aftermath"></div>'}
  </section>`;
}
// The match screen keeps one layout from the first round to the last: header, rounds, controls, and the scoreboard
// with the kill feed. The confrontation of a Jogada de Efeito opens over the scoreboard, in the same place, instead
// of taking the whole screen; the scoreboard waits dimmed underneath.
export function match(ctx) {
  const {match:m,ui}=ctx,view=matchView(ctx),layered=!!(ui.duel||m.pending&&ui.showEvent&&!ui.play);
  return `<div class="match">${scorebug(ctx,view)}${timeline(view)}${controls(ctx,view)}
    <div class="match-stack ${layered?'layered':''}">
      <div class="match-body" ${layered?'inert':''}><section class="board tray">${buyBar(ctx,view)}${teamTable(ctx,view,0)}${teamTable(ctx,view,1)}</section><aside class="match-side">${feed(view)}</aside></div>
      ${layered?`<div class="play-layer">${ui.duel?momentResult(ctx):moment(ctx)}</div>`:''}
    </div>
  </div>`;
}

// ---------- Depois da partida ----------
const rating = p=>p.k*2+p.a-p.d*.5;
// Second life: the defeat that would have ended the run didn't count, because the staff had the Repescagem. The marks
// are the defeats the stage allows: the ones already taken, and this one, given back. On the way in the mark fills as
// a defeat and is then cleared while the bonus is spent, and the stamp lands on top: the run goes on.
function secondLife(run,entry) {
  const stage=C.stagesOf(run)[entry.stage],lost=run.record[entry.stage].l;
  return `<div class="second-life"><strong class="life-stamp">Segunda vida</strong><span class="life-marks" role="img" aria-label="${lost} de ${stage.losses} derrotas: esta não contou">${
    Array.from({length:stage.losses},(_,i)=>`<i class="life ${i<lost?'lost':i===lost?'saved':''}"></i>`).join('')}</span><span class="life-perk">${E.PERKS.repescagem.name}</span></div>`;
}
// The scoreboard of a match that is over: what each player did in it, and nothing of what he carried. Kills, deaths
// and assists, the balance between kills and deaths, the rounds in which he made the first kill, the rounds of two,
// three, four and five kills, and the confrontations of the Jogadas de Efeito he won out of the ones he went to.
// Each abbreviation says what it is in its tip. A zero is dimmed, so the numbers that are not stand out.
const FINAL_COLS = [['k','K','Abates'],['d','D','Mortes'],['a','A','Assistências'],['diff','+/-','Saldo de abates e mortes'],
  ['fk','FK','Primeiros abates: rounds em que fez o primeiro abate'],['k2','2K','Rounds com 2 abates'],['k3','3K','Rounds com 3 abates'],['k4','4K','Rounds com 4 abates'],
  ['ace','Ace','Rounds com 5 abates'],['je','JE','Jogadas de Efeito: confrontos vencidos / disputados']];
function finalTable(ctx,t) {
  const m=ctx.match,name=m.teams[t].name,stats=E.matchStats(m);
  const rows=[...m.teams[t].players].sort((a,b)=>b.k-a.k||a.d-b.d||b.a-a.a);
  return `<table class="squad final ${t?'them':'us'}">
    <caption>${t?teamLogo(name):crest()}<b>${t?esc(name):ourName(ctx)}</b></caption>
    <thead><tr><th scope="col" class="c-mug"><span class="sr-only">Foto</span></th><th scope="col" class="c-agent"><span class="sr-only">Agente</span></th><th scope="col">Jogador</th>${
      FINAL_COLS.map(([key,label,tip])=>`<th scope="col" class="c-${key}" aria-label="${tip}" data-tip="${tip}">${label}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(p=>{
      const s=stats[p.id]||E.NO_STATS,diff=p.k-p.d;
      const value={k:p.k,d:p.d,a:p.a,diff:(diff>0?'+':'')+diff,fk:s.fk,k2:s.k2,k3:s.k3,k4:s.k4,ace:s.ace,je:s.plays?`${s.playsWon}/${s.plays}`:'-'};
      return `<tr data-id="${p.id}"><td class="c-mug">${mug(p.id)}</td><td class="c-agent role-${roleKey(E.AGENTS[p.agent])}">${agentIcon(p.agent)}</td><th scope="row"><span class="who"><b>${esc(p.name)}</b><small>${p.agent}</small></span></th>${
        FINAL_COLS.map(([key])=>`<td class="${key}${value[key]===0||value[key]==='0'||value[key]==='-'?' nil':''}">${value[key]}</td>`).join('')}</tr>`;}).join('')}</tbody></table>`;
}
// The conquests that came out with this match, under what it paid.
const postFeats = summary=>summary.feats?.length?`<div class="post-feats"><p class="eyebrow">Conquistas</p><ul>${summary.feats.map(id=>`<li>${achievementIcon(id)}<b>${A.BY_ID[id].name}</b></li>`).join('')}</ul></div>`:'';
export function postmatch(ctx) {
  const {match:m,run,summary,db}=ctx,won=summary.won,entry=run.history.at(-1),stage=C.stagesOf(run)[entry.stage];
  const headline={continue:summary.forgiven?'Salvo pela Repescagem! Esta derrota não contou. Você perdeu "Repescagem" de sua comissão técnica':'',
    advanced:run.stage===2?'Classificados para os Playoffs!':'Classificados para a Fase de Grupos!',eliminated:exitLine(run),champion:'Campeão do Univavá'}[summary.outcome];
  // The games of the first two stages already carry the stage in their name; a playoff game gets it in front.
  const where=entry.stage===2?`${stage.name} · ${esc(entry.label)}`:esc(entry.label);
  const cta={continue:'Voltar ao elenco',advanced:run.status==='perk'?'Escolher bônus':'Voltar ao elenco',eliminated:'Ver resumo',champion:'Comemorar'}[summary.outcome];
  if(summary.forfeit)return `<div class="post lost forfeit${summary.forgiven?' spared':''}">
    <header class="post-head"><p class="eyebrow">${where}</p>
      <h1>Derrota <span>W.O.</span></h1>${summary.forgiven?secondLife(run,entry):''}
      <p class="post-rival">${teamMark(entry.opponent)}</p>${headline?`<p class="lede">${headline}</p>`:''}</header>
    <div class="post-grid"><section class="panel rewards"><p class="eyebrow">Moedas</p>
      <p class="reward-coins">+ ${coin(0)}</p>
      <ul><li>Partida não disputada <b>+0</b></li></ul>
      ${postFeats(summary)}<button class="btn primary big" data-action="after-match">${cta}</button></section></div>
  </div>`;
  const mvpRow=[...m.teams[0].players].sort((a,b)=>rating(b)-rating(a))[0],mvp=db.byId.get(mvpRow.id);
  return `<div class="post ${won?'won':'lost'}${summary.forgiven?' spared':''}">
    <header class="post-head"><p class="eyebrow">${where}</p>
      <h1>${won?'Vitória':'Derrota'} <span>${m.score[0]}-${m.score[1]}</span></h1>${summary.forgiven?secondLife(run,entry):''}
      <p class="post-rival">${teamMark(entry.opponent)}</p>${headline?`<p class="lede">${headline}</p>`:''}</header>
    <div class="post-grid">
      <section class="panel mvp ${hasPhoto(mvp.id)?'with-photo':''}"><p class="eyebrow">Destaque</p>${cutout(mvp)||cardArt(mvp)}
        <h3>${esc(mvp.name)}</h3><p class="kda"><b>${mvpRow.k}</b> / <b>${mvpRow.d}</b> / <b>${mvpRow.a}</b><small>K / D / A · ${mvpRow.agent}</small></p></section>
      <section class="panel post-board">${finalTable(ctx,0)}${finalTable(ctx,1)}</section>
      <section class="panel rewards"><p class="eyebrow">Moedas</p>
        <p class="reward-coins">+ ${coin(summary.coins)}</p>
        <ul><li>Partida <b>+${C.MATCH_PAY}</b></li>${won?`<li>Vitória <b>+${C.winBonus(run)}</b></li>`:''}${summary.streakCoins?`<li>${summary.streak} vitórias seguidas <b>+${summary.streakCoins}</b></li>`:''}${run.perks.includes('patrocinio')?`<li>Patrocínio <b>+${E.PERK_VALUES.patrocinio}</b></li>`:''}${won&&run.perks.includes('bicho')?`<li>Bicho <b>+${E.PERK_VALUES.bicho}</b></li>`:''}${summary.outcome==='advanced'?`<li>Fase vencida <b>+${C.stageBonus(run)}</b></li>`:''}${summary.spare?`<li>Jogos que sobraram <b>+${summary.spare}</b></li>`:''}
          <li>Confrontos <b>${m.eventsWon} / ${m.eventsResolved}</b></li></ul>
        ${postFeats(summary)}<button class="btn primary big" data-action="after-match">${cta}</button></section>
    </div>
  </div>`;
}
export function end(ctx) {
  const {run,db}=ctx,champion=run.result==='champion',lineup=C.lineupSlots(run,db),wins=run.history.filter(h=>h.won).length;
  // The período this title has just opened, with the rule it adds.
  const opened=ctx.ui?.opened,rule=C.LADDER[opened-1];
  return `<div class="end ${champion?'champion':''}">
    ${band(`${run.daily?`Desafio #${C.dailyNumber(run.daily)} · ${C.dayLabel(run.daily)}`:champion?'Univavá 2026':'Run encerrada'}${run.ascension?` · ${C.periodName(run.ascension)}`:''} · ${ourName(ctx)}`,champion?'Campeão do Univavá':exitLine(run),`${wins} V em ${plural(run.history.length,'partida','partidas')}`)}
    ${champion?`<div class="team-photo">${mark('finger','sticker finger')}${lineup.map((s,i)=>`<figure style="--i:${i}">${cutout(s.player)||mark('silhouette','cutout blank')}<figcaption>${agentIcon(s.agent)}<b>${esc(s.player.name)}</b></figcaption></figure>`).join('')}${mark('pennant','sticker pennant')}</div>`:''}
    <div class="end-lineup">${lineup.map((s,i)=>`<figure style="--i:${i}">${cardArt(s.player)}<figcaption>${agentIcon(s.agent)}${s.agent}</figcaption></figure>`).join('')}</div>
    <ol class="history tray">${run.history.map(h=>`<li class="${h.won?'won':'lost'}"><span>${esc(h.label)}</span><b>${teamLogo(h.opponent)}${esc(h.opponent)}</b><em>${h.forfeit?'W.O.':`${h.score[0]}-${h.score[1]}`}</em></li>`).join('')}</ol>
    ${rule?`<div class="period-opened"><p class="eyebrow">Período liberado</p><h2>${C.periodName(opened)}</h2><p>${rule.text}</p></div>`:''}
    <div class="end-actions">${run.daily?'<button class="btn primary big" data-action="home">Início</button>':'<button class="btn primary big" data-action="new-run">Nova run</button>'}
      <button class="btn big" data-action="copy-result">Copiar resultado</button><button class="btn big" data-action="copy-image">Copiar imagem</button></div>
  </div>`;
}

// ---------- Álbum ----------
// Every card of the base, team by team. A card is in the album once it has started a match; the ones that won a title
// carry a star. What is still missing is shown dark, so the album says what there is to go after.
const ALBUM_FILTERS = {all:['Todas',()=>true],have:['Tenho',status=>status!=='missing'],missing:['Faltam',status=>status==='missing'],champion:['Campeãs',status=>status==='champion']};
export function album(ctx) {
  const summary=albumSummary(ctx.album,ctx.db.players),filter=ALBUM_FILTERS[ctx.ui.albumFilter]?ctx.ui.albumFilter:'all',keep=ALBUM_FILTERS[filter][1];
  const teams=summary.teams.map(team=>({...team,shown:team.cards.filter(p=>keep(cardStatus(ctx.album,p.id)))})).filter(team=>team.shown.length);
  return `${band('Álbum de cartinhas',`${summary.have} de ${summary.total}`,`${summary.champions} ★ · ${summary.complete} de ${summary.teams.length} equipes`,'compact')}
  <div class="album-filters" role="group" aria-label="Mostrar">${Object.entries(ALBUM_FILTERS).map(([key,[label]])=>`<button data-action="album-filter" data-id="${key}" aria-pressed="${key===filter}">${label}</button>`).join('')}</div>
  <div class="album">${teams.map(team=>`<section class="album-team ${team.complete?'complete':''}" style="--team:${teamColor(team.team)}">
      <header>${teamLogo(team.team)}<h2>${esc(team.team)}</h2>${teamFlag(team.team)}<span>${team.have} / ${team.total}</span></header>
      <div class="album-cards">${team.shown.map(p=>{const status=cardStatus(ctx.album,p.id);
        return `<button class="album-card ${status}" data-action="detail" data-id="${p.id}" aria-label="${esc(p.name)}, overall ${p.ovr}: ${status==='missing'?'falta':status==='champion'?'campeã':'no álbum'}"><img src="${p.image}" alt="" width="450" height="720" loading="lazy" decoding="async" draggable="false"></button>`;}).join('')}</div>
    </section>`).join('')||'<p class="album-empty">Nenhuma carta aqui ainda</p>'}</div>`;
}

// ---------- Conquistas ----------
// Every conquest there is, group by group, each with its symbol, its name and what it asks for. Nothing is secret: the
// ones still to come are there, dimmed, and the ones already won carry the day they came out.
export function feats(ctx) {
  const got=ctx.feats?.got||{},{have,total}=A.count(ctx.feats);
  return `${band('Conquistas',`${have} de ${total}`,'','compact')}
  <div class="feats">${A.GROUPS.map(group=>{const list=A.ACHIEVEMENTS.filter(a=>a.group===group);
    return `<section class="feat-group"><h2>${group}<span>${list.filter(a=>got[a.id]).length} / ${list.length}</span></h2>
      <ul class="feat-list">${list.map(a=>`<li class="feat${got[a.id]?' got':''}">${achievementIcon(a.id)}<div><b>${a.name}</b><span>${a.text}</span>${
        got[a.id]?`<em class="sr-only">Conquistada em</em><small>${C.dayLabel(got[a.id])}</small>`:'<em class="sr-only">Ainda não conquistada</em>'}</div></li>`).join('')}</ul></section>`;}).join('')}</div>`;
}
export const featBanner = id=>`${achievementIcon(id)}<span><small>Conquista</small><b>${A.BY_ID[id].name}</b></span>`;

// ---------- Estatísticas ----------
// What the team did over all its runs, in four tabs. A line of a list is a name, a bar with the share won, that
// share and the count behind it. The cards and the teams come from the album, which has counted them since always;
// the rest is counted from the day the statistics arrived on (the screen doesn't say which).
const STATS_TABS = {run:'Campanha',squad:'Elenco',rivals:'Rivais',duels:'Confrontos'};
const share = each=>{const value=ST.rate(each);return value===null?'-':value+'%';};
const statRow = (label,each,lead='')=>`<li class="stat-row"><span class="stat-name">${lead}<span>${label}</span></span><span class="stat-bar" style="--v:${ST.rate(each)??0}%"><i></i></span><b>${share(each)}</b><small>${each.w} de ${each.n}</small></li>`;
// A line that counts instead of comparing wins: the bar is its part of the largest count of the list.
const countRow = (label,n,most,extra='',lead='')=>`<li class="stat-row count"><span class="stat-name">${lead}<span>${label}</span></span><span class="stat-bar" style="--v:${most?Math.round(100*n/most):0}%"><i></i></span><b>${num(n)}</b><small>${extra}</small></li>`;
const statPanel = (title,body,kind='')=>`<section class="panel stat-panel${kind?' '+kind:''}"><h2 class="eyebrow">${title}</h2>${body}</section>`;
const statList = rows=>rows.length?`<ul class="stat-rows">${rows.join('')}</ul>`:'<p class="stat-none">Nada por aqui ainda</p>';
const kpis = list=>`<dl class="career stat-kpis">${list.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const statCard = (each,line,detail)=>`<button class="stat-card" data-action="detail" data-id="${each.player.id}" aria-label="${esc(each.player.name)}: ${line}"><img src="${each.player.image}" alt="" width="450" height="720" loading="lazy" decoding="async" draggable="false">${detail}</button>`;
export function career(ctx) {
  const view=ST.overview(ctx.stats,{album:ctx.album,career:ctx.career,db:ctx.db}),tab=STATS_TABS[ctx.ui.careerTab]?ctx.ui.careerTab:'run';
  const all={n:view.totals.matches,w:view.totals.wins},d=view.duels;
  const most=list=>Math.max(0,...list.map(each=>each.n));
  const body={
    run:()=>kpis([['Runs',num(view.totals.runs)],['Títulos',num(view.totals.titles)],['Melhor campanha',esc(ctx.career.best||'-')],['Maior sequência',view.streak?`${view.streak} ${view.streak===1?'vitória':'vitórias'}`:'-']])
      +statPanel('Onde as runs acabaram',statList(view.outcomes.filter(each=>each.n>0).map(each=>countRow(each.name,each.n,most(view.outcomes)))))
      +statPanel('Vitórias por fase',statList(view.stages.filter(each=>each.n>0).map(each=>statRow(each.name,each))))
      +statPanel('Rounds',statList([['Ataque',view.rounds.atk],['Defesa',view.rounds.def],['Pistola',view.rounds.pistol],['Partidas na prorrogação',view.overtime]].filter(([,each])=>each.n>0).map(([name,each])=>statRow(name,each))))
      +statPanel('Comissão técnica',statList(view.perks.slice(0,5).map(each=>countRow(esc(each.name),each.n,most(view.perks),each.t?`${each.t} ${each.t===1?'título':'títulos'}`:'')))),
    squad:()=>statPanel('Cartas mais usadas',view.cards.length?`<div class="stat-cards">${view.cards.map(each=>statCard(each,`${each.m} partidas, ${ST.rate({n:each.m,w:each.w})}% de vitórias`,
          `<b>${each.m}</b><small>${ST.rate({n:each.m,w:each.w})}%</small>`)).join('')}</div>`:statList([]),'wide')
      +statPanel('Equipes mais usadas',statList(view.teams.map(each=>statRow(esc(each.team),{n:each.m,w:each.w},teamLogo(each.team)))))
      +statPanel('Formações',statList(view.formations.map(each=>statRow(each.name,each,formationIcon(each.key)))))
      +statPanel('Agentes mais usados',statList(view.agents.map(each=>statRow(esc(each.agent),each,agentIcon(each.agent)))))
      +statPanel('Composições',view.comps.length?`<ul class="stat-rows">${view.comps.map(each=>`<li class="stat-comp"><span class="stat-five" role="img" aria-label="${each.agents.map(esc).join(', ')}">${each.agents.map(agentIcon).join('')}</span><b>${share(each)}</b><small>${each.w} de ${each.n}</small></li>`).join('')}</ul>`:statList([])),
    rivals:()=>statPanel('Rivais mais enfrentados',statList(view.rivals.map(each=>statRow(esc(each.team),each,teamLogo(each.team)))),'wide'),
    duels:()=>kpis([['Confrontos',num(d.all.n)],['Vencidos',share(d.all)]])
      +statPanel('De quem era a jogada',statList([['Suas jogadas',d.mine],['Jogadas do rival',d.theirs]].filter(([,each])=>each.n>0).map(([name,each])=>statRow(name,each))))
      +statPanel('Como foram decididos',statList([['Nos atributos',d.attributes],['No overall',d.overall],['Na moeda',d.coin]].filter(([,each])=>each.n>0).map(([name,each])=>statRow(name,each))))
      +statPanel('Por tipo de confronto',statList(d.types.filter(each=>each.n>0).map(each=>statRow(each.label,each))))
      +statPanel('Melhor nos confrontos',d.best?`<div class="stat-cards one">${statCard(d.best,`${d.best.dw} confrontos vencidos de ${d.best.dn}`,`<b>${d.best.dw}</b><small>de ${d.best.dn}</small>`)}<p class="stat-best">${esc(d.best.player.name)}</p></div>`:statList([]))
  }[tab]();
  return `${band('Estatísticas',`${num(all.n)} ${all.n===1?'partida':'partidas'}`,all.n?`${share(all)} de vitórias`:'','compact')}
  <div class="album-filters stats-tabs" role="group" aria-label="Estatísticas de">${Object.entries(STATS_TABS).map(([key,label])=>`<button data-action="career-tab" data-id="${key}" aria-pressed="${key===tab}">${label}</button>`).join('')}</div>
  <div class="stats stats-${tab}">${body}</div>`;
}

// ---------- Diálogos ----------
// The button marked autofocus is where the keyboard starts when the dialog opens (see openDialog): the one that confirms
// what the player just asked for, or, when it can't be undone (a W.O., giving up a run), the one that backs out.
const dialogHead = (eyebrow,title)=>`<header class="dialog-head"><div><p class="eyebrow">${eyebrow}</p><h2 id="dialog-title">${title}</h2></div><button class="x" data-action="close" aria-label="Fechar">✕</button></header>`;
const changeTone = value=>Math.abs(value)<.005?'':value>0?'good':'bad';
const deltaText = value=>(value>0?'+':'')+num(Math.abs(value)<.005?0:value,1);
// What a change does to the starting five, in as few lines as it takes: the team's effective overall before and
// after, the formation when it becomes another one, a role that goes missing, and any other starter whose overall moves.
// `shown` lists the players the dialog already displays as cards. Returns nothing when the five stay as they are.
function impactPanel(impact,shown=[]){
  const {before,after}=impact,delta=after.overall-before.overall,arrow='<i aria-hidden="true">→</i>';
  if(JSON.stringify(before.players)===JSON.stringify(after.players))return '';
  // A sale that leaves a starting place open: what matters is that the team can no longer play.
  if(after.players.length<before.players.length)return `<section class="impact" aria-label="O que muda nos titulares">
    <p class="impact-line"><span>Titulares</span><b>${before.players.length}</b>${arrow}<b>${after.players.length}</b><em class="bad">W.O.</em></p></section>`;
  const others=after.players.map(b=>({b,a:before.players.find(p=>p.id===b.id)})).filter(({a,b})=>a&&a.value!==b.value&&!shown.includes(b.id));
  const gone=after.composition.missing.filter(role=>!before.composition.missing.includes(role));
  return `<section class="impact" aria-label="O que muda nos titulares">
    <p class="impact-line"><span>Overall efetivo</span><b>${num(before.overall,1)}</b>${arrow}<b>${num(after.overall,1)}</b><em class="${changeTone(delta)}">${deltaText(delta)}</em></p>
    ${before.composition.name!==after.composition.name?`<p class="impact-line formation-change"><span>Formação</span><b>${formationIcon(before.composition.key)}${esc(before.composition.name)}</b>${arrow}<b>${formationIcon(after.composition.key)}${esc(after.composition.name)}</b></p>`:''}
    ${gone.length||others.length?`<p class="tags">${gone.map(role=>`<span class="bad">sem ${esc(role.toLowerCase())}</span>`).join('')}${others.map(({a,b})=>`<span class="${changeTone(b.value-a.value)}">${esc(b.name)} ${a.value} → ${b.value}</span>`).join('')}</p>`:''}
  </section>`;
}
export function agentPicker(ctx,playerId,previewAgent=null) {
  const {db,run}=ctx,lineup=C.lineupSlots(run,db),slot=lineup.find(s=>s.player.id===playerId),p=slot.player;
  const selected=previewAgent||slot.agent,impact=previewChange(run,db,{type:'agent',id:playerId,agent:selected});
  const rows=E.ROLES.flatMap(role=>run.pool.filter(agent=>E.AGENTS[agent]===role)).map(agent=>{
    const fit=E.familiarity(p,agent,run.perks),holder=lineup.find(s=>s.agent===agent&&s!==slot);
    const preview=previewChange(run,db,{type:'agent',id:playerId,agent}),before=preview.before.players.find(s=>s.id===playerId),after=preview.after.players.find(s=>s.id===playerId);
    return `<li><button class="agent-row role-${roleKey(E.AGENTS[agent])} ${agent===selected?'current':''}" aria-pressed="${agent===selected}" data-action="preview-agent" data-id="${p.id}" data-agent="${agent}" ${!previewAgent&&agent===slot.agent?'autofocus':''}>
      ${agentIcon(agent)}<b>${roleIcon(E.AGENTS[agent])}<span class="sr-only">${E.AGENTS[agent]}: </span>${agent}</b><span class="fit ${changeTone(after.value-before.value)}">${fit.label} · ${before.value} → ${after.value}</span>
      <small>${agent===slot.agent?'Escalado':holder?`Troca com ${esc(holder.player.name)}`:'Livre'}</small></button></li>`;});
  return `${dialogHead(`Agente de ${esc(p.name)}`,'Escolha e compare')}<div class="agent-preview"><ul class="agent-list" data-scroll="agents">${rows.join('')}</ul>
      <div class="agent-side">${cardArt(p,{effective:impact.after.players.find(s=>s.id===playerId).value})}${impactPanel(impact,[playerId])}</div></div>
    <div class="dialog-actions"><button class="btn primary" data-action="set-agent" data-id="${p.id}" data-agent="${selected}" ${selected===slot.agent?'disabled':''}>Aplicar ${esc(selected)}</button><button class="btn" data-action="close">Cancelar</button></div>`;
}
// Swapping a starter with a reserve: who leaves, who comes in (already with the agent and the overall he will have),
// and what it does to the team.
export function swapDialog(ctx,id,other){
  const {run,db}=ctx,impact=previewChange(run,db,{type:'swap',id,other});
  const out=run.lineup.some(s=>s.id===id)?id:other,into=out===id?other:id;
  const side=(slot,label,kind)=>`<figure class="${kind}"><p class="label">${label}</p>${cardArt(db.byId.get(slot.id),{effective:slot.value})}
    <figcaption>${agentIcon(slot.agent)}${esc(slot.agent)}</figcaption></figure>`;
  return `${dialogHead('Escalação','Confirmar troca?')}
    <div class="swap-cards">${side(impact.before.players.find(p=>p.id===out),'Sai','out')}<i aria-hidden="true">→</i>${side(impact.after.players.find(p=>p.id===into),'Entra','in')}</div>
    ${impactPanel(impact,[out,into])}
    <div class="dialog-actions"><button class="btn primary" data-action="confirm-swap" data-id="${id}" data-other="${other}" autofocus>Confirmar troca</button><button class="btn" data-action="close">Cancelar</button></div>`;
}
export function saleDialog(ctx,id){
  const p=ctx.db.byId.get(id);
  return `${dialogHead('Venda de carta',esc(p.name))}${impactPanel(previewChange(ctx.run,ctx.db,{type:'sell',id}))}
    <p class="sale-wallet">Saldo: ${coin(ctx.run.coins)} → ${coin(ctx.run.coins+C.sellValue(p))}</p>
    <div class="dialog-actions"><button class="btn primary" data-action="confirm-sell" data-id="${id}" autofocus>Vender ${coin(C.sellValue(p))}</button><button class="btn" data-action="close">Cancelar</button></div>`;
}
// The guide to the formations: every one that exists, how it is put together and what it gives. It is read from the
// same data the match uses, and marks the one the team has right now.
const ROLE_PLURAL = {Duelista:'duelistas',Iniciador:'iniciadores',Controlador:'controladores',Sentinela:'sentinelas'};
export function formationGuide(ctx) {
  const lineup=C.lineupSlots(ctx.run,ctx.db),current=E.composition(lineup).key,balanced=ctx.run.perks.includes('equilibrio');
  const points=(value,side)=>`<div class="${value>0?'good':value<0?'bad':''}"><b>${signed(value)}</b><small>${side}</small></div>`;
  const need=f=>f.role?`${Array.from({length:f.min},()=>roleIcon(f.role)).join('')}<span>${f.min}${f.max?'':' ou mais'} ${ROLE_PLURAL[f.role]}</span>`:'<span>Nenhuma função com dois agentes</span>';
  const affinity=key=>{const type=E.EVENT_TYPES[key];return `<span data-tip="${type.when?(type.when==='Ataque'?'Só quando você ataca':'Só quando você defende'):'No ataque e na defesa'}"><b>${eventName(key)}</b> ${type.stats.map(statLabel).join(' + ')}</span>`;};
  const cost=role=>['Ataque','Defesa'].filter(side=>E.MISSING_COST[role][side]).map(side=>`<b class="bad">-${E.MISSING_COST[role][side]}</b> ${side==='Ataque'?'no ataque':'na defesa'}`).join(' · ');
  return `${dialogHead('Guia','Formações')}
    <p class="guide-lede">As funções dos cinco agentes escalados definem a formação. Ela soma ou tira pontos de chance em cada round, conforme o lado, e escolhe os confrontos de afinidade: são eles que as suas Jogadas de Efeito sorteiam</p>
    <ul class="formations">${E.FORMATIONS.map(f=>`<li class="formation ${f.key===current?'current':''} ${f.role?'role-'+roleKey(f.role):''}">
      <div class="formation-head">${formationIcon(f.key)}<h3>${f.name}</h3>${f.key===current?'<span class="formation-now">Sua formação</span>':''}</div>
      <p class="formation-need">${need(f)}</p>
      <div class="sides">${points(f.attack,'ataque')}${points(f.defense,'defesa')}</div>
      <p class="tags">${f.strong.map(affinity).join('')||'<span>sem confronto de afinidade</span>'}</p>
    </li>`).join('')}</ul>
    <h3 class="guide-title">Função faltando</h3>
    <ul class="missing-roles">${E.ROLES.map(role=>`<li class="role-${roleKey(role)}">${roleIcon(role)}<span>Sem ${role.toLowerCase()}</span><em>${cost(role)}</em></li>`).join('')}</ul>
    <ul class="guide-notes">
      <li>Com duas funções empatadas, vale a primeira nesta ordem: duelista, iniciador, controlador, sentinela</li>
      <li>Com três sentinelas ou mais, a formação é sempre Fortaleza</li>
      <li>Formação incompleta só acontece com menos de cinco titulares</li>
      <li>Trocar o agente de um titular por outro de função diferente muda a formação</li>
      ${balanced?`<li class="good">Equilíbrio, da sua comissão técnica: +${E.PERK_VALUES.equilibrio} no ataque e na defesa enquanto as quatro funções estiverem entre os titulares</li>`:''}
    </ul>
    <div class="dialog-actions"><button class="btn" data-action="close">Fechar</button></div>`;
}
// What the player confirms before giving a match away.
export function forfeitDialog(ctx){
  const missing=5-ctx.run.lineup.length;
  return `${dialogHead(esc(C.nextMatchLabel(ctx.run)),'Perder por W.O.?')}
    <p>${missing===1?'Falta 1 titular':`Faltam ${missing} titulares`}. Sem cinco, a partida é uma derrota automática e não paga moedas</p>
    <div class="dialog-actions"><button class="btn danger" data-action="confirm-forfeit">Confirmar W.O.</button><button class="btn" data-action="close" autofocus>Voltar ao elenco</button></div>`;
}
export function compareDialog(ctx,id,targetId=null){
  const {run,db}=ctx,candidate=db.byId.get(id),lineup=C.lineupSlots(run,db);
  const target=lineup.find(s=>s.player.id===targetId)||lineup.find(s=>s.player.role===candidate.role)||lineup[0];
  const impact=previewChange(run,db,{type:'replace',id,other:target.player.id}),price=C.playerPrice(run,candidate);
  const offer=run.shop.market.find(o=>o.id===id&&!o.sold),blocked=!offer?'Indisponível':C.rosterIds(run).length>=C.rosterMax(run)?'Elenco cheio':run.coins<price?'Faltam moedas':'';
  const statsRows=Object.keys(E.STAT_NAMES).map(key=>{const a=target.player.stats[key],b=candidate.stats[key],benefit=(b-a)*(key==='mpr'?-1:1);
    return `<tr><th scope="row">${statLabel(key)}</th><td>${statText(key,a)}</td><td class="${changeTone(benefit)}">${statText(key,b)}</td></tr>`;}).join('');
  return `${dialogHead('Mercado · comparação',esc(candidate.name))}
    <label class="compare-picker">Comparar no lugar de<select data-action="compare-target" data-id="${id}" aria-label="Titular para comparar">${lineup.map(s=>`<option value="${s.player.id}" ${s===target?'selected':''}>${esc(s.player.name)} · ${esc(s.agent)}</option>`).join('')}</select></label>
    <div class="card-comparison"><figure>${cardArt(target.player)}<figcaption>Seu titular · ${esc(target.player.name)}</figcaption></figure><table class="impact-table"><thead><tr><th>Atributo</th><th>Seu titular</th><th>Oferta</th></tr></thead><tbody>${statsRows}</tbody></table><figure>${cardArt(candidate)}<figcaption>Oferta · ${esc(candidate.name)}</figcaption></figure></div>
    ${impactPanel(impact)}
    <div class="dialog-actions"><button class="btn primary" data-action="buy-player" data-id="${id}" ${blocked?'disabled':''}>${buyLabel('Comprar',price,blocked)}</button><button class="btn" data-action="close">Fechar</button></div>`;
}
export function cardDetail(ctx,id) {
  const {db,run}=ctx,p=db.byId.get(id),mine=run&&C.rosterIds(run).includes(id),canSell=mine&&ctx.screen==='hub',kept=ctx.album[id];
  const roles=Object.entries(p.roleMaps).filter(([,n])=>n).sort((a,b)=>b[1]-a[1]),info=teamInfo(p.team);
  const agents=Object.entries(p.agentMaps).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return `${dialogHead(teamMark(p.team),esc(p.name))}
    <div class="detail">
      <div class="detail-art">${cardArt(p,{eager:true})}</div>
      <div class="detail-info">
        ${info.org?`<p class="muted">${esc(info.org)}${info.stateName?' · '+esc(info.stateName):''}</p>`:''}
        <p>${roleTag(p.role)} <span class="muted">${plural(p.maps,'mapa','mapas')} · ${num(p.rounds)} rounds</span></p>
        ${stats(p)}
        <p class="label">Funções</p><p>${roles.map(([role,n])=>`${role} ${n}`).join(' · ')||'-'}</p>
        <p class="label">Agentes</p>
        <div class="chips">${agents.map(([agent,n])=>E.AGENTS[agent]?agentChip(agent,`<small>${n}${run?.pool.includes(agent)?' ✓':''}</small>`):'').join('')}</div>
        <p class="label">Álbum</p><p>${kept?`${plural(kept.m,'partida','partidas')} · ${plural(kept.w,'vitória','vitórias')}${kept.t?` · ${plural(kept.t,'título','títulos')} ★`:''}`:'Ainda não jogou pelo seu time'}</p>
        ${canSell?`<button class="btn" data-action="sell" data-id="${p.id}">Vender ${coin(C.sellValue(p))}</button>`:''}
      </div>
    </div>`;
}
// Opening a pack: the best card walks out one fact at a time (role, agent, team, overall, card), then the choice appears.
export function packDialog(ctx) {
  const {db,run}=ctx,pack={name:C.packName(run.pack)},roster=C.rosterIds(run).map(id=>db.byId.get(id));
  const cards=run.pack.cards.map(id=>db.byId.get(id)),best=[...cards].sort((a,b)=>b.ovr-a.ovr||b.photo-a.photo)[0];
  return `<button class="walkout" data-action="skip-walkout" aria-label="Revelando ${esc(best.name)}. Clique para pular">
      <span class="walk-step role-${roleKey(best.role)}" style="--s:0">${roleIcon(best.role)}<b>${esc(best.role)}</b></span>
      <span class="walk-step role-${roleKey(E.AGENTS[best.comfort])}" style="--s:1">${agentIcon(best.comfort)}<b>${esc(best.comfort)}</b></span>
      <span class="walk-step" style="--s:2">${teamLogo(best.team)}<b>${esc(best.team)}</b></span>
      <span class="walk-step walk-ovr" style="--s:3"><b>${best.ovr}</b></span>
      <span class="walk-card" style="--s:4">${cardArt(best,{eager:true})}</span>
    </button>
    <div class="pack-pick"><header class="dialog-head"><div><p class="eyebrow">${pack.name}</p><h2 id="dialog-title">Fique com uma</h2></div></header>
    <div class="pack-cards">${cards.map((p,i)=>`<article class="pulled" style="--i:${i}">
      ${cardArt(p,{eager:true})}
      ${teamLine(p.team)}
      ${facts(p,run.pool,roster)}
      <button class="btn primary" data-action="take-card" data-id="${p.id}" aria-label="Ficar com ${esc(p.name)}">Ficar com esta</button></article>`).join('')}</div></div>`;
}
export function confirmQuitDaily(ctx) {
  const run=ctx.slots.daily;
  return `${dialogHead(`Desafio #${C.dailyNumber(run.daily)} · ${C.dayLabel(run.daily)}`,'Desistir do desafio?')}
    <p>O desafio deste dia termina onde está e não pode ser jogado de novo</p>
    <div class="dialog-actions"><button class="btn danger" data-action="confirm-daily-quit">Desistir</button><button class="btn" data-action="close" autofocus>Continuar jogando</button></div>`;
}
// The períodos of the traditional mode, chosen when a run starts: one row for each, with the rule it adds to the ones
// before it. The chosen one and every one under it are in force; the ones still closed are there too, out of reach.
// It opens on the período chosen the last time, or on the highest one open.
export function periodDialog(ctx,picked) {
  const open=C.periodsOf(ctx.career).period,want=picked??ctx.prefs?.period,chosen=Number.isInteger(want)&&want>=0&&want<=open?want:open;
  const free=ctx.slots.free,going=free&&free.status!=='over';
  const row=(step,text)=>`<li><button class="period${step<=chosen?' on':''}${step>open?' locked':''}" data-action="pick-period" data-id="${step}" aria-pressed="${step===chosen}"${step>open?' disabled':''}>${
    step?`<b>${step}º</b>`:'<i class="period-base" aria-hidden="true"></i>'}<span>${text}</span>${step>open?'<span class="sr-only">, bloqueado</span><i class="period-lock" aria-hidden="true"></i>':''}</button></li>`;
  return `${dialogHead('Modo tradicional','Períodos')}
    <ol class="periods" aria-label="Período da run">${row(0,C.periodName(0))}${C.LADDER.map((step,i)=>row(i+1,step.text)).join('')}</ol>
    ${going?'<p class="period-note">A run atual será abandonada</p>':''}
    <div class="dialog-actions"><button class="btn primary" data-action="start-period" data-id="${chosen}"${going?'':' autofocus'}>${chosen?`Começar no ${C.periodName(chosen)}`:`Começar como ${C.periodName(0)}`}</button><button class="btn" data-action="close"${going?' autofocus':''}>${going?'Continuar a atual':'Cancelar'}</button></div>`;
}
// The rules in force on the run on screen: the ones of its período and of every one before it.
export function periodRules(run) {
  return `${dialogHead('Modo tradicional',C.periodName(run.ascension))}
    <ol class="periods">${C.rulesOf(run).map((step,i)=>`<li class="period on"><b>${i+1}º</b><span>${step.text}</span></li>`).join('')}</ol>
    <div class="dialog-actions"><button class="btn" data-action="close" autofocus>Fechar</button></div>`;
}
export function confirmNewRun() {
  return `${dialogHead('Run em andamento','Começar outra run?')}
    <p>A run atual será abandonada</p>
    <div class="dialog-actions"><button class="btn primary" data-action="confirm-new-run">Abandonar e começar outra</button><button class="btn" data-action="close" autofocus>Continuar a atual</button></div>`;
}
