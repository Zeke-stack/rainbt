'use strict';
// Sportsbook for the Rainbet clone.
// Real Rainbet embeds Betby (rainbet.sportsbookcdn.com/bt-renderer.min.js, brand 2374656571012681728, geo-locked
// and fed by api.sptpub.com, neither reachable here). This module replaces the embed:
//  - fixtures/leagues/teams/odds hints come from ESPN's public scoreboard feed (snapshot in
//    sportsbook-snapshot.json, refreshed in the background; the file is the offline fallback),
//  - esports / tennis / boxing use static pools of real teams and players,
//  - live scores, clocks, odds drift and results are simulated deterministically from the event id and the clock,
//    so any server instance computes identical results (settlement needs no shared state),
//  - bets (singles + parlays) debit the balance immediately and settle automatically when the simulated event ends.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const SNAP_FILE = path.join(__dirname, 'sportsbook-snapshot.json');
const BETS_FILE = path.join(__dirname, 'sportsbook-bets.json');
const CLIENT_FILE = path.join(__dirname, 'sportsbook-client.js');
const CYCLE_MS = 45 * 60e3;
const REFRESH_MS = 30 * 60e3;
const MIN_STAKE = 0.1;
const MAX_STAKE = 25000;
const MAX_LEGS = 12;

// ---------------------------------------------------------------- sports
const SPORTS = [
  { id: 1, slug: 'soccer-1', name: 'Soccer', icon: '⚽', kind: 'poisson', draw: true, T: 2.7, u: 1, D: 9, mins: 90, unit: 'Goals' },
  { id: 2, slug: 'basketball-2', name: 'Basketball', icon: '🏀', kind: 'poisson', draw: false, T: 111, u: 2, D: 8, mins: 48, unit: 'Points' },
  { id: 3, slug: 'baseball-3', name: 'Baseball', icon: '⚾', kind: 'poisson', draw: false, T: 8.6, u: 1, D: 9, mins: 9, unit: 'Runs' },
  { id: 4, slug: 'ice-hockey-4', name: 'Ice Hockey', icon: '🏒', kind: 'poisson', draw: false, T: 6, u: 1, D: 8, mins: 60, unit: 'Goals' },
  { id: 5, slug: 'tennis-5', name: 'Tennis', icon: '🎾', kind: 'bestof', draw: false, D: 7, n: 3, unit: 'Sets' },
  { id: 10, slug: 'boxing-10', name: 'Boxing', icon: '🥊', kind: 'fight', draw: false, D: 6, R: 12 },
  { id: 16, slug: 'american-football-16', name: 'American Football', icon: '🏈', kind: 'poisson', draw: false, T: 15.3, u: 3, D: 9, mins: 60, unit: 'Points' },
  { id: 109, slug: 'counter-strike-109', name: 'Counter-Strike', icon: '🔫', kind: 'bestof', draw: false, D: 6, n: 3, unit: 'Maps' },
  { id: 110, slug: 'league-of-legends-110', name: 'League of Legends', icon: '🛡️', kind: 'bestof', draw: false, D: 6, n: 3, unit: 'Maps' },
  { id: 111, slug: 'dota-2-111', name: 'Dota 2', icon: '🐉', kind: 'bestof', draw: false, D: 6, n: 3, unit: 'Maps' },
  { id: 117, slug: 'mma-117', name: 'MMA', icon: '🥋', kind: 'fight', draw: false, D: 5, R: 3 },
  { id: 194, slug: 'esport-valorant-194', name: 'Valorant', icon: '🎯', kind: 'bestof', draw: false, D: 6, n: 3, unit: 'Maps' },
];
const SPORT_BY_ID = {};
SPORTS.forEach((s) => { SPORT_BY_ID[s.id] = s; });

const ESPN_LEAGUES = [
  [1, 'soccer/eng.1', 'England', 'Premier League'], [1, 'soccer/esp.1', 'Spain', 'LaLiga'], [1, 'soccer/ger.1', 'Germany', 'Bundesliga'],
  [1, 'soccer/ita.1', 'Italy', 'Serie A'], [1, 'soccer/fra.1', 'France', 'Ligue 1'], [1, 'soccer/uefa.champions', 'International', 'UEFA Champions League'],
  [1, 'soccer/uefa.europa', 'International', 'UEFA Europa League'], [1, 'soccer/usa.1', 'USA', 'MLS'], [1, 'soccer/mex.1', 'Mexico', 'Liga MX'],
  [1, 'soccer/ned.1', 'Netherlands', 'Eredivisie'], [1, 'soccer/por.1', 'Portugal', 'Primeira Liga'], [1, 'soccer/bra.1', 'Brazil', 'Brasileirão'],
  [1, 'soccer/arg.1', 'Argentina', 'Liga Profesional'], [1, 'soccer/eng.2', 'England', 'Championship'], [1, 'soccer/tur.1', 'Turkey', 'Süper Lig'],
  [2, 'basketball/nba', 'USA', 'NBA'], [2, 'basketball/mens-college-basketball', 'USA', 'NCAA Men'], [2, 'basketball/wnba', 'USA', 'WNBA'],
  [3, 'baseball/mlb', 'USA', 'MLB'], [4, 'hockey/nhl', 'USA', 'NHL'],
  [16, 'football/nfl', 'USA', 'NFL'], [16, 'football/college-football', 'USA', 'NCAA Football'],
  [117, 'mma/ufc', 'International', 'UFC'],
];

