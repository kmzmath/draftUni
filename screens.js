// As telas do jogo. Cada função recebe o contexto (base, run, partida, estado de interface) e devolve HTML.
// As telas mostram dados e ações; as explicações ficam no tutorial (tour.js).
import * as E from './engine.js?v=302cec329d';
import * as C from './campaign.js?v=302cec329d';
import {previewChange} from './impact.js?v=302cec329d';
import {FREEZE_OPTIONS,freezeClock} from './pace.js?v=302cec329d';
import {albumSummary,cardStatus} from './album.js?v=302cec329d';
import {esc,num,signed,statText,statLabel,meter,stats,tierOf,roleKey,roleIcon,roleTag,formationIcon,agentIcon,agentChip,coin,cardArt,teamColor,teamInfo,teamLogo,teamFlag,teamMark,roundIcon,brandArt,mapFor,cutout,hasPhoto,mug,weapon,ticker,STAT_HELP} from './ui.js?v=302cec329d';

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
  return `<ol class="path" aria-label="Campanha">${C.STAGES.map((stage,i)=>{
    const record=run.record[i],state=run.result==='champion'||i<run.stage?'done':i===run.stage?'now':'next';
    const pips=(count,filled,kind)=>Array.from({length:count},(_,n)=>`<i class="pip ${kind} ${n<filled?'on':''}"></i>`).join('');
    return `<li class="path-stage ${state}"><span class="path-name">${stage.name}</span><span class="pips" role="img" aria-label="${record.w} de ${stage.wins} vitórias, ${record.l} de ${stage.losses} derrotas">${pips(stage.wins,record.w,'win')}<i class="pip-gap"></i>${pips(stage.losses,record.l,'loss')}</span></li>`;
  }).join('')}</ol>`;
}
export function chrome(ctx,content) {
  const run=ctx.run,inRun=run&&ctx.screen!=='home'&&ctx.screen!=='album';
  return `<header class="ribbon"><div class="ribbon-bar">
    <button class="brand" data-action="home" ${ctx.screen==='match'?'disabled':''} aria-label="Univavá Draft: tela inicial">${crest()}<b>UNIVAVÁ</b><em>DRAFT</em></button>
    ${inRun?path(run):'<span class="ribbon-fill"></span>'}
    <div class="ribbon-end">${inRun&&run.daily?`<span class="mode-tag" data-tip="Desafio do dia ${C.dayLabel(run.daily)}">Desafio #${C.dailyNumber(run.daily)}</span>`:''}${inRun?`<span class="wallet" data-tip="Moedas da run">${coin(run.coins)}</span>`:''}<button class="help" data-action="help" aria-label="Ajuda: explica esta tela passo a passo"><i aria-hidden="true">?</i>Ajuda</button></div>
  </div>${ticker()}</header>
  <main id="main" class="screen screen-${ctx.screen}">${content}</main>`;
}

// ---------- Início ----------
// The first screen offers the two ways to play, side by side: the Desafio do dia (one run a day, the same for everybody)
// and the traditional mode. Each tile shows where that run stands and what can be done with it.
function modes(ctx) {
  const {slots,today,career}=ctx,free=slots.free,daily=slots.daily;
  const going=daily&&daily.status!=='over',day=going?daily.daily:today;
  const done=going?'':daily?.daily===today?C.resultLine(daily):career.daily[today]?.line||'';
  const freeOn=free&&free.status!=='over';
  return `<div class="modes">
    <article class="mode daily"><p class="eyebrow">Desafio do dia · #${C.dailyNumber(day)} · ${C.dayLabel(day)}</p>
      <h2>${esc(capital(going?C.resultLine(daily):done||'ainda não jogado'))}</h2>
      <div class="mode-actions">${going?'<button class="btn primary big" data-action="daily">Continuar desafio</button><button class="link" data-action="daily-quit">Desistir</button>'
        :done?'<button class="btn" data-action="copy-result" data-id="daily">Copiar resultado</button>'
        :'<button class="btn primary big" data-action="daily">Jogar desafio</button>'}</div></article>
    <article class="mode free"><p class="eyebrow">Modo tradicional</p>
      <h2>${esc(capital(free?C.resultLine(free):'nenhuma run'))}</h2>
      <div class="mode-actions">${freeOn?'<button class="btn primary big" data-action="continue">Continuar run</button><button class="btn" data-action="new-run">Nova run</button>'
        :'<button class="btn primary big" data-action="new-run">Começar run</button>'}</div></article>
  </div>`;
}
export function home(ctx) {
  const {career}=ctx,summary=albumSummary(ctx.album,ctx.db.players);
  return `<section class="hero">
    <div class="hero-copy">
      ${mark('lockup','lockup','Valorant Universitário')||'<p class="eyebrow">Valorant universitário</p>'}
      <h1 class="hero-title">UNIVAVÁ <em>DRAFT</em></h1>
      <label class="team-name"><span>Seu time</span><input data-input="team" value="${esc(ctx.team)}" maxlength="24" placeholder="Nome do time" autocomplete="off" spellcheck="false" enterkeyhint="done"></label>
      ${modes(ctx)}
      <div class="hero-foot">
        <dl class="career"><div><dt>Runs</dt><dd>${career.runs}</dd></div><div><dt>Títulos</dt><dd>${career.titles}</dd></div><div><dt>Melhor campanha</dt><dd>${esc(career.best||'-')}</dd></div></dl>
        <button class="album-link" data-action="album" aria-label="Álbum de cartinhas: ${summary.have} de ${summary.total}"><span>Álbum</span><b>${summary.have}<small> / ${summary.total}</small></b></button>
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
// The laços between starters of the same team: one from each to the next of his team, under the cards, with the bonus
// all of them get. Each laço is a cell of the same grid as the cards, from the first card's column to the second's,
// so it starts and ends exactly under the two logos.
function bonds(lineup,perks) {
  const groups={};lineup.forEach((s,i)=>(groups[s.player.team]??=[]).push(i));
  const items=Object.entries(groups).filter(([,list])=>list.length>1).flatMap(([team,list])=>{
    const first=lineup[list[0]],gain=E.effective(first.player,first.agent,lineup,perks).chemistry;
    return list.slice(1).map((to,k)=>{
      // The farther apart the two are, the deeper the curve, so two laços never run one over the other.
      const from=list[k],dip=Math.min(72,30+(to-from)*14);
      return `<span class="bond" style="grid-column:${from+1} / ${to+2};--span:${to-from+1};--team:${teamColor(team)};--mid:${dip/80*100}%" aria-hidden="true"><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path pathLength="1" d="M0 0Q50 ${dip} 100 0"/></svg><b>+${gain}</b></span>`;
    });
  });
  return `<div class="bonds">${items.join('')}</div>`;
}
function starter(slot,i,lineup,ctx) {
  const p=slot.player,eff=E.effective(p,slot.agent,lineup,ctx.run.perks),selected=ctx.ui.selected===p.id;
  const mods=[eff.comfort&&`<span class="good">Conforto +${eff.comfort}</span>`,eff.chemistry&&`<span class="good">Equipe +${eff.chemistry}</span>`,eff.staff&&`<span class="good">Comissão +${eff.staff}</span>`,eff.penalty&&`<span class="bad">${eff.label} ${signed(eff.penalty)}</span>`].filter(Boolean);
  return `<div class="slot ${selected?'selected':''}" style="--i:${i};--team:${teamColor(p.team)}">
    <button class="slot-card" data-action="select" data-id="${p.id}" aria-pressed="${selected}" aria-label="${esc(p.name)}, titular, overall efetivo ${eff.value}">${cardArt(p,{effective:eff.value})}</button>
    <button class="agent-btn role-${roleKey(E.AGENTS[slot.agent])}" data-action="agent" data-id="${p.id}" aria-label="Agente de ${esc(p.name)}: ${slot.agent}. Trocar">${agentIcon(slot.agent)}<b>${slot.agent}</b><i aria-hidden="true">▾</i></button>
    <p class="mods">${mods.join('')}</p>
    <span class="slot-team" role="img" aria-label="${esc(p.team)}" data-tip="${esc(p.team)}">${teamLogo(p.team)}</span>
  </div>`;
}
function lineupTab(ctx) {
  const {db,run,ui}=ctx,lineup=C.lineupSlots(run,db),bench=run.bench.map(id=>db.byId.get(id));
  const picked=ui.selected&&db.byId.get(ui.selected);
  return `<div class="stage tray">
      <div class="stage-row">${lineup.map((slot,i)=>starter(slot,i,lineup,ctx)).join('')}${Array.from({length:5-lineup.length},()=>'<div class="slot empty"><span>Vaga</span></div>').join('')}</div>
      ${bonds(lineup,run.perks)}
    </div>
    ${picked?`<div class="selection" aria-live="polite"><p><b>${esc(picked.name)}</b> selecionado</p>
        <div><button class="btn small" data-action="detail" data-id="${picked.id}">Ver carta</button>
        <button class="btn small" data-action="sell" data-id="${picked.id}">Vender ${coin(C.sellValue(picked))}</button>
        <button class="link" data-action="deselect">Cancelar</button></div></div>`:''}
    <div class="under-stage"><div class="bench">
      <p class="label">Reservas <span>${C.rosterIds(run).length} / ${C.ROSTER_MAX}</span></p>
      <div class="bench-row">${bench.map(p=>`<button class="bench-card ${ui.selected===p.id?'selected':''}" data-action="select" data-id="${p.id}" aria-pressed="${ui.selected===p.id}" aria-label="${esc(p.name)}, reserva">${cardArt(p)}<span>${agentIcon(p.comfort)}${esc(p.comfort)}</span></button>`).join('')}
        ${Array.from({length:C.ROSTER_MAX-5-bench.length},()=>`<div class="bench-card empty"><span>Vaga</span></div>`).join('')}</div>
    </div>${staff(run)}</div>
    <div class="contracts tray"><p class="label">Contratos de agente <span>${run.pool.length} / ${Object.keys(E.AGENTS).length}</span></p>
      <div class="chips">${E.ROLES.flatMap(role=>run.pool.filter(agent=>E.AGENTS[agent]===role)).map(agent=>{
        const user=lineup.find(s=>s.agent===agent);return agentChip(agent,user?`<small>${esc(user.player.name)}</small>`:'');}).join('')}</div></div>`;
}
function marketCard(offer,ctx) {
  const {db,run}=ctx,p=db.byId.get(offer.id),price=C.playerPrice(run,p),roster=C.rosterIds(run).map(id=>db.byId.get(id));
  const blocked=offer.sold?'Comprado':roster.length>=C.ROSTER_MAX?'Elenco cheio':run.coins<price?'Faltam moedas':'';
  return `<article class="market-card ${offer.sold?'sold':''}">
    <button class="market-art" data-action="detail" data-id="${p.id}" aria-label="Ver carta de ${esc(p.name)}">${cardArt(p)}</button>
    ${teamLine(p.team)}
    ${facts(p,run.pool,roster)}
    ${run.lineup.length?`<button class="btn small" data-action="compare" data-id="${p.id}">Comparar com titular</button>`:''}
    <button class="btn ${blocked?'':'primary'}" data-action="buy-player" data-id="${p.id}" ${blocked?'disabled':''}>${buyLabel('Comprar',price,blocked)}</button>
  </article>`;
}
function shopTab(ctx) {
  const {db,run}=ctx,roster=C.rosterIds(run).map(id=>db.byId.get(id)),full=roster.length>=C.ROSTER_MAX;
  // The three packs by overall, and the role pack of this shop: one role, in the colour and with the symbol of that role.
  const packs=[...C.PACKS,C.rolePack(run)].filter(Boolean),reroll=C.rerollCost(run),perkCost=C.perkPackCost(run);
  return `<div class="shop">
    <section class="shop-block"><h2>Pacotes</h2>
      <div class="packs">${packs.map((pack,i)=>{const blocked=full?'Elenco cheio':run.coins<pack.cost?'Faltam moedas':'';
        return `<button class="pack pack-${pack.key} ${pack.role?'role-'+roleKey(pack.role):''}" style="--i:${i}" data-action="open-pack" data-id="${pack.key}" ${blocked?'disabled':''}>
          <span class="pack-art" aria-hidden="true">${pack.role?roleIcon(pack.role):crest()}</span><b>${pack.role?pack.name.replace('Pacote de ',''):pack.name}</b><small>${pack.role?'Pacote de função · ':'Overall '}${pack.range[0]} a ${pack.range[1]}</small><span class="price">${buyLabel('',pack.cost,blocked)}</span></button>`;}).join('')}</div></section>
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
function nextMatch(ctx) {
  const {db,run}=ctx,rivalTeam=run.opponent.team,info=teamInfo(rivalTeam),map=mapFor(run.matchSeed);
  const mine=C.lineupSlots(run,db),rival=C.opponentLineup(run,db),comp=E.composition(rival);
  // Fewer than five starters can't play: the only way forward is to complete the team or lose by W.O.
  const short=C.shortHanded(run),error=short?(mine.length===4?'Falta 1 titular':`Faltam ${5-mine.length} titulares`):C.lineupError(run,db);
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
  const tab=ctx.ui.tab,run=ctx.run,stage=C.STAGES[run.stage],record=run.record[run.stage];
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
  </div>`;
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
// The buys of the round, one against the other: a single bar split by how much of the equipment on the server each
// team carries (weapons and shields at their price), with the name of each team's buy at its end.
function buyBar(ctx,view) {
  if(!view.gear)return '';
  const worth=view.teams.map(players=>players.reduce((sum,p)=>sum+E.loadoutValue(p),0)),ours=E.loadoutShare(view.teams);
  const [mine,rival]=view.gear,them=esc(ctx.match.teams[1].name);
  return `<div class="buys" role="img" aria-label="Compras do round. ${ourName(ctx)}: ${mine}, ${ours}% do equipamento. ${them}: ${rival}, ${100-ours}%.">
    <p><b class="us">${mine}<i>${ours}%</i></b><b class="them"><i>${100-ours}%</i>${rival}</b></p>
    <div class="buys-bar"><i class="us" style="width:${ours}%" data-tip="${ourName(ctx)}: ¤ ${num(worth[0])} em armas e coletes"></i><i class="them" data-tip="${them}: ¤ ${num(worth[1])} em armas e coletes"></i></div>
  </div>`;
}
// The scoreboard of one team, ordered by kills. Rows carry data-flip so the app can animate them changing places.
function teamTable(ctx,view,t) {
  const name=ctx.match.teams[t].name,used=new Set(ctx.match.used);
  const rows=[...view.teams[t]].sort((a,b)=>b.k-a.k||a.d-b.d||b.a-a.a||a.order-b.order);
  return `<table class="squad ${t?'them':'us'}">
    <caption>${t?teamLogo(name):crest()}<b>${t?esc(name):ourName(ctx)}</b></caption>
    <thead><tr><th scope="col" class="c-mug"><span class="sr-only">Foto</span></th><th scope="col" class="c-agent"><span class="sr-only">Agente</span></th><th scope="col">Jogador</th><th scope="col" aria-label="Abates" data-tip="Abates">K</th><th scope="col" aria-label="Mortes" data-tip="Mortes">D</th><th scope="col" aria-label="Assistências" data-tip="Assistências">A</th><th scope="col">Créditos</th><th scope="col">Arma</th></tr></thead>
    <tbody>${rows.map(p=>`<tr data-flip="${p.id}" class="${p.dead?'dead':''} ${p.fell?'fell':''}"><td class="c-mug">${mug(p.id)}</td><td class="c-agent role-${roleKey(E.AGENTS[p.agent])}">${agentIcon(p.agent)}</td>
        <th scope="row"><span class="who"><b>${esc(p.name)}</b><small>${p.agent}</small></span>${t?'':`<i class="ready ${used.has(p.id)?'spent':''}" role="img" aria-label="${used.has(p.id)?'Já foi a um confronto':'Pode ir a um confronto'}" data-tip="${used.has(p.id)?'Já foi a um confronto':'Pode ir a um confronto'}"></i>`}</th>
        <td class="k ${p.hit?'hit':''}">${p.k}</td><td class="d">${p.d}</td><td>${p.a}</td><td class="cr">¤ ${num(p.credits)}</td><td class="wp">${weapon(p.weapon,{label:false,shield:p.shield})}</td></tr>`).join('')}</tbody></table>`;
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
        <span class="actor-stats">${event.stats.map(key=>`<span><small>${statLabel(key)}</small><b>${statText(key,s.player.stats[key])}</b>${meter(key,s.player.stats[key])}</span>`).join('')}</span>
        <em>${open?'Mandar':'Já agiu'}</em></span></button>`;}).join('')}</div>
  </section>`;
}
// The confrontation is shown in steps, driven by the app's clock: the two cards, then each attribute first as "?"
// and then revealed, and finally who took the round. duelStepMs says how long each step stays on screen.
function duelRows(contest) {
  const rows=contest.comparisons.map(v=>({kind:v.result,ours:statText(v.key,v.ours),label:statLabel(v.key),theirs:statText(v.key,v.theirs)}));
  // One attribute each: the effective overall decides. When that is level too, the row says so and a draw follows.
  if(contest.tiebreak){
    const level=contest.tiebreak==='coin',label=contest.edgeBonus?`Overall + Sangue frio (+${contest.edgeBonus})`:'Overall efetivo';
    rows.push({kind:level?'tie':`tie ${contest.won?'win':'loss'}`,ours:contest.contestOvr,label:level?`${label} · empate`:label,theirs:contest.enemyOvr});
    if(level)rows.push({kind:`tie ${contest.won?'win':'loss'}`,ours:contest.won?'✓':'-',label:'Sorteio',theirs:contest.won?'-':'✓'});
  }
  return rows;
}
export const duelSteps = contest=>2*duelRows(contest).length+2;
export const duelStepMs = (contest,step)=>step===0?1100:step===duelSteps(contest)-1?2400:step%2?850:950;
// One side of the confrontation. `team` is the line under the name: the rival's team, or the player's own.
// A player with a photo stands next to his card, on the outer side: photo then card for yours, card then photo for the
// rival. They are written in that order so the layout doesn't depend on reordering them.
function duelist(player,agent,side,team,effective) {
  const card=cardArt(player,{effective}),photo=cutout(player);
  return `<figure class="duel-card ${side} ${photo?'with-photo':''}">${side==='them'?card+photo:photo+card}
    <figcaption><b>${esc(player.name)}</b><small>${agentIcon(agent)}${agent}</small>${team}</figcaption></figure>`;
}
function momentResult(ctx) {
  const {record:r,step}=ctx.ui.duel,event=r.event,c=event.contest,rows=duelRows(c),called=step===duelSteps(c)-1;
  // Row i is asked at step 1+2i and revealed at step 2+2i.
  const row=(v,i)=>{const asked=1+2*i,shown=step>asked;
    if(step<asked)return '';
    return `<div class="duel-row ${shown?v.kind:''} ${step===asked?'new':''}"><b class="${shown?(step===asked+1?'pop':''):'ask'}">${shown?v.ours:'?'}</b><span>${v.label}</span><b class="${shown?(step===asked+1?'pop':''):'ask'}">${shown?v.theirs:'?'}</b></div>`;};
  return `<section class="moment resolved ${called?(r.won?'won':'lost'):''}" aria-labelledby="moment-title">
    <p class="eyebrow" id="moment-title">Round ${r.round} · ${event.by?'Jogada de Efeito do rival':'Sua Jogada de Efeito'} · ${event.label}</p>
    <div class="duel">
      ${duelist(event.actor,event.actorAgent,'us',`<span class="team">${crest()}<span>${ourName(ctx)}</span></span>`,c.ownOvr)}
      <div class="duel-table">${rows.map(row).join('')}
        ${called?`<p class="duel-score new"><b>${num(c.own,c.own%1?1:0)}</b><i>x</i><b>${num(c.enemy,c.enemy%1?1:0)}</b></p>`:''}
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
export function postmatch(ctx) {
  const {match:m,run,summary,db}=ctx,won=summary.won,entry=run.history.at(-1),stage=C.STAGES[entry.stage];
  const headline={continue:summary.forgiven?'Salvo pela Repescagem! Esta derrota não contou. Você perdeu "Repescagem" de sua comissão técnica':'',
    advanced:run.stage===2?'Classificados para os Playoffs!':'Classificados para a Fase de Grupos!',eliminated:exitLine(run),champion:'Campeão do Univavá'}[summary.outcome];
  // The games of the first two stages already carry the stage in their name; a playoff game gets it in front.
  const where=entry.stage===2?`${stage.name} · ${esc(entry.label)}`:esc(entry.label);
  const cta={continue:'Voltar ao elenco',advanced:run.status==='perk'?'Escolher bônus':'Voltar ao elenco',eliminated:'Ver resumo',champion:'Comemorar'}[summary.outcome];
  if(summary.forfeit)return `<div class="post lost forfeit">
    <header class="post-head"><p class="eyebrow">${where}</p>
      <h1>Derrota <span>W.O.</span></h1>
      <p class="post-rival">${teamMark(entry.opponent)}</p>${headline?`<p class="lede">${headline}</p>`:''}</header>
    <div class="post-grid"><section class="panel rewards"><p class="eyebrow">Moedas</p>
      <p class="reward-coins">+ ${coin(0)}</p>
      <ul><li>Partida não disputada <b>+0</b></li></ul>
      <button class="btn primary big" data-action="after-match">${cta}</button></section></div>
  </div>`;
  const mvpRow=[...m.teams[0].players].sort((a,b)=>rating(b)-rating(a))[0],mvp=db.byId.get(mvpRow.id);
  return `<div class="post ${won?'won':'lost'}">
    <header class="post-head"><p class="eyebrow">${where}</p>
      <h1>${won?'Vitória':'Derrota'} <span>${m.score[0]}-${m.score[1]}</span></h1>
      <p class="post-rival">${teamMark(entry.opponent)}</p>${headline?`<p class="lede">${headline}</p>`:''}</header>
    <div class="post-grid">
      <section class="panel mvp ${hasPhoto(mvp.id)?'with-photo':''}"><p class="eyebrow">Destaque</p>${cutout(mvp)||cardArt(mvp)}
        <h3>${esc(mvp.name)}</h3><p class="kda"><b>${mvpRow.k}</b> / <b>${mvpRow.d}</b> / <b>${mvpRow.a}</b><small>K / D / A · ${mvpRow.agent}</small></p></section>
      <section class="panel post-board">${teamTable(ctx,matchView(ctx),0)}${teamTable(ctx,matchView(ctx),1)}</section>
      <section class="panel rewards"><p class="eyebrow">Moedas</p>
        <p class="reward-coins">+ ${coin(summary.coins)}</p>
        <ul><li>Partida <b>+${C.MATCH_PAY}</b></li>${won?`<li>Vitória <b>+${C.WIN_BONUS}</b></li>`:''}${summary.streakCoins?`<li>${summary.streak} vitórias seguidas <b>+${summary.streakCoins}</b></li>`:''}${run.perks.includes('patrocinio')?'<li>Patrocínio <b>+60</b></li>':''}${won&&run.perks.includes('bicho')?'<li>Bicho <b>+40</b></li>':''}${summary.outcome==='advanced'?`<li>Fase vencida <b>+${C.STAGE_BONUS}</b></li>`:''}${summary.spare?`<li>Jogos que sobraram <b>+${summary.spare}</b></li>`:''}
          <li>Confrontos <b>${m.eventsWon} / ${m.eventsResolved}</b></li></ul>
        <button class="btn primary big" data-action="after-match">${cta}</button></section>
    </div>
  </div>`;
}
export function end(ctx) {
  const {run,db}=ctx,champion=run.result==='champion',lineup=C.lineupSlots(run,db),wins=run.history.filter(h=>h.won).length;
  return `<div class="end ${champion?'champion':''}">
    ${band(`${run.daily?`Desafio #${C.dailyNumber(run.daily)} · ${C.dayLabel(run.daily)}`:champion?'Univavá 2026':'Run encerrada'} · ${ourName(ctx)}`,champion?'Campeão do Univavá':exitLine(run),`${wins} V em ${plural(run.history.length,'partida','partidas')}`)}
    ${champion?`<div class="team-photo">${mark('finger','sticker finger')}${lineup.map((s,i)=>`<figure style="--i:${i}">${cutout(s.player)||mark('silhouette','cutout blank')}<figcaption>${agentIcon(s.agent)}<b>${esc(s.player.name)}</b></figcaption></figure>`).join('')}${mark('pennant','sticker pennant')}</div>`:''}
    <div class="end-lineup">${lineup.map((s,i)=>`<figure style="--i:${i}">${cardArt(s.player)}<figcaption>${agentIcon(s.agent)}${s.agent}</figcaption></figure>`).join('')}</div>
    <ol class="history tray">${run.history.map(h=>`<li class="${h.won?'won':'lost'}"><span>${esc(h.label)}</span><b>${teamLogo(h.opponent)}${esc(h.opponent)}</b><em>${h.forfeit?'W.O.':`${h.score[0]}-${h.score[1]}`}</em></li>`).join('')}</ol>
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
      ${agentIcon(agent)}<b>${agent}</b><span class="fit ${changeTone(after.value-before.value)}">${fit.label} · ${before.value} → ${after.value}</span>
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
    <p class="guide-lede">As funções dos cinco agentes escalados definem a formação. Ela soma ou tira pontos de chance em cada round, conforme o lado, e escolhe os confrontos de afinidade: os que saem com o dobro da frequência nas Jogadas de Efeito</p>
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
      ${balanced?'<li class="good">Equilíbrio, da sua comissão técnica: +3 no ataque e na defesa enquanto as quatro funções estiverem entre os titulares</li>':''}
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
  const offer=run.shop.market.find(o=>o.id===id&&!o.sold),blocked=!offer?'Indisponível':C.rosterIds(run).length>=C.ROSTER_MAX?'Elenco cheio':run.coins<price?'Faltam moedas':'';
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
export function confirmNewRun() {
  return `${dialogHead('Run em andamento','Começar outra run?')}
    <p>A run atual será abandonada</p>
    <div class="dialog-actions"><button class="btn primary" data-action="confirm-new-run">Abandonar e começar outra</button><button class="btn" data-action="close" autofocus>Continuar a atual</button></div>`;
}