// static pools: [name, rating]
const POOLS = {
  5: { league: ['ATP Paris Masters', 'WTA Finals', 'ATP Challenger Tour', 'ITF Men'], country: 'International', logo: false, names: [['Jannik Sinner', 92], ['Carlos Alcaraz', 91], ['Novak Djokovic', 86], ['Alexander Zverev', 82], ['Daniil Medvedev', 80], ['Taylor Fritz', 78], ['Casper Ruud', 75], ['Alex de Minaur', 74], ['Holger Rune', 72], ['Ben Shelton', 71], ['Tommy Paul', 70], ['Grigor Dimitrov', 69], ['Stefanos Tsitsipas', 68], ['Frances Tiafoe', 66], ['Andrey Rublev', 69], ['Ugo Humbert', 64], ['Arthur Fils', 65], ['Lorenzo Musetti', 67], ['Jack Draper', 70], ['Karen Khachanov', 63]] },
  10: { league: ['World Championship Boxing', 'WBC Title Fights'], country: 'International', names: [['Oleksandr Usyk', 92], ['Tyson Fury', 85], ['Canelo Alvarez', 86], ['Terence Crawford', 88], ['Naoya Inoue', 90], ['Dmitry Bivol', 87], ['Artur Beterbiev', 84], ['Gervonta Davis', 85], ['Devin Haney', 80], ['Ryan Garcia', 74], ['Jaron Ennis', 84], ['Shakur Stevenson', 86], ['Jermell Charlo', 78], ['Anthony Joshua', 79], ['Daniel Dubois', 76], ['Joe Joyce', 68]] },
  109: { league: ['IEM Major', 'BLAST Premier', 'ESL Pro League'], country: 'International', names: [['Natus Vincere', 84], ['FaZe Clan', 82], ['Vitality', 90], ['G2 Esports', 80], ['MOUZ', 83], ['Team Spirit', 86], ['The MongolZ', 81], ['FURIA', 79], ['Astralis', 70], ['Cloud9', 66], ['Heroic', 74], ['Liquid', 72], ['Falcons', 78], ['Virtus.pro', 73]] },
  110: { league: ['LCK', 'LPL', 'LEC', 'LCS'], country: 'International', names: [['T1', 92], ['Gen.G', 90], ['Hanwha Life', 82], ['Dplus KIA', 78], ['KT Rolster', 72], ['Bilibili Gaming', 84], ['JD Gaming', 83], ['Top Esports', 76], ['G2 Esports', 80], ['Fnatic', 77], ['Team Vitality', 70], ['Cloud9', 68], ['Team Liquid', 66], ['FlyQuest', 67]] },
  111: { league: ['The International', 'DreamLeague', 'PGL Wallachia'], country: 'International', names: [['Team Spirit', 88], ['Team Falcons', 86], ['Gaimin Gladiators', 82], ['Tundra Esports', 80], ['BetBoom Team', 79], ['Team Liquid', 78], ['Natus Vincere', 74], ['Xtreme Gaming', 76], ['Heroic', 70], ['Aurora', 72], ['OG', 66], ['Nigma Galaxy', 64]] },
  194: { league: ['VCT Champions', 'VCT Pacific', 'VCT EMEA', 'VCT Americas'], country: 'International', names: [['Sentinels', 82], ['Fnatic', 84], ['Paper Rex', 86], ['DRX', 78], ['Team Heretics', 80], ['LOUD', 76], ['Gen.G', 83], ['Team Liquid', 75], ['G2 Esports', 79], ['100 Thieves', 72], ['NRG', 77], ['EDward Gaming', 74]] },
  117: { league: ['UFC Fight Night', 'UFC 320'], country: 'International', names: [['Islam Makhachev', 92], ['Ilia Topuria', 91], ['Jon Jones', 90], ['Alex Pereira', 86], ['Dricus du Plessis', 82], ['Merab Dvalishvili', 84], ['Max Holloway', 80], ['Charles Oliveira', 79], ['Justin Gaethje', 74], ['Sean O\'Malley', 76], ['Belal Muhammad', 77], ['Leon Edwards', 76], ['Tom Aspinall', 85], ['Khamzat Chimaev', 83], ['Arman Tsarukyan', 78], ['Movsar Evloev', 75]] },
  3: { league: ['MLB'], country: 'USA', names: [['New York Yankees', 80], ['Los Angeles Dodgers', 88], ['Houston Astros', 74], ['Atlanta Braves', 78], ['Philadelphia Phillies', 77], ['Baltimore Orioles', 72], ['Texas Rangers', 68], ['San Diego Padres', 74], ['Seattle Mariners', 70], ['Boston Red Sox', 66], ['Chicago Cubs', 62], ['Toronto Blue Jays', 64]] },
};

// ---------------------------------------------------------------- helpers
const hash32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const r2 = (n) => Math.round(n * 100) / 100;
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const amer = (ml) => { ml = Number(ml); if (!ml) return null; return ml > 0 ? 100 / (ml + 100) : -ml / (-ml + 100); };
const initials = (n) => String(n).split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

// ---------------------------------------------------------------- snapshot (real ESPN feed)
let snapshot = { fetchedAt: 0, events: [] };
try { snapshot = JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8')); } catch (e) { /* none yet */ }
let refreshing = false;
let lastRefreshAt = 0;

async function getJson(url) {
  try {
    const r = await fetch(url, { headers: { 'Accept-Encoding': 'identity' } });
    if (r.ok) return await r.json();
  } catch (e) { /* fall back to curl */ }
  return new Promise((resolve) => {
    execFile(process.platform === 'win32' ? 'curl.exe' : 'curl', ['-sL', '-m', '20', '--compressed', url], { maxBuffer: 30e6 }, (err, out) => {
      if (err) return resolve(null);
      try { resolve(JSON.parse(out)); } catch (e) { resolve(null); }
    });
  });
}

function hintFrom(odds) {
  if (!odds) return null;
  const h = { mlH: odds.homeTeamOdds && odds.homeTeamOdds.moneyLine, mlA: odds.awayTeamOdds && odds.awayTeamOdds.moneyLine, mlD: odds.drawOdds && odds.drawOdds.moneyLine, ou: odds.overUnder };
  return h.mlH || h.mlA ? h : null;
}

async function refreshSnapshot() {
  if (refreshing) return;
  refreshing = true;
  lastRefreshAt = Date.now();
  try {
    const events = [];
    const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
    const jobs = [];
    for (const [sportId, p, country, lname] of ESPN_LEAGUES) {
      for (let i = 0; i < 5; i++) jobs.push([sportId, p, country, lname, day(i)]);
    }
    const seen = new Set();
    let ok = 0;
    for (let i = 0; i < jobs.length; i += 8) {
      await Promise.all(jobs.slice(i, i + 8).map(async ([sportId, p, country, lname, d]) => {
        const j = await getJson('https://site.api.espn.com/apis/site/v2/sports/' + p + '/scoreboard?dates=' + d);
        if (!j || !j.events) return;
        ok++;
        for (const ev of j.events) {
          if (ev.status && ev.status.type && ev.status.type.state === 'post') continue;
          for (const comp of ev.competitions || []) {
            const cs = comp.competitors || [];
            const home = cs.find((c) => c.homeAway === 'home') || cs[0];
            const away = cs.find((c) => c.homeAway === 'away') || cs[1];
            if (!home || !away) continue;
            const side = (c) => {
              const nm = (c.team && (c.team.displayName || c.team.name)) || (c.athlete && c.athlete.displayName);
              return nm ? { n: nm, a: (c.team && c.team.abbreviation) || initials(nm), l: (c.team && c.team.logo) || (c.athlete && c.athlete.headshot && c.athlete.headshot.href) || '' } : null;
            };
            const h = side(home), a = side(away);
            if (!h || !a) continue;
            const key = p + ':' + (comp.id || ev.id);
            if (seen.has(key)) continue;
            seen.add(key);
            events.push({ key, sport: sportId, league: lname, country, lkey: p, home: h, away: a, start: Date.parse(comp.date || ev.date) || 0, hint: hintFrom((comp.odds || [])[0]) });
          }
        }
      }));
    }
    if (ok > 5 && events.length) {
      snapshot = { fetchedAt: Date.now(), events };
      baseCache = null;
      try { fs.writeFileSync(SNAP_FILE, JSON.stringify(snapshot)); } catch (e) { /* read-only fs */ }
    }
  } catch (e) { /* keep the previous snapshot */ } finally { refreshing = false; }
}

// ---------------------------------------------------------------- base fixtures
let baseCache = null;
function bases() {
  if (baseCache) return baseCache;
  const list = [];
  const ratingOf = (n) => 35 + (hash32('r' + n) % 4000) / 100;
  const cap = { 1: 30, 2: 14, 4: 12, 16: 10, 117: 8 };
  const perSport = {}, perLeague = {};
  for (const e of snapshot.events.slice().sort((x, y) => x.start - y.start)) {
    const sp = SPORT_BY_ID[e.sport];
    if (!sp) continue;
    perSport[sp.id] = (perSport[sp.id] || 0) + 1;
    perLeague[e.lkey] = (perLeague[e.lkey] || 0) + 1;
    if (perSport[sp.id] > (cap[sp.id] || 12) || perLeague[e.lkey] > 7) continue;
    list.push({ key: e.key, sport: sp, league: e.league, country: e.country, lkey: e.lkey, home: e.home, away: e.away, hint: e.hint, rh: ratingOf(e.home.n), ra: ratingOf(e.away.n) });
  }
  // static pools: pair deterministically
  for (const sid of Object.keys(POOLS)) {
    const pool = POOLS[sid];
    const sp = SPORT_BY_ID[sid];
    if ((+sid === 3 || +sid === 117) && list.some((b) => b.sport.id === +sid)) continue;
    const rnd = mulberry(hash32('pool' + sid));
    const names = pool.names.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    const cnt = Math.min(Math.floor(names.length / 2), +sid === 3 ? 6 : 8);
    for (let i = 0; i < cnt; i++) {
      const a = names[2 * i], b = names[2 * i + 1];
      const lg = pool.league[i % pool.league.length];
      list.push({ key: 'pool' + sid + ':' + slugify(a[0]) + '-' + slugify(b[0]), sport: sp, league: lg, country: pool.country, lkey: 'pool' + sid + ':' + lg, home: { n: a[0], a: initials(a[0]), l: '' }, away: { n: b[0], a: initials(b[0]), l: '' }, hint: null, rh: a[1], ra: b[1] });
    }
  }
  list.sort((x, y) => hash32(x.key) - hash32(y.key));
  const n = list.length || 1;
  list.forEach((b, i) => {
    b.slot = Math.floor((i * CYCLE_MS) / n);
    b.leagueId = (hash32(b.lkey) % 90000) + 100;
    b.leagueSlug = slugify(b.league) + '-' + b.leagueId;
    b.param = calibrate(b);
  });
  baseCache = list;
  return list;
}

// ---------------------------------------------------------------- model
function pois(l, N) {
  const p = new Array(N + 1);
  p[0] = Math.exp(-l);
  for (let k = 1; k <= N; k++) p[k] = (p[k - 1] * l) / k;
  return p;
}
function homeWinProb(b, q, T) {
  const sp = b.sport;
  if (sp.kind === 'poisson') {
    const lh = T * q, la = T * (1 - q), N = Math.ceil(Math.max(lh, la) + 6 * Math.sqrt(Math.max(lh, la)) + 6);
    const ph = pois(lh, N), pa = pois(la, N);
    let w = 0, d = 0, tot = 0;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const p = ph[i] * pa[j]; tot += p; if (i > j) w += p; else if (i === j) d += p; }
    return sp.draw ? w / tot : (w + d / 2) / tot;
  }
  if (sp.kind === 'bestof') return q * q * (3 - 2 * q);
  return q;
}
function targetHome(b) {
  const sp = b.sport;
  const h = b.hint;
  if (h) {
    const ph = amer(h.mlH), pa = amer(h.mlA), pd = amer(h.mlD) || 0;
    if (ph && pa) { const s = ph + pa + pd; return Math.min(0.9, Math.max(0.08, ph / s)); }
  }
  const d = (b.rh - b.ra) / 100;
  const adv = sp.kind === 'poisson' ? 0.04 : 0;
  const base = sp.draw ? 0.38 : 0.5;
  return Math.min(0.88, Math.max(0.1, base + d * (sp.draw ? 0.7 : 1.05) + adv));
}
function calibrate(b) {
  const sp = b.sport;
  const t = targetHome(b);
  const total = sp.kind === 'poisson' ? (b.hint && b.hint.ou && sp.id === 1 ? b.hint.ou : sp.T) : 0;
  let lo = 0.02, hi = 0.98;
  for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (homeWinProb(b, m, total) < t) lo = m; else hi = m; }
  return { q: (lo + hi) / 2, total, t };
}

const simCache = new Map();
function sim(b, id) {
  let s = simCache.get(id);
  if (s) return s;
  const sp = b.sport;
  const rnd = mulberry(hash32(id));
  s = { endF: 1 };
  if (sp.kind === 'poisson') {
    const Tot = b.param.total;
    const lh = Tot * b.param.q, la = Tot * (1 - b.param.q);
    const draw = (l) => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L && k < 200); return k - 1; };
    const H = draw(lh), A = draw(la);
    const toks = [];
    for (let i = 0; i < H; i++) toks.push('h');
    for (let i = 0; i < A; i++) toks.push('a');
    for (let i = toks.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [toks[i], toks[j]] = [toks[j], toks[i]]; }
    const times = toks.map(() => rnd()).sort((x, y) => x - y);
    s.tokens = toks.map((side, i) => ({ side, t: times[i] * 0.985 }));
    s.lh = Tot * b.param.q; s.la = Tot * (1 - b.param.q);
    if (!sp.draw && H === A) s.tokens.push({ side: rnd() < b.param.q ? 'h' : 'a', t: 0.99 });
    s.final = scoreAt(s, sp, 1);
  } else if (sp.kind === 'bestof') {
    const p = b.param.q;
    const res = [];
    let wh = 0, wa = 0;
    while (wh < 2 && wa < 2) { const hw = rnd() < p; res.push(hw ? 'h' : 'a'); if (hw) wh++; else wa++; }
    s.maps = res;
    s.endF = res.length / sp.n;
    s.final = { h: wh, a: wa };
  } else {
    const hw = rnd() < b.param.q;
    const dist = rnd() < (sp.R === 12 ? 0.5 : 0.55);
    const r = dist ? sp.R : 1 + Math.floor(rnd() * (sp.R - 0.01));
    s.winner = hw ? 'h' : 'a';
    s.rounds = r;
    s.endF = r / sp.R;
    s.final = { h: hw ? 1 : 0, a: hw ? 0 : 1 };
  }
  if (simCache.size > 600) simCache.clear();
  simCache.set(id, s);
  return s;
}
function scoreAt(s, sp, f) {
  if (s.tokens) {
    let h = 0, a = 0;
    for (const t of s.tokens) { if (t.t <= f) { if (t.side === 'h') h++; else a++; } }
    return { h: h * sp.u, a: a * sp.u };
  }
  if (s.maps) {
    let h = 0, a = 0;
    s.maps.forEach((m, i) => { if ((i + 1) / 3 <= f + 1e-9) { if (m === 'h') h++; else a++; } });
    return { h, a };
  }
  return f >= s.endF ? s.final : { h: 0, a: 0 };
}

const MARGIN = 0.055;
function toOdds(p) { return p < 0.004 ? null : Math.min(99, Math.max(1.01, r2((1 - MARGIN) / p))); }

// markets for an event at fraction f of the sim timeline
function markets(b, ev, f, nowMs) {
  const sp = b.sport;
  const s = sim(b, ev.id);
  const drift = 1 + 0.02 * Math.sin(nowMs / 7000 + (hash32(ev.id) % 628) / 100);
  const out = [];
  const add = (id, name, outs) => {
    const sum = outs.reduce((a, o) => a + o.p, 0) || 1;
    out.push({ id, name, outcomes: outs.map((o) => {
      let p = o.p / sum;
      if (o.id === 'h' || o.id === 'over' || o.id === 'yes') p *= drift; else if (o.id === 'a' || o.id === 'under' || o.id === 'no') p /= drift;
      return { id: o.id, name: o.name, line: o.line, odds: toOdds(Math.min(0.995, p)) };
    }) });
  };
  const home = b.home.n, away = b.away.n;
  if (sp.kind === 'poisson') {
    const cur = scoreAt(s, sp, f);
    const cH = cur.h / sp.u, cA = cur.a / sp.u;
    const rem = Math.max(0, 1 - f);
    const lh = s.lh * rem, la = s.la * rem;
    const N = Math.ceil(Math.max(lh, la) + 6 * Math.sqrt(Math.max(lh, la)) + 5);
    const ph = pois(lh, N), pa = pois(la, N);
    const meanTot = (cH + cA + lh + la) * sp.u;
    let L = Math.floor(meanTot) + 0.5;
    if (L < (cH + cA) * sp.u) L = (cH + cA) * sp.u + 0.5;
    const meanDiff = (cH - cA + lh - la) * sp.u;
    const hl = -(Math.floor(meanDiff) + 0.5);
    let w = 0, d = 0, l = 0, ov = 0, hc = 0, bt = 0, tot = 0;
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const p = ph[i] * pa[j];
        if (p < 1e-12) continue;
        tot += p;
        const H = (cH + i) * sp.u, A = (cA + j) * sp.u;
        if (H > A) w += p; else if (H === A) d += p; else l += p;
        if (H + A > L) ov += p;
        if (H + hl > A) hc += p;
        if (cH + i > 0 && cA + j > 0) bt += p;
      }
    }
    w /= tot; d /= tot; l /= tot; ov /= tot; hc /= tot; bt /= tot;
    if (sp.draw) {
      add('ml', 'Match Winner (1X2)', [{ id: 'h', name: home, p: w }, { id: 'd', name: 'Draw', p: d }, { id: 'a', name: away, p: l }]);
    } else {
      const ws = w + d * (w / (w + l || 1));
      add('ml', 'Moneyline', [{ id: 'h', name: home, p: ws }, { id: 'a', name: away, p: 1 - ws }]);
    }
    add('total', 'Total ' + sp.unit, [{ id: 'over', name: 'Over ' + L, line: L, p: ov }, { id: 'under', name: 'Under ' + L, line: L, p: 1 - ov }]);
    add('hcap', 'Handicap', [{ id: 'h', name: home + ' (' + (hl > 0 ? '+' : '') + hl + ')', line: hl, p: hc }, { id: 'a', name: away + ' (' + (-hl > 0 ? '+' : '') + (-hl) + ')', line: hl, p: 1 - hc }]);
    if (sp.id === 1) {
      add('btts', 'Both Teams To Score', [{ id: 'yes', name: 'Yes', p: bt }, { id: 'no', name: 'No', p: 1 - bt }]);
      add('dc', 'Double Chance', [{ id: '1x', name: home + ' or Draw', p: w + d }, { id: '12', name: home + ' or ' + away, p: w + l }, { id: 'x2', name: 'Draw or ' + away, p: d + l }]);
    }
  } else if (sp.kind === 'bestof') {
    const cur = scoreAt(s, sp, f);
    const p = b.param.q;
    const finals = [];
    const walk = (h, a, pr) => { if (h === 2 || a === 2) { finals.push([h, a, pr]); return; } walk(h + 1, a, pr * p); walk(h, a + 1, pr * (1 - p)); };
    walk(cur.h, cur.a, 1);
    let w = 0, three = 0, hc = 0;
    const fav = p >= 0.5;
    const hl = fav ? -1.5 : 1.5;
    for (const [h, a, pr] of finals) { if (h > a) w += pr; if (h + a === 3) three += pr; if (h + hl > a) hc += pr; }
    add('ml', 'Match Winner', [{ id: 'h', name: home, p: w }, { id: 'a', name: away, p: 1 - w }]);
    add('total', 'Total ' + sp.unit, [{ id: 'over', name: 'Over 2.5', line: 2.5, p: three }, { id: 'under', name: 'Under 2.5', line: 2.5, p: 1 - three }]);
    add('hcap', sp.unit + ' Handicap', [{ id: 'h', name: home + ' (' + (hl > 0 ? '+' : '') + hl + ')', line: hl, p: hc }, { id: 'a', name: away + ' (' + (-hl > 0 ? '+' : '') + (-hl) + ')', line: hl, p: 1 - hc }]);
  } else {
    const t = b.param.q;
    const w = t + ((s.winner === 'h' ? 1 : 0) - t) * Math.pow(Math.min(1, f / s.endF), 2) * 0.5;
    add('ml', 'Fight Winner', [{ id: 'h', name: home, p: w }, { id: 'a', name: away, p: 1 - w }]);
    const pd = Math.max(0.02, 0.5 * (1 - f) + (s.endF >= 1 ? f : 0) * 0.5);
    add('dist', 'Fight Goes The Distance', [{ id: 'yes', name: 'Yes', p: s.endF >= 1 ? Math.min(0.97, pd + f * 0.4) : Math.max(0.03, pd * (1 - f)) }, { id: 'no', name: 'No', p: s.endF >= 1 ? Math.max(0.03, 1 - pd - f * 0.4) : 1 - Math.max(0.03, pd * (1 - f)) }]);
  }
  return out;
}

function clockLabel(sp, s, f) {
  if (f >= s.endF) return 'Ended';
  const x = f;
  const per = (n, len) => { const fr = Math.min(0.9999, x * n - Math.floor(x * n)); const sec = Math.round((1 - fr) * len * 60); return Math.min(n, Math.floor(x * n) + 1) + '|' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  if (sp.id === 1) { const m = Math.floor(x * 90) + 1; return m + "'"; }
  if (sp.id === 2) return 'Q' + per(4, 12).replace('|', ' ');
  if (sp.id === 4) return 'P' + per(3, 20).replace('|', ' ');
  if (sp.id === 16) return 'Q' + per(4, 15).replace('|', ' ');
  if (sp.id === 3) { const inn = Math.min(9, Math.floor(x * 9) + 1); return ((x * 9 - Math.floor(x * 9)) < 0.5 ? 'Top ' : 'Bot ') + inn; }
  if (sp.kind === 'bestof') return (sp.id === 5 ? 'Set ' : 'Map ') + Math.min(3, Math.floor(x * 3) + 1);
  return 'Round ' + Math.min(sp.R, Math.floor(x * sp.R) + 1);
}

// ---------------------------------------------------------------- live event instances
function instance(b, k) {
  const start = k * CYCLE_MS + b.slot;
  const id = b.key + '~' + k;
  return { id, base: b, k, start };
}
function eventById(id) {
  const m = String(id).match(/^(.+)~(-?\d+)$/);
  if (!m) return null;
  const b = bases().find((x) => x.key === m[1]);
  return b ? instance(b, +m[2]) : null;
}
function timing(ev, now) {
  const b = ev.base, sp = b.sport;
  const s = sim(b, ev.id);
  const dur = sp.D * 60e3;
  const elapsed = now - ev.start;
  const f = elapsed < 0 ? 0 : Math.min(1, elapsed / dur);
  const end = ev.start + dur * s.endF;
  return { s, f, end, state: elapsed < 0 ? 'pre' : now >= end ? 'ended' : 'live' };
}

function shape(ev, now, withMarkets) {
  const b = ev.base, sp = b.sport;
  const t = timing(ev, now);
  const o = {
    id: ev.id, sportId: sp.id, league: b.league, leagueId: b.leagueId, leagueSlug: b.leagueSlug, country: b.country,
    home: b.home, away: b.away, start: ev.start, status: t.state, end: t.end,
  };
  if (t.state !== 'pre') {
    const sc = scoreAt(t.s, sp, t.f);
    o.score = sc;
    o.clock = clockLabel(sp, t.s, t.f);
    let suspended = t.state === 'ended' || t.f / t.s.endF > 0.93;
    if (t.s.tokens) {
      for (const tk of t.s.tokens) { const at = ev.start + tk.t * sp.D * 60e3; if (now >= at && now - at < 5000) suspended = true; }
    }
    o.suspended = suspended;
  }
  if (withMarkets) o.markets = markets(b, ev, t.f, now);
  return o;
}

function liveFeed(now) {
  const list = [];
  for (const b of bases()) {
    const kLatest = Math.floor((now - b.slot) / CYCLE_MS);
    const cur = instance(b, kLatest);
    const t = timing(cur, now);
    if (t.state === 'live') list.push(shape(cur, now, true));
    else list.push(shape(instance(b, kLatest + 1), now, true));
  }
  return list;
}

// ---------------------------------------------------------------- settlement
function legResult(leg, ev) {
  const b = ev.base, sp = b.sport;
  const s = sim(b, ev.id);
  const H = s.final.h, A = s.final.a;
  const x = leg.outcome;
  if (leg.market === 'ml') {
    if (H === A) return x === 'd' ? 'won' : 'lost';
    return (H > A ? 'h' : 'a') === x ? 'won' : 'lost';
  }
  if (leg.market === 'dc') {
    const r = H > A ? 'h' : H === A ? 'd' : 'a';
    return (x === '1x' ? r !== 'a' : x === 'x2' ? r !== 'h' : r !== 'd') ? 'won' : 'lost';
  }
  if (leg.market === 'total') {
    const tot = H + A;
    if (tot === leg.line) return 'void';
    return (tot > leg.line) === (x === 'over') ? 'won' : 'lost';
  }
  if (leg.market === 'hcap') {
    if (x === 'h') return H + leg.line === A ? 'void' : H + leg.line > A ? 'won' : 'lost';
    return A - leg.line === H ? 'void' : A - leg.line > H ? 'won' : 'lost';
  }
  if (leg.market === 'btts') return ((H > 0 && A > 0) === (x === 'yes')) ? 'won' : 'lost';
  if (leg.market === 'dist') return ((s.rounds === sp.R) === (x === 'yes')) ? 'won' : 'lost';
  return 'void';
}

module.exports = function createSportsbook(ctx) {
  const { getBal, setBal, addStats, log } = ctx;
  let bets = [];
  try { bets = JSON.parse(fs.readFileSync(BETS_FILE, 'utf8')); } catch (e) { /* none */ }
  const saveBets = () => { try { fs.writeFileSync(BETS_FILE, JSON.stringify(bets.slice(0, 300))); } catch (e) { /* read-only fs */ } };
  if (ctx.onReset) ctx.onReset(() => { bets = []; saveBets(); });

  const history = () => (ctx.betHistory ? ctx.betHistory() : null);

  function settleDue() {
    const now = Date.now();
    let changed = false;
    for (const bet of bets) {
      if (bet.status !== 'open') continue;
      let allDone = true, lost = false;
      for (const leg of bet.legs) {
        if (leg.status !== 'open') { if (leg.status === 'lost') lost = true; continue; }
        const ev = eventById(leg.eventId);
        if (!ev) { leg.status = 'void'; continue; }
        const t = timing(ev, now);
        if (t.state === 'ended') {
          leg.status = legResult(leg, ev);
          leg.result = t.s.final.h + '-' + t.s.final.a;
          if (leg.status === 'lost') lost = true;
        } else allDone = false;
      }
      if (lost || allDone) {
        let odds = 1;
        if (!lost) for (const leg of bet.legs) if (leg.status === 'won') odds *= leg.odds;
        bet.status = lost ? 'lost' : (bet.legs.every((l) => l.status === 'void') ? 'void' : 'won');
        bet.payout = lost ? 0 : r2(bet.stake * odds);
        bet.settledAt = now;
        if (bet.payout > 0) setBal(r2(getBal() + bet.payout));
        addStats(bet.stake, bet.payout, 3); // sportsbook wagers count 3x toward rank
        const h = history();
        if (h) {
          const row = h.find((x) => x.id === bet.id);
          if (row) { row.payout = bet.payout; row.multiplier = r2(bet.payout / bet.stake); row.result = bet.status === 'won' ? 'win' : bet.status === 'void' ? 'push' : 'loss'; }
        }
        log('SPORTSBOOK: ' + bet.type + ' ' + bet.id.slice(0, 8) + ' ' + bet.status + ' stake=' + bet.stake.toFixed(2) + ' payout=' + bet.payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
        changed = true;
      }
    }
    if (changed) saveBets();
    return changed;
  }
  const tm = setInterval(settleDue, 3000);
  if (tm.unref) tm.unref();

  const reply = (res, obj, code) => {
    res.writeHead(code || 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const publicBet = (b) => ({ ...b, legs: b.legs.map((l) => ({ ...l })) });

  function placeBet(body) {
    const now = Date.now();
    const items = Array.isArray(body.items) ? body.items : [];
    const type = body.type === 'parlay' ? 'parlay' : 'single';
    if (!items.length) return { error: 'empty_slip', message: 'Add a selection first.' };
    if (items.length > MAX_LEGS) return { error: 'too_many', message: 'Maximum ' + MAX_LEGS + ' selections.' };
    if (type === 'parlay' && items.length < 2) return { error: 'parlay_min', message: 'A parlay needs at least 2 selections.' };
    const resolved = [];
    const evs = new Set();
    for (const it of items) {
      const ev = eventById(it.eventId);
      if (!ev) return { error: 'unknown_event', message: 'Event is no longer available.', eventId: it.eventId };
      if (type === 'parlay' && evs.has(ev.id)) return { error: 'same_event', message: 'Selections from the same event cannot be combined.', eventId: ev.id };
      evs.add(ev.id);
      const t = timing(ev, now);
      const sh = shape(ev, now, true);
      if (t.state === 'ended' || sh.suspended) return { error: 'suspended', message: 'This market is currently suspended.', eventId: ev.id };
      const mk = sh.markets.find((m) => m.id === it.market);
      const oc = mk && mk.outcomes.find((o) => o.id === it.outcome);
      if (!oc || !oc.odds) return { error: 'unavailable', message: 'Selection is no longer available.', eventId: ev.id };
      if (oc.line !== undefined && Number(it.line) !== oc.line) return { error: 'odds_changed', message: 'The line has changed.', eventId: ev.id, market: it.market, outcome: it.outcome, odds: oc.odds, line: oc.line };
      if (it.odds && oc.odds < Number(it.odds) * 0.97) return { error: 'odds_changed', message: 'Odds have changed.', eventId: ev.id, market: it.market, outcome: it.outcome, odds: oc.odds, line: oc.line };
      resolved.push({
        eventId: ev.id, sportId: sh.sportId, league: sh.league, home: sh.home.n, away: sh.away.n, start: ev.start, live: t.state === 'live',
        market: mk.id, marketName: mk.name, outcome: oc.id, outcomeName: oc.name, line: oc.line, odds: oc.odds, status: 'open', stake: Number(it.stake) || 0,
      });
    }
    const placed = [];
    let total = 0;
    if (type === 'parlay') {
      const stake = r2(Number(body.stake));
      if (!(stake >= MIN_STAKE)) return { error: 'min_stake', message: 'Minimum stake is $' + MIN_STAKE.toFixed(2) + '.' };
      if (stake > MAX_STAKE) return { error: 'max_stake', message: 'Maximum stake is $' + MAX_STAKE + '.' };
      total = stake;
      const odds = r2(resolved.reduce((a, l) => a * l.odds, 1));
      placed.push({ stake, odds, legs: resolved });
    } else {
      for (const l of resolved) {
        const stake = r2(l.stake);
        if (!(stake >= MIN_STAKE)) return { error: 'min_stake', message: 'Minimum stake is $' + MIN_STAKE.toFixed(2) + '.', eventId: l.eventId };
        if (stake > MAX_STAKE) return { error: 'max_stake', message: 'Maximum stake is $' + MAX_STAKE + '.', eventId: l.eventId };
        total += stake;
        placed.push({ stake, odds: l.odds, legs: [l] });
      }
      total = r2(total);
    }
    if (total > getBal() + 1e-9) return { error: 'insufficient_balance', message: 'Insufficient balance.' };
    setBal(r2(getBal() - total));
    const out = [];
    for (const p of placed) {
      p.legs.forEach((l) => { delete l.stake; });
      const bet = { id: crypto.randomUUID(), type, stake: p.stake, odds: p.odds, potential: r2(p.stake * p.odds), status: 'open', payout: 0, placedAt: now, legs: p.legs };
      bets.unshift(bet);
      out.push(bet);
      const h = history();
      if (h) h.unshift({ id: bet.id, game: 'sportsbook', amount: bet.stake, payout: 0, multiplier: 0, currency: 'USD', time: now, result: 'pending' });
      log('SPORTSBOOK: placed ' + type + ' ' + bet.id.slice(0, 8) + ' stake=' + bet.stake.toFixed(2) + ' odds=' + bet.odds + ' bal=' + getBal().toFixed(2));
    }
    if (bets.length > 300) bets.length = 300;
    saveBets();
    return { ok: true, bets: out.map(publicBet), balance: getBal() };
  }

  // ---- real Betby widget bets (coupon format), settled with odds-fair random outcomes
  const BB_FILE = path.join(process.env.VERCEL ? require('os').tmpdir() : __dirname, 'sportsbook-bbets.json');
  let bbets = [];
  try { bbets = JSON.parse(fs.readFileSync(BB_FILE, 'utf8')); } catch (e) { /* none */ }
  const saveBB = () => { try { fs.writeFileSync(BB_FILE, JSON.stringify(bbets.slice(0, 200))); } catch (e) { /* read-only */ } };
  if (ctx.onReset) ctx.onReset(() => { bbets = []; saveBB(); });
  const BB_DIR = path.join(__dirname, 'bt-real', 'mirror', 'api-a-c7818b61-600.sptpub.com', 'api', 'v4');
  let evIndex = null;
  function betbyEvents() {
    if (evIndex) return evIndex;
    evIndex = new Map();
    for (const kind of ['prematch', 'live']) {
      const dir = path.join(BB_DIR, kind, 'brand', '2374656571012681728', 'en');
      let files = [];
      try { files = fs.readdirSync(dir).filter((f) => /^\d{6,}$/.test(f)); } catch (e) { continue; }
      for (const f of files) {
        try {
          const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          for (const id of Object.keys(j.events || {})) {
            const ev = j.events[id], d = ev.desc || {};
            evIndex.set(id, { competitors: (d.competitors || []).map((c) => ({ name: c.name })), tournament: { name: (j.tournaments && j.tournaments[d.tournament] || {}).name || '' }, sport: { id: d.sport }, scheduled: d.scheduled, markets: ev.markets });
          }
        } catch (e) { /* skip */ }
      }
    }
    return evIndex;
  }
  const LIVE_HOST = 'https://api-a-c7818b61-600.sptpub.com';
  const liveCache = new Map();
  let liveDownUntil = 0, liveOk = false;
  async function liveFetch(rel, search) {
    if (Date.now() < liveDownUntil) return null;
    const key = rel + search;
    const isManifest = /\/(live|prematch)\/brand\/\d+\/en\/0$/.test(rel);
    const ttl = isManifest ? 1500 : 60000;
    const hit = liveCache.get(key);
    if (hit && Date.now() - hit.t < ttl) return hit.body;
    try {
      let r, lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          r = await fetch(LIVE_HOST + rel + search, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', Origin: 'https://rainbet.sportsbookcdn.com', Referer: 'https://rainbet.sportsbookcdn.com/' } });
          if (r.ok || r.status === 404) break;
          lastErr = new Error('http ' + r.status);
        } catch (e) { lastErr = e; }
        r = null;
      }
      if (!r) throw lastErr;
      if (!r.ok) throw new Error('http ' + r.status);
      const body = Buffer.from(await r.arrayBuffer());
      liveCache.set(key, { t: Date.now(), body });
      liveOk = true;
      if (liveCache.size > 300) for (const k of [...liveCache.keys()].slice(0, 100)) liveCache.delete(k);
      if (/\/(live|prematch)\/brand\/\d+\/en\/\d{6,}$/.test(rel)) {
        try {
          const j = JSON.parse(body.toString('utf8'));
          const idx = betbyEvents();
          for (const id of Object.keys(j.events || {})) {
            const ev = j.events[id], d = ev.desc || {};
            idx.set(id, { competitors: (d.competitors || []).map((c) => ({ name: c.name })), tournament: { name: (j.tournaments && j.tournaments[d.tournament] || {}).name || '' }, sport: { id: d.sport }, scheduled: d.scheduled, markets: ev.markets });
          }
        } catch (e) { /* diff or partial */ }
      }
      return body;
    } catch (e) {
      if (!liveOk && !hit && !/http 404/.test(String(e))) liveDownUntil = Date.now() + 15000;
      console.log('[betby live] ' + rel + ' ' + e);
      return hit ? hit.body : null;
    }
  }
  liveFetch('/api/v4/live/brand/2374656571012681728/en/0', '').catch(() => {});
  const MARKET_NAMES = { 1: '1x2', 10: 'Double chance', 16: 'Handicap', 18: 'Total', 26: 'Total', 186: 'Winner', 219: 'Winner', 223: 'Handicap', 225: 'Total', 251: 'Winner' };
  const hash32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  function selName(sel, desc) {
    const c = desc.competitors || [];
    if (String(sel.market_id) === '1') return sel.outcome_id === '1' ? (c[0] && c[0].name) : sel.outcome_id === '2' ? (c[1] && c[1].name) : 'draw';
    return sel.specifiers ? String(sel.outcome_id) + ' (' + sel.specifiers.replace(/^.*=/, '') + ')' : String(sel.outcome_id);
  }
  function placeBetby(body) {
    const idx = betbyEvents();
    const fail = (message, code, alt) => ({ accepted: [], error: [{ bet_request_id: '', message, code: code || 1, ...(alt ? { alt_stake: alt } : {}) }], slips: undefined });
    let coupons;
    if (Array.isArray(body)) coupons = body;
    else if (body && Array.isArray(body.slips)) coupons = body.slips.map((s) => ({ ...s, bet_request_id: s.bets.map((i) => body.bets[i].event_id + '_' + body.bets[i].market_id + '_' + body.bets[i].outcome_id).join('_'), selections: s.bets.map((i) => body.bets[i]) }));
    else return fail('Invalid bet');
    const isSlips = !Array.isArray(body);
    let total = 0;
    for (const c of coupons) {
      const stake = r2(Number(c.sum));
      if (!(stake >= MIN_STAKE)) return fail('Min stake amount is ' + MIN_STAKE.toFixed(2), 221, MIN_STAKE.toFixed(2));
      if (stake > MAX_STAKE) return fail('Maximum stake is $' + MAX_STAKE);
      total += stake;
    }
    total = r2(total);
    if (total > getBal() + 1e-9) return fail('Insufficient balance');
    const now = Date.now(), accepted = [], slips = [];
    setBal(r2(getBal() - total));
    for (const c of coupons) {
      const id = String(BigInt('0x' + crypto.randomBytes(7).toString('hex')) + 1000000000000n);
      const sels = c.selections.map((s) => {
        const ev = idx.get(String(s.event_id)) || {};
        const mid = String(s.market_id);
        return { event_id: String(s.event_id), market_id: mid, market_name: MARKET_NAMES[mid] || 'Market', outcome_id: String(s.outcome_id), specifiers: s.specifiers || '', outcome_name: selName({ ...s, market_id: mid, outcome_id: String(s.outcome_id) }, ev), k: String(s.k), status: 'open', desc: { competitors: ev.competitors || [], tournament: ev.tournament || {}, sport: ev.sport || {}, scheduled: ev.scheduled } };
      });
      const k = c.selections.length > 1 ? r2(c.selections.reduce((a, s) => a * Number(s.k), 1)) : Number(c.k || c.selections[0].k);
      const stake = r2(Number(c.sum));
      const bet = { id, front_bet_id: id, type: c.selections.length > 1 ? 'combo' : 'single', status: 'open', timestamp: Math.floor(now / 1000), k: k.toFixed(2), sum: stake.toFixed(2), potential_win: r2(stake * k).toFixed(2), currency: 'USD', selections: sels, bet_request_id: c.bet_request_id };
      bbets.unshift(bet);
      accepted.push({ bet_request_id: c.bet_request_id, bonus_id: null });
      slips.push({ accepted: true, front_bet_id: id });
      const h = history();
      if (h) h.unshift({ id: 'sb' + id, game: 'sportsbook', amount: stake, payout: 0, multiplier: 0, currency: 'USD', time: now, result: 'pending' });
      log('SPORTSBOOK: placed ' + bet.type + ' ' + id + ' stake=' + stake.toFixed(2) + ' k=' + bet.k + ' bal=' + getBal().toFixed(2));
    }
    if (bbets.length > 200) bbets.length = 200;
    saveBB();
    return isSlips ? { success: true, slips, error: [] } : { accepted, error: [] };
  }
  function settleBetby() {
    const now = Date.now();
    let changed = false;
    for (const bet of bbets) {
      if (bet.status !== 'open') continue;
      const delay = 60e3 + hash32(bet.id + 'd') * 120e3;
      if (now - bet.timestamp * 1000 < delay) continue;
      let prob = 1;
      for (const s of bet.selections) prob *= Math.min(0.97, 0.94 / Number(s.k));
      const won = hash32(bet.id + 'w') < prob;
      const stake = Number(bet.sum);
      const payout = won ? r2(stake * Number(bet.k)) : 0;
      bet.status = won ? 'won' : 'lost';
      bet.selections.forEach((s) => { s.status = won ? 'won' : 'lost'; });
      if (won) { bet.result_sum = payout.toFixed(2); setBal(r2(getBal() + payout)); }
      addStats(stake, payout, 3);
      const h = history();
      const row = h && h.find((x) => x.id === 'sb' + bet.id);
      if (row) { row.payout = payout; row.multiplier = r2(payout / stake); row.result = won ? 'win' : 'loss'; }
      log('SPORTSBOOK: ' + bet.id + ' ' + bet.status + ' stake=' + stake.toFixed(2) + ' payout=' + payout.toFixed(2));
      changed = true;
    }
    if (changed) saveBB();
  }
  const tmb = setInterval(settleBetby, 5000);
  if (tmb.unref) tmb.unref();

  if (!lastRefreshAt && Date.now() - (snapshot.fetchedAt || 0) > REFRESH_MS) refreshSnapshot();
  const rt = setInterval(() => { if (Date.now() - lastRefreshAt > REFRESH_MS) refreshSnapshot(); }, 60e3);
  if (rt.unref) rt.unref();

  return async function handle(req, res, pathname, url) {
    if (process.env.VERCEL && url.searchParams.has('path')) url.searchParams.delete('path');
    if (pathname === '/bt-renderer.min.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      const real = path.join(__dirname, 'bt-real', 'bt-renderer.min.js');
      if (fs.existsSync(real) && url.searchParams.get('fake') !== '1') {
        let src = fs.readFileSync(real, 'utf8');
        const O = 'location.origin+';
        src = src.replace('r("https://api-a-c7818b61-600.sptpub.com")', 'r(' + O + '"/bt-api")')
          .replace('r("https://files-immutable-4cbc033nbd3.sptpub.com")', 'r(' + O + '"/bt-files")')
          .replace('r("https://bt-app-static-themes.sptpub.com")', 'r(' + O + '"/bt-themes")')
          .replace('r("https://static.sptpub.com")', 'r(' + O + '"/bt-static")')
          .replace('a.p="https://start3.sptpub.com/"', 'a.p=' + O + '"/bt-start3/"');
        res.end(src);
      } else res.end(fs.readFileSync(CLIENT_FILE));
      return true;
    }
    if (/^\/bt-api\/api\/v2\/coupon\/brand\/\d+\/bet\/place$/.test(pathname) && req.method === 'POST') {
      const b = await ctx.parseBody(req).catch(() => null);
      const out = placeBetby(b);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(out));
      return true;
    }
    if (/^\/bt-api\/api\/v2\/my_bets\/list$/.test(pathname)) {
      settleBetby();
      const q = url.searchParams;
      const st = q.get('status') || '';
      const skip = Number(q.get('skip')) || 0, limit = Number(q.get('limit')) || 50;
      const from = Number(q.get('timestamp_from')) || 0, to = Number(q.get('timestamp_to')) || 0;
      let list = bbets.filter((x) => (!st || x.status === st) && (!from || x.timestamp >= from) && (!to || x.timestamp <= to));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ count: list.length, results: list.slice(skip, skip + limit) }));
      return true;
    }
    if (/^\/bt-(api|files|themes|static|start3)\//.test(pathname)) {
      if (req.method !== 'GET' && req.method !== 'OPTIONS' && !process.env.VERCEL) {
        const b = await ctx.parseBody(req).catch(() => ({}));
        try { fs.appendFileSync(path.join(__dirname, 'bt-real', 'posts.log'), req.method + ' ' + pathname + url.search + ' ' + JSON.stringify(b) + '\n'); } catch (e) {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end('{}');
        return true;
      }
      const m = pathname.match(/^\/bt-(\w+)(\/.*)$/);
      const hosts = { api: 'api-a-c7818b61-600.sptpub.com', files: 'files-immutable-4cbc033nbd3.sptpub.com', themes: 'bt-app-static-themes.sptpub.com', static: 'static.sptpub.com', start3: 'start3.sptpub.com' };
      const host = hosts[m[1]];
      const rel = decodeURIComponent(m[2]).replace(/\.\.+/g, '');
      const sfx = url.search ? '@' + encodeURIComponent(url.search).replace(/%/g, '_') : '';
      const dir = path.join(__dirname, 'bt-real', m[1] === 'start3' ? 'start3' : path.join('mirror', host));
      const file = path.join(dir, rel + sfx);
      const types = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
      if (m[1] === 'api' && /\/auth\/brand\/\d+\/identify$/.test(rel)) {
        const sf = path.join(dir, rel.replace(/identify$/, 'settings') + '@' + encodeURIComponent('?lang=en').replace(/%/g, '_'));
        let base = {};
        try { base = JSON.parse(fs.readFileSync(sf, 'utf8')); } catch (e) {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ...base, user_id: '7KX2M9QPD4', external_id: '7KX2M9QPD4', balance: String(Math.round(getBal() * 100)), is_authorized: true }));
        return true;
      }
      if (m[1] === 'api' && req.method === 'GET' && /^\/api\/v\d+\/(live|prematch|side|auth_side|top|descriptions)\//.test(rel)) {
        const body = await liveFetch(rel, url.search);
        if (body) {
          const isManifest = /\/en\/0$/.test(rel);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Betby-Source': 'live' });
          res.end(body);
          return true;
        }
        if (liveOk && /\/(live|prematch|side)\//.test(rel)) {
          res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
          res.end('{}');
          return true;
        }
      }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': types[path.extname(rel)] || 'application/json', 'Cache-Control': m[1] === 'api' ? 'no-store' : 'public, max-age=300', 'Access-Control-Allow-Origin': '*' });
        res.end(fs.readFileSync(file));
      } else if (m[1] !== 'start3' && m[1] !== 'api' && req.method === 'GET') {
        let got = null;
        try {
          const r = await fetch('https://' + host + rel + url.search, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0', Origin: 'https://rainbet.sportsbookcdn.com', Referer: 'https://rainbet.sportsbookcdn.com/' } });
          if (r.ok) got = Buffer.from(await r.arrayBuffer());
        } catch (e) { /* fall through */ }
        if (got) {
          if (!process.env.VERCEL) try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, got); } catch (e) {}
          res.writeHead(200, { 'Content-Type': types[path.extname(rel)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' });
          res.end(got);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end('{}');
        }
      } else {
        if (!process.env.VERCEL) try { fs.appendFileSync(path.join(__dirname, 'bt-real', 'missing.txt'), m[1] + ' ' + rel + url.search + '\n'); } catch (e) {}
        res.writeHead(/\/(favorite|promo|bonus)\b/.test(rel) ? 200 : 404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(/\/(favorite|promo\/tournaments|promo\/banners)/.test(rel) ? '[]' : '{}');
      }
      return true;
    }
    if (pathname === '/v1/sportsbook/initiate') {
      reply(res, { jwt: 'local-sportsbook-' + crypto.randomBytes(8).toString('hex') });
      return true;
    }
    if (!pathname.startsWith('/sb-api/')) return false;
    if (Date.now() - (snapshot.fetchedAt || 0) > REFRESH_MS && Date.now() - lastRefreshAt > REFRESH_MS) refreshSnapshot();
    settleDue();
    if (pathname === '/sb-api/feed' && req.method === 'GET') {
      const now = Date.now();
      const events = liveFeed(now);
      const sports = SPORTS.map((s) => ({ id: s.id, slug: s.slug, name: s.name, icon: s.icon, count: events.filter((e) => e.sportId === s.id).length, live: events.filter((e) => e.sportId === s.id && e.status === 'live').length }));
      reply(res, { now, balance: getBal(), sports, events, snapshotAt: snapshot.fetchedAt });
      return true;
    }
    if (pathname === '/sb-api/sync' && req.method === 'POST') {
      const body = await ctx.parseBody(req);
      const known = new Set(bets.map((b) => b.id));
      const h = history();
      (Array.isArray(body && body.bets) ? body.bets.slice(0, 100) : []).forEach((b) => {
        if (!b || typeof b.id !== 'string' || known.has(b.id) || !Array.isArray(b.legs) || !b.legs.length || !(b.stake > 0)) return;
        if (!['open', 'won', 'lost', 'void'].includes(b.status)) return;
        bets.push(b);
        known.add(b.id);
        if (h && !h.find((x) => x.id === b.id)) {
          const settled = b.status !== 'open';
          h.push({ id: b.id, game: 'sportsbook', amount: b.stake, payout: settled ? b.payout || 0 : 0, multiplier: settled ? r2((b.payout || 0) / b.stake) : 0, currency: 'USD', time: b.placedAt, result: !settled ? 'pending' : b.status === 'won' ? 'win' : b.status === 'void' ? 'push' : 'loss' });
        }
      });
      bets.sort((a, b) => b.placedAt - a.placedAt);
      if (bets.length > 300) bets.length = 300;
      settleDue();
      saveBets();
      reply(res, { balance: getBal(), bets: bets.map(publicBet) });
      return true;
    }
    if (pathname === '/sb-api/bets' && req.method === 'GET') {
      reply(res, { balance: getBal(), bets: bets.map(publicBet) });
      return true;
    }
    if (pathname === '/sb-api/bet' && req.method === 'POST') {
      const body = await ctx.parseBody(req);
      reply(res, placeBet(body || {}));
      return true;
    }
    reply(res, { error: 'not_found' }, 404);
    return true;
  };
};
module.exports.refreshSnapshot = refreshSnapshot;

if (require.main === module) {
  refreshSnapshot().then(() => {
    console.log('snapshot events:', snapshot.events.length, 'bases:', bases().length);
    const by = {};
    bases().forEach((b) => { by[b.sport.name] = (by[b.sport.name] || 0) + 1; });
    console.log(by);
  });
}
