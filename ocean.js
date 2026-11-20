/* OCEAN LIFE – Lõi trò chơi: trạng thái, lưu/khôi phục, vòng đời, AI bơi lội, sinh sản/di truyền/đột biến, kinh tế, thời tiết, âm thanh, vẽ, điều khiển */
(() => {
'use strict';
const OD = window.OD, OA = window.OA, X = window.SPX || null, ECON = OD.ECON, TAU = Math.PI * 2;
const OC = window.OC = { fish: [], eggs: [], food: [], items: [], parts: [], mode: 'view', sel: null, cam: { z: 1, x: 0, y: 0 }, wx: { k: 'clear', left: 90 }, t: 0, ptr: { x: 0, y: 0, t: -99, down: false }, ui: {}, fpsAvg: 16, frame: 0 };
let WW = 1100, WH = 600; const KEY = 'spx_ocean_v1';
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.random() * a.length | 0];
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), now = () => Date.now(), wpick = list => { let r = Math.random() * list.reduce((s, x) => s + x[1], 0); for(const [k, w] of list){ if((r -= w) <= 0) return k; } return list[0][0]; };
let S = null, canvas, ctx, dpr = 1, vw = 300, vh = 300, running = false, raf = 0, lastTs = 0, grid = new Map(), acc1 = 0, acc2 = 0, acc5 = 0, saveT = 0, plankton = [], pendingPlace = null, dragItem = null;
OC.S = () => S; OC.WW = WW; OC.WH = WH;
const spec = id => OD.SP[id] || (S && S.hyb[id]) || OD.SPECIES[0]; OC.spec = spec;
const floorY = x => WH - 72 + 14 * Math.sin(x * .006) + 8 * Math.sin(x * .017 + 1); OC.floorY = floorY;
const stageOf = f => f.grow < 20 ? 0 : f.grow < 45 ? 1 : f.grow < 75 ? 2 : 3; OC.stageOf = stageOf;
const BOUNDS = [0, 20, 45, 75, 100];
const baseLen = f => { const d = f.d || spec(f.sp), s = stageOf(f), p = f.grow < 75 ? (f.grow - BOUNDS[s]) / (BOUNDS[s + 1] - BOUNDS[s]) : (f.grow - 75) / 25; return OA.lenOf(d, f.g, s) * (1 + (s < 3 ? .18 : .1) * p) * .66; };
OC.baseLen = baseLen;

/* ---------- trạng thái ---------- */
/* ---------- nhiều hồ: mỗi hồ có cá / trứng / trang trí riêng; OC.fish, OC.eggs, S.placed luôn trỏ tới hồ đang xem ---------- */
const TANK_DEF = [{ n: 'Hồ Đại Dương', th: 0, breed: true }, { n: 'Rạn San Hô', th: 1, breed: false, noBreed: true }, { n: 'Rừng Tảo Biển', th: 2, breed: false, noBreed: true }, { n: 'Vực Huỳnh Quang', th: 3, breed: false, noBreed: true }];
const TK = { fish: [[], [], [], []], eggs: [[], [], [], []], placed: [[], [], [], []] };
const TANK_SEED = [null, [['pl', 'p11', .18], ['pl', 'p10', .4], ['pl', 'p12', .66], ['pl', 'p13', .86], ['dc', 'd11', .3], ['dc', 'd14', .76]], [['pl', 'p01', .12], ['pl', 'p02', .34], ['pl', 'p08', .58], ['pl', 'p17', .82], ['dc', 'd19', .46], ['dc', 'd01', .7]], [['pl', 'p07', .2], ['pl', 'p14', .5], ['pl', 'p19', .8], ['dc', 'd36', .35], ['dc', 'd15', .62]]];
const canBreed = i => { const t = S && S.tanks && S.tanks[i]; return !!(t && t.breed && !t.noBreed); };
function allFish(){ return TK.fish[0].concat(TK.fish[1], TK.fish[2], TK.fish[3]); }
function bindActive(){ OC.fish = TK.fish[S.tk]; OC.eggs = TK.eggs[S.tk]; S.placed = TK.placed[S.tk]; }
function withTank(i, fn){ if(i === S.tk) return fn(); const k = S.tk; S.tk = i; bindActive(); OC.quiet = (OC.quiet | 0) + 1; try{ return fn(); } finally { OC.quiet--; S.tk = k; bindActive(); } }
function seedTanks(){ for(let i = 1; i < 4; i++) if(!TK.placed[i].length) withTank(i, () => { for(const [k, id, x] of TANK_SEED[i]) placeItem(k, id, x); }); }
function initTanks(placed0){ S.tanks = TANK_DEF.map(d => Object.assign({}, d)); S.tk = 0; TK.fish = [[], [], [], []]; TK.eggs = [[], [], [], []]; TK.placed = [placed0, [], [], []]; bindActive(); }
function newState(){
  const t = now(); S = { v: 1, created: t, t, coins: 300, xp: 0, lvl: 1, cap: ECON.capBase, uid: 1, fish: [], eggs: [], inv: { food: { basic: 30 }, potion: {} }, own: { pl: { p01: 1, p04: 1 }, dc: { d01: 1 } }, placed: [],
    col: {}, hyb: {}, phen: {}, q: { claimed: {}, day: '', cnt: {} }, ach: {}, st: {}, ledger: [], journal: [], set: { sfx: true, amb: true, mus: true, mvol: .5, trk: 0, vol: .6, q: 'auto', tm: ECON.timeMult, dn: 1, vib: true, parts: 1 }, time: .2, feedType: 'basic', seen: {} };
  initTanks(S.placed);
  autoFix();
  for(const [id, grow] of [['a_clown', 30], ['a_guppy', 25], ['a_gold', 50]]){ const f = mkFish(id, { grow }); OC.fish.push(f); S.col[id] = 2; }
  placeItem('pl', 'p01', .3); placeItem('dc', 'd01', .62); placeItem('pl', 'p04', .8); S.own.pl.p01 = 0; S.own.pl.p04 = 0; S.own.dc.d01 = 0; seedTanks();
  log('Chào mừng đến Ocean Life! Hồ cá của bạn đã sẵn sàng.');
}
const PERS_KEYS = Object.keys(OD.PERS);
function randPers(d){
  const w = [['shy', 2], ['playful', 3], ['friendly', 3], ['curious', 3], ['proud', 2], ['fierce', 1], ['cuddly', 2], ['loner', 1], ['explorer', 2], ['light', 2], ['foodie', 3], ['territorial', 1], ['social', 3]];
  if(d.school) w.push(['school', 8]); if(d.night || d.bottom) w.push(['dark', 4]); if(d.tier >= 3) w.push(['proud', 3]);
  const a = wpick(w); let b = Math.random() < .55 ? wpick(w) : null; return b && b !== a ? [a, b] : [a];
}
function randGenes(d){ const g = OA.G0(); g.hue = rnd(-12, 12); g.size = rnd(.94, 1.08); g.fin = rnd(.95, 1.1); g.tail = rnd(.95, 1.1); g.sat = rnd(.94, 1.06); return g; }
function mkFish(spId, o = {}){
  const d = spec(spId), t = now(); const g = Object.assign(OA.G0(), o.g || randGenes(d));
  const f = { id: S.uid++, sp: spId, name: o.name || '', born: t, grow: o.grow == null ? 0 : o.grow, hun: 80, joy: 70, hp: 100, g, pers: o.pers || randPers(d), fr: 40, lock: false, fav: false, inc: { n: t + incMs(d, 1), acc: 0 }, cd: 0, anc: o.anc || null, gen: o.gen || 0, mut: o.mut || [], boost: {}, wasAdult: false };
  rt(f, o.x, o.y); return f;
}
function rt(f, x, y){
  f.d = spec(f.sp); f.g = Object.assign(OA.G0(), f.g); f.stg = stageOf(f); f.z = Math.random(); f.x = x == null ? (f.x || rnd(80, WW - 80)) : x; f.y = y == null ? (f.y || rnd(110, floorY(f.x) - 90)) : y;
  f.vx = rnd(-20, 20); f.vy = 0; f.face = f.tf = Math.random() < .5 ? 1 : -1; f.ph = rnd(0, 6); f.spd = .3; f.bl = 1; f.blT = rnd(1, 5); f.gill = 0; f.mouth = 0; f.al = 1; f.mood = 'ok'; f.lx = f.ly = 0; f.st = 'wander'; f.bt = rnd(.5, 3); f.tx = f.x; f.ty = f.y; f.pitch = 0; f.len = baseLen(f); f.wasAdult = f.wasAdult || f.stg === 3; f.fT = rnd(0, .4);
}
function log(txt){ S.journal.unshift({ t: now(), txt }); if(S.journal.length > 150) S.journal.length = 150; }
OC.log = log;
/* ---------- tính toán giá trị ---------- */
const CROWN_F = [1, 1.15, 1.3, 1.6, 2.2, 3, 4, 5.5, 8];
function valueMul(f){ const g = f.g; return Math.min(ECON.sellCap, Math.pow(cl(g.size, .8, 1.5), 1.5) * (1 + .25 * g.rare.length) * (1 + .15 * f.mut.length) * CROWN_F[g.crown || 0] * (1 + .1 * (g.glow > .3)) * (g.foil ? 1.15 : 1) * (1 + .02 * Math.min(10, f.gen)) * (f.colT > now() ? 1.08 : 1)); }
function sellPrice(f){ const d = f.d, s = stageOf(f), sf = s === 3 ? ECON.sellBaseMul : ECON.sellStage[s]; return Math.max(1, Math.round(d.val * sf * valueMul(f))); }
function fishLevel(f){ return 1 + Math.floor(f.grow / 25) + (f.g.crown ? 1 : 0) + Math.min(5, Math.floor(f.fr / 25)); }
function incMs(d, lvl){ return OD.TIERS[d.tier].every * 60000 / S.set.tm / Math.min(1.6, 1 + .03 * (lvl - 1)); }
function incAmount(f){ const T = OD.TIERS[f.d.tier], q = cl(.25 + (f.g.size - .9) * .6 + .08 * f.mut.length + (f.g.crown || 0) * .06, 0, 1), care = .5 + .5 * (f.hp + f.joy) / 200; return Math.max(1, Math.round((T.inc[0] + (T.inc[1] - T.inc[0]) * (q * .6 + Math.random() * .4)) * care)); }
OC.sellPrice = sellPrice; OC.fishLevel = fishLevel; OC.incAmount = incAmount; OC.valueMul = valueMul;
/* ---------- kinh tế ---------- */
function earn(n, src){ n = Math.round(n); if(n <= 0) return; S.coins += n; S.st.earned = (S.st.earned || 0) + n; S.st['e_' + src] = (S.st['e_' + src] || 0) + n; OC.sessionEarn = (OC.sessionEarn || 0) + n; ledger(n, src); }
function spend(n, cat, what){ n = Math.round(n); if(n > S.coins){ OC.toast('Không đủ Đồng Xu Đại Dương', 'err'); sfx('err'); return false; } S.coins -= n; S.st['s_' + cat] = (S.st['s_' + cat] || 0) + n; ledger(-n, what || cat); return true; }
function ledger(d, src){ S.ledger.unshift({ t: now(), d, src, bal: S.coins }); if(S.ledger.length > 150) S.ledger.length = 150; queueSave(); OC.ui.refresh && OC.ui.refresh('coin'); }
OC.earn = earn; OC.spend = spend;
function addXp(n){ S.xp += n; let up = false; while(S.xp >= OD.LEVEL_XP(S.lvl)){ S.xp -= OD.LEVEL_XP(S.lvl); S.lvl++; up = true; earn(50 * S.lvl, 'level'); log('Lên cấp ' + S.lvl + '!'); OC.toast('Lên cấp ' + S.lvl + '! +' + 50 * S.lvl + ' xu', 'ok'); sfx('evolve'); } if(up) OC.ui.refresh && OC.ui.refresh('lv'); OC.ui.refresh && OC.ui.refresh('xp'); }
OC.addXp = addXp;
function capOk(n = 1){ return OC.fish.length + OC.eggs.length + n <= S.cap; }
OC.capOk = capOk;
/* ---------- thống kê / nhiệm vụ ---------- */
const today = () => new Date().toDateString();
function rollDay(){ if(S.q.day === today()) return; S.q.day = today(); S.q.cnt = {}; for(const q of OD.QUESTS) if(q.t === 'd'){ delete S.q.claimed[q.id]; if(S.q.ready) delete S.q.ready[q.id]; } }
function ev(k, n = 1){ S.st[k] = (S.st[k] || 0) + n; rollDay(); S.q.cnt[k] = (S.q.cnt[k] || 0) + n; OC.checkQuests(); }
function derived(){ const own = Object.entries(S.col).filter(([, v]) => v === 2); return { owned: own.length, owned80: OD.SPECIES.filter(s => S.col[s.id] === 2).length, legend: allFish().filter(f => f.d.tier === 4).length, crowns: allFish().filter(f => f.g.crown).length, rare3: allFish().some(f => f.g.rare.length >= 3) ? 1 : 0, bigfish: allFish().some(f => f.g.size >= 1.25 && stageOf(f) === 3) ? 1 : 0, placed: TK.placed.reduce((a, p) => a + p.length, 0), placedFish: allFish().length, dragons: allFish().filter(f => /garowana|parowana|skyd|longg/.test(f.sp)).length, groupDone: 'ABCDE'.split('').some(g => OD.SPECIES.filter(s => s.g === g).every(s => S.col[s.id] === 2)) ? 1 : 0, earned: S.st.earned || 0 }; }
function progOf(q){ const dv = derived(); if(q.t === 'd') return S.q.cnt[q.k] || 0; if(q.abs || dv[q.k] !== undefined) return dv[q.k] !== undefined ? dv[q.k] : (S.st[q.k] || 0); return S.st[q.k] || 0; }
OC.progOf = progOf; OC.derived = derived;
OC.checkQuests = function(){
  let changed = false;
  for(const q of OD.QUESTS){ if(S.q.claimed[q.id] || (S.q.ready && S.q.ready[q.id])) continue; if(progOf(q) >= q.v){ (S.q.ready = S.q.ready || {})[q.id] = 1; OC.toast('Hoàn thành nhiệm vụ: ' + q.n, 'ok'); sfx('coin'); changed = true; } }
  for(const a of OD.ACH){ if(S.ach[a.id]) continue; const dv = derived(); const v = dv[a.k] !== undefined ? dv[a.k] : (S.st[a.k] || 0); if(v >= a.v){ S.ach[a.id] = 1; earn(a.r, 'ach'); log('Thành tựu: ' + a.n); OC.toast(a.i + ' Thành tựu: ' + a.n + ' +' + a.r + ' xu', 'ok'); sfx('evolve'); changed = true; } }
  if(changed) OC.ui.refresh && OC.ui.refresh('quest');
};
OC.claimQuest = id => { const q = OD.QUESTS.find(x => x.id === id); if(!q || S.q.claimed[id] || !(S.q.ready && S.q.ready[id])) return; S.q.claimed[id] = 1; earn(q.r, 'quest'); addXp(Math.round(q.r / 8)); log('Nhận thưởng nhiệm vụ: ' + q.n); sfx('coin'); queueSave(); };
/* ---------- bộ sưu tập ---------- */
function markOwned(spId){
  const d = spec(spId), first = S.col[spId] !== 2; S.col[spId] = 2; if(first){ ev('discovered'); if(!OC.booting){ earn(20 + d.tier * 30, 'discover'); log('Khám phá loài mới: ' + d.n); OC.toast('Khám phá: ' + d.n + ' (+' + (20 + d.tier * 30) + ' xu)', 'ok'); sfx('evolve'); } }
  return first;
}
function colStatus(id){ if(S.col[id] === 2) return 2; const d = OD.SP[id]; if(d && d.buy && d.lvl <= S.lvl) return 1; return S.col[id] || 0; }
OC.colStatus = colStatus;
/* ---------- đặt vật phẩm ---------- */
function placeItem(k, id, x){ const o = { uid: S.uid++, k, id, x: x == null ? rnd(.08, .92) : x, s: k === 'dc' ? rnd(.85, 1.1) : 1, lay: k === 'pl' ? (Math.random() < .5 ? 0 : 2) : (Math.random() < .5 ? 1 : 2) }; S.placed.push(o); return o; }
OC.placeItem = placeItem;
/* ---------- di truyền / lai tạo ---------- */
function compat(a, b, boost){ const sa = a.d, sb = b.d; if(sa.id === sb.id) return !sa.asex || a === b; if(sa.asex || sb.asex) return false; if(sa.arch !== 'fish' || sb.arch !== 'fish') return false; return Math.abs(sa.tier - sb.tier) <= 2 || !!boost; }
OC.compat = compat;
function hybridOf(a, b){
  const key = 'h_' + [a, b].sort().join('+'); if(S.hyb[key]) return key; const da = spec(a), db = spec(b), hi = da.tier >= db.tier ? da : db;
  S.hyb[key] = { id: key, n: 'Lai ' + da.n + ' × ' + db.n, g: 'H', tier: Math.min(5, hi.tier), arch: 'fish', L: (da.L + db.L) / 2, H: (da.H + db.H) / 2, tail: db.tail, c: [OA.mix(da.c[0], db.c[0], .5), OA.mix(da.c[1], db.c[1], .5), db.c[2]], pat: db.pat, patC: da.patC, fl: [...new Set((da.fl + db.fl).split(''))].join(''), val: Math.round((da.val + db.val) / 2 * 1.3), price: 0, buy: false, lvl: 99, growMin: hi.growMin, breedMin: hi.breedMin, eggs: hi.eggs, life: da.life, env: da.env, school: da.school && db.school, bottom: false, night: false, asex: false, idx: 900, hybrid: true, parents: [a, b] };
  return key;
}
const PAT = ['bands', 'stripe', 'spots', 'scales', 'galaxy', 'rainbow'], VIV = ['#ff5a8a', '#ffd34d', '#4dffd0', '#4dc8ff', '#b84dff', '#ffffff', '#ff9a3c'];
const CROWN_W = [[1, 40], [2, 28], [3, 16], [4, 8], [5, 4], [6, 2.5], [7, 1], [8, .5]];
function applyMut(g, type){
  switch(type){
    case 'color': g.hue += (Math.random() < .5 ? -1 : 1) * rnd(60, 150); g.sat = cl(g.sat * rnd(1, 1.2), .6, 1.5); break;
    case 'pattern': g.pat = pick(PAT); g.patC = pick(VIV); break;
    case 'morph': { const opts = ['horn', 'wings', 'spikes', 'heads', 'tails', 'layers'].filter(k => k === 'heads' ? g.heads < 2 : k === 'tails' ? g.tails < 3 : k === 'layers' ? g.layers < 3 : !g[k]); const k = pick(opts.length ? opts : ['layers']); if(k === 'heads') g.heads = 2; else if(k === 'tails') g.tails = 3; else if(k === 'layers') g.layers = 3; else g[k] = 1; return k; }
    case 'glow': g.glow = Math.min(1, g.glow + .5); break;
    case 'fin': g.fin = cl(g.fin * rnd(1.15, 1.4), .8, 1.9); break;
    case 'rare': { const left = OD.RARE_TRAITS.filter(x => !g.rare.includes(x)); if(left.length){ g.rare.push(pick(left)); g.foil = 1; } break; }
    case 'crown': { const t = wpick(CROWN_W); if(t > (g.crown || 0)) g.crown = t; break; }
  }
}
const ancOf = (f, dep = 0) => ({ sp: f.sp, n: f.name, gen: f.gen, anc: dep < 2 && f.anc ? { a: f.anc.a, b: f.anc.b } : null });
function inherit(a, b, extra = {}){
  const sa = a.d, sb = b.d; let sp = sa.id; if(sa.id !== sb.id){ const r = Math.random(); sp = r < .45 ? sa.id : r < .9 ? sb.id : hybridOf(sa.id, sb.id); }
  const g = OA.G0(), ga = a.g, gb = b.g, rare = extra.rare || 0, res = { mut: [] };
  for(const k of ['hue', 'sat', 'bri', 'fin', 'tail', 'glow', 'size']){ const m = (ga[k] + gb[k]) / 2, v = Math.random() < .35 ? (Math.random() < .5 ? ga[k] : gb[k]) : m; g[k] = v + (k === 'hue' ? rnd(-14, 14) : k === 'size' ? rnd(-.05, .06) : rnd(-.04, .05)); }
  g.size = cl(g.size, .85, 1.35); if(sa.id !== sb.id) g.hue += rnd(-20, 20);
  for(const k of ['horn', 'wings', 'spikes', 'crystal', 'foil']){ const has = ga[k] || gb[k]; g[k] = has && Math.random() < .55 + rare ? 1 : 0; }
  g.heads = (ga.heads === 2 || gb.heads === 2) && Math.random() < .5 + rare ? 2 : 1; g.tails = (ga.tails === 3 || gb.tails === 3) && Math.random() < .5 + rare ? 3 : 1; g.layers = Math.max(ga.layers, gb.layers) > 1 && Math.random() < .55 + rare ? Math.max(ga.layers, gb.layers) : 1;
  g.pat = Math.random() < .5 ? ga.pat : gb.pat; g.patC = Math.random() < .5 ? ga.patC : gb.patC; g.crown = Math.max(ga.crown || 0, gb.crown || 0) > 0 && Math.random() < .12 + rare * .3 ? Math.max(ga.crown, gb.crown) : 0;
  const traits = [...new Set([...ga.rare, ...gb.rare])]; g.rare = traits.filter(() => Math.random() < .4 + rare); if(g.rare.length) g.foil = 1;
  let chance = .04 + (extra.mut || 0); const both = a.d.tier >= 2 && b.d.tier >= 2;
  if(Math.random() < chance){ const t = wpick([['color', 45], ['pattern', 20], ['morph', 15], ['glow', 8], ['fin', 7], ['rare', 4], ['crown', 1]]); const r = applyMut(g, t); res.mut.push(t + (r ? ':' + r : '')); }
  if(both && Math.random() < .015 + (extra.mut || 0) * .25){ const D = OD.SPECIES.filter(s => s.g === 'D'); sp = pick(D).id; res.mut.push('legend'); }
  else if(sa.arch === 'fish' && sb.arch === 'fish' && res.mut.some(m => m.startsWith('morph')) && Math.random() < .1){ sp = pick(OD.SPECIES.filter(s => s.g === 'E')).id; res.mut.push('mutant'); }
  const P = [...new Set([...a.pers.filter(() => Math.random() < .6), ...b.pers.filter(() => Math.random() < .6)])].slice(0, 2); res.pers = P.length ? P : randPers(spec(sp));
  Object.assign(res, { sp, g, anc: { a: ancOf(a), b: ancOf(b) }, gen: Math.max(a.gen, b.gen) + 1 }); return res;
}
OC.inherit = inherit;
function phenoSig(f){ const g = f.g; return [f.sp, Math.round(g.hue / 45), g.pat || '', g.horn, g.wings, g.spikes, g.heads, g.tails, g.layers, g.glow > .4 ? 1 : 0, g.crown || 0, g.rare.length ? 1 : 0].join(','); }
function discoverPheno(f){ const s = phenoSig(f); if(S.phen[s]) return; S.phen[s] = 1; if(Object.keys(S.phen).length > 4){ ev('discoveredPh'); const r = 25 + f.d.tier * 20; earn(r, 'discover'); log('Khám phá biến thể mới: ' + f.d.n); OC.toast('Biến thể mới! +' + r + ' xu', 'ok'); } }
function eggOf(c, x, y){ const d = spec(c.sp), t = now(), dur = Math.max(40, d.growMin * .15 * 60) * 1000 / S.set.tm; return { id: S.uid++, sp: c.sp, g: c.g, pers: c.pers, anc: c.anc, gen: c.gen, mut: c.mut || [], x, y: y || floorY(x) - 10, born: t, hatch: t + dur, rare: d.tier >= 3 || c.g.crown > 0 || c.g.rare.length > 0, r: 8 + d.tier * 1.5, col: d.c[1], col2: d.c[2] }; }
function layEggs(a, b){
  const d = a.d, extra = { rare: (a.boost.rare || 0) + (b.boost.rare || 0), mut: 0 }; const cnt = ri(d.eggs[0], d.eggs[1]) + (a.boost.eggs || 0) + (b.boost.eggs || 0); let n = 0;
  for(let i = 0; i < Math.min(6, cnt); i++){ if(!capOk()) { OC.toast('Hồ gần đầy, không đủ chỗ cho trứng', 'warn'); break; } const c = inherit(a, b, extra), x = cl((a.x + b.x) / 2 + rnd(-50, 50), 40, WW - 40); const e = eggOf(c, x); OC.eggs.push(e); n++; }
  const t = now(); for(const f of [a, b]){ f.cd = t + f.d.breedMin * 60000 / S.set.tm; f.boost = {}; f.pair = null; f.fr = Math.min(100, f.fr + 3); }
  if(n){ ev('bred'); addXp(8); log(`${a.name || a.d.n} và ${b === a ? 'chính nó' : b.name || b.d.n} đã đẻ ${n} trứng`); sfx('hatch'); for(let i = 0; i < 8; i++) part('heart', (a.x + b.x) / 2 + rnd(-20, 20), (a.y + b.y) / 2); OC.toast(`Sinh sản thành công: ${n} trứng!`, 'ok'); }
  queueSave(); return n;
}
OC.manualBreed = function(a, b){
  if(a === b || a.lock && false) return OC.toast('Chọn hai cá thể khác nhau', 'err');
  const ok = (x) => stageOf(x) === 3 && now() >= x.cd && x.hp > 40; if(!ok(a) || !ok(b)) return OC.toast('Cần hai cá trưởng thành, đủ sức khỏe và hết thời gian hồi phục', 'err');
  if(!compat(a, b, a.boost.compat || b.boost.compat)) return OC.toast('Hai loài này không tương thích', 'err');
  if(!capOk(1)) return OC.toast('Hồ đã đầy', 'err');
  const cost = 50 + Math.round((a.d.val + b.d.val) * .04); if(OC.busy) return; OC.busy = true; setTimeout(() => OC.busy = false, 400);
  if(!spend(cost, 'breed', 'Lai tạo')) return; a.boost.compat = b.boost.compat = 0; const n = layEggs(a, b); if(n) ev('manualBreed'); return n;
};
function hatchEgg(e){
  OC.eggs.splice(OC.eggs.indexOf(e), 1); const f = mkFish(e.sp, { g: e.g, pers: e.pers, anc: e.anc, gen: e.gen, mut: e.mut, x: e.x, y: e.y - 10, grow: 0 }); OC.fish.push(f); ev('hatched'); addXp(5);
  const first = markOwned(f.sp); discoverPheno(f); if(f.g.crown) ev('crowns', 0); log('Trứng nở: ' + f.d.n + (f.mut.length ? ' (đột biến!)' : '')); sfx('hatch'); for(let i = 0; i < 10; i++) part('spark', f.x + rnd(-14, 14), f.y + rnd(-14, 14)); OC.toast('Trứng đã nở: ' + f.d.n, 'ok');
  if(f.g.crown){ OC.toast('Cá đột biến vương miện!', 'ok'); log('Cá đột biến vương miện: ' + f.d.n); } queueSave();
}
/* ---------- thuốc ---------- */
OC.usePotion = function(pid, f){
  const P = OD.PT[pid]; if(!P || !f) return null; if(OC.busy) return null; OC.busy = true; setTimeout(() => OC.busy = false, 500);
  const have = (S.inv.potion[pid] || 0) > 0; if(have) S.inv.potion[pid]--; else if(!spend(P.price, 'potion', P.n)){ return null; }
  const fx = P.fx || {}, g = f.g; let res = '';
  if(fx.grow){ f.grow = Math.min(100, f.grow + fx.grow); res = `+${fx.grow}% tăng trưởng`; }
  if(fx.stageUp){ const s = stageOf(f); if(s >= 3){ f.grow = Math.min(100, f.grow + 10); res = 'Đã trưởng thành: +10% kích thước'; } else { f.grow = BOUNDS[s + 1]; res = 'Lên giai đoạn: ' + OD.STAGES[s + 2]; } }
  if(fx.toAdult){ f.grow = Math.max(f.grow, 75); g.size = cl(g.size * (1 + (fx.size || 0)), .8, 1.5); res = 'Trưởng thành ngay' + (fx.size ? `, +${Math.round(fx.size * 100)}% kích thước` : ''); if(fx.variant && Math.random() < fx.variant){ applyMut(g, 'color'); f.mut.push('color'); res += ' · biến thể màu'; } }
  if(fx.eggs){ f.boost.eggs = (f.boost.eggs || 0) + fx.eggs; res = `Lần sinh sản tới +${fx.eggs} trứng`; } if(fx.clearCd){ f.cd = 0; res = 'Đã xóa thời gian hồi phục'; } if(fx.compat){ f.boost.compat = 1; res = 'Cho phép lai khác nhóm một lần'; } if(fx.rare){ f.boost.rare = (f.boost.rare || 0) + fx.rare; res = 'Tăng thừa hưởng đặc tính hiếm'; }
  if(fx.hue){ g.hue += rnd(40, 200); res = 'Đã đổi màu'; } if(fx.pat){ g.pat = pick(PAT); g.patC = pick(VIV); res = 'Đã đổi hoa văn'; } if(fx.glow){ g.glow = Math.min(1, g.glow + fx.glow); res = 'Tăng độ sáng'; } if(fx.foil){ g.foil = 1; res = 'Vảy ánh kim'; }
  if(fx.fin){ g.fin = cl(g.fin * 1.25, .8, 1.9); res = 'Vây lớn hơn'; } if(fx.tail){ g.tail = cl(g.tail * 1.25, .8, 1.9); g.layers = Math.min(3, g.layers + 1); res = 'Đuôi dài và thêm tầng'; }
  if(fx.hidden){ const t = pick(['glow', 'fin', 'pattern', 'rare']); applyMut(g, t); f.mut.push(t); res = 'Kích hoạt tiềm ẩn: ' + OD.MUT_LABEL[t]; }
  if(P.tbl){ let r = Math.random() * P.tbl.reduce((s, x) => s + x[1], 0), t = P.tbl[0][0]; for(const [k, w] of P.tbl){ if((r -= w) <= 0){ t = k; break; } }
    if(t === 'none') res = 'Không có kết quả (thuốc đã dùng)';
    else if(t === 'species'){ if(f.d.arch === 'fish' && Math.random() < 1){ const E = pick(OD.SPECIES.filter(s => s.g === 'E')); f.sp = E.id; f.d = E; markOwned(E.id); f.mut.push('species'); res = 'Biến thành ' + E.n + '!'; } else res = 'Không đủ điều kiện biến đổi loài'; }
    else { const r2 = applyMut(g, t); f.mut.push(t); res = OD.MUT_LABEL[t] + (r2 ? ' (' + r2 + ')' : '') + (t === 'crown' ? ': ' + OD.CROWNS[g.crown] : ''); if(t === 'crown' && g.crown) ev('crowns', 0); } }
  f._pk = null; f.len = baseLen(f); ev('potions'); addXp(4); discoverPheno(f); log(`Dùng ${P.n} cho ${f.name || f.d.n}: ${res}`); sfx('evolve'); for(let i = 0; i < 14; i++) part('spark', f.x + rnd(-24, 24), f.y + rnd(-24, 24)); OC.checkQuests(); queueSave(); return res;
};
/* ---------- mua / bán ---------- */
function guard(){ if(OC.busy) return false; OC.busy = true; setTimeout(() => OC.busy = false, 350); return true; }
OC.buyFish = function(id){ const d = OD.SP[id]; if(!d || !d.buy) return OC.toast('Loài này không bán trực tiếp', 'err'); if(S.lvl < d.lvl) return OC.toast('Cần đạt cấp ' + d.lvl, 'err'); if(!capOk()) return OC.toast('Hồ đã đầy', 'err'); if(!guard()) return;
  if(!spend(d.price, 'fish', 'Mua ' + d.n)) return; const first = S.col[id] !== 2; const f = mkFish(id, { grow: 0, x: rnd(100, WW - 100) }); f.y = rnd(100, 300); OC.fish.push(f); if(first) ev('speciesBought'); markOwned(id); ev('buys'); addXp(4); log('Mua cá: ' + d.n); sfx('buy'); for(let i = 0; i < 8; i++) part('spark', f.x, f.y); queueSave(); return f; };
OC.buyEgg = function(id){ const d = OD.SP[id]; if(!d || !d.buy) return OC.toast('Loài này không bán trứng', 'err'); if(S.lvl < d.lvl) return OC.toast('Cần đạt cấp ' + d.lvl, 'err'); if(!capOk()) return OC.toast('Hồ đã đầy', 'err'); if(!guard()) return; const pr = Math.round(d.val * ECON.eggMul); if(!spend(pr, 'egg', 'Mua trứng ' + d.n)) return;
  const e = eggOf({ sp: id, g: randGenes(d), pers: randPers(d), anc: null, gen: 0, mut: [] }, rnd(80, WW - 80)); OC.eggs.push(e); ev('buys'); log('Mua trứng: ' + d.n); sfx('buy'); queueSave(); return e; };
OC.buyFood = function(id, q){ const f = OD.FD[id]; q = Math.max(1, Math.min(50, q | 0 || 1)); if(!guard()) return; if(!spend(f.price * q, 'food', 'Mua ' + f.n + (q > 1 ? ' ×' + q : ''))) return; S.inv.food[id] = (S.inv.food[id] || 0) + f.pack * q; ev('buys'); sfx('buy'); queueSave(); };
OC.buyPotion = function(id, q){ const p = OD.PT[id]; q = Math.max(1, Math.min(50, q | 0 || 1)); if(!guard()) return; if(!spend(p.price * q, 'potion', 'Mua ' + p.n + (q > 1 ? ' ×' + q : ''))) return; S.inv.potion[id] = (S.inv.potion[id] || 0) + q; ev('buys'); sfx('buy'); queueSave(); };
OC.buyDeco = function(k, id){ const d = (k === 'pl' ? OD.PL : OD.DC)[id]; if(!guard()) return; if(!spend(d.price, 'decor', 'Mua ' + d.n)) return; S.own[k][id] = (S.own[k][id] || 0) + 1; ev('decorBought'); ev('buys'); log('Mua: ' + d.n); sfx('buy'); queueSave(); };
OC.buyCap = function(){ const up = ECON.capUpgrades.find(u => u[0] > S.cap); if(!up) return OC.toast('Đã mở rộng tối đa', 'info'); if(!guard()) return; if(!spend(up[1], 'cap', 'Mở rộng hồ')) return; S.cap = up[0]; log('Mở rộng hồ: ' + up[0] + ' sinh vật'); sfx('evolve'); queueSave(); };
OC.putDeco = function(k, id){ if(!(S.own[k][id] > 0)) return; S.own[k][id]--; const o = placeItem(k, id, rnd(.08, .92)); sfx('plop'); queueSave(); return o; };
OC.takeDeco = function(uid){ const i = S.placed.findIndex(p => p.uid === uid); if(i < 0) return; const p = S.placed.splice(i, 1)[0]; S.own[p.k][p.id] = (S.own[p.k][p.id] || 0) + 1; queueSave(); };
OC.sell = function(f){ if(f.lock) return OC.toast('Cá đang được khóa bảo vệ', 'err'); if(!guard()) return; const pr = sellPrice(f); const i = OC.fish.indexOf(f); if(i < 0) return; OC.fish.splice(i, 1); earn(pr, 'sale'); ev('sold'); log(`Bán ${f.name || f.d.n}: +${pr} xu`); if(OC.sel === f) OC.sel = null; sfx('coin'); part('text', f.x, f.y, '+' + pr); queueSave(); return pr; };
function harvest(f, silent){ if(!f.inc.acc) return 0; const a = f.inc.acc; f.inc.acc = 0; earn(a, 'fish'); ev('harvests'); if(!silent){ part('text', f.x, f.y - 20, '+' + a); sfx('coin'); } return a; }
OC.harvest = harvest;
OC.harvestAll = function(){ let n = 0, t = 0; for(const f of OC.fish){ const a = harvest(f, true); if(a){ n++; t += a; part('text', f.x, f.y - 20, '+' + a); } } if(n){ sfx('coin'); OC.toast(`Thu ${t} xu từ ${n} cá`, 'ok'); queueSave(); } else OC.toast('Chưa có xu để thu', 'info'); return t; };
/* ---------- thức ăn ---------- */
OC.dropFood = function(x, y){
  const id = S.feedType, f = OD.FD[id]; if(!(S.inv.food[id] > 0)){ OC.toast('Hết ' + f.n + ' — mua thêm trong Cửa hàng', 'warn'); return false; }
  S.inv.food[id]--; OC.food.push({ id: S.uid++, x: cl(x, 20, WW - 20), y: Math.max(24, y), vy: 24, type: id, life: 35 }); sfx('plop'); part('ring', x, Math.max(20, y)); OC.ui.refresh && OC.ui.refresh('food'); return true;
};
function eatFood(f, fd){
  const F = OD.FD[fd.type], mulFry = F.fry && stageOf(f) < 2 ? 2 : 1, mulRare = F.rare && f.d.tier >= 2 ? 1.6 : 1; { const fi = OC.food.indexOf(fd); if(fi >= 0) OC.food.splice(fi, 1); }
  f.hun = Math.min(100, f.hun + F.hun * mulRare); f.joy = Math.min(100, f.joy + F.joy); if(F.grow) f.grow = Math.min(100, f.grow + F.grow * mulFry * mulRare * .3); if(F.breed) f.cd = Math.max(0, f.cd - 90000); if(F.color) f.colT = now() + 600000; if(F.glow) f.pulse = 4; if(F.inc) f.incBoost = now() + 300000;
  f.mouth = 1; f.fr = Math.min(100, f.fr + .6); ev('fed'); S.st.fedTotal = (S.st.fedTotal || 0) + 1; part('bubble', fd.x, fd.y); part('bubble', fd.x, fd.y); sfx('bubble'); if(Math.random() < .3) addXp(1); f.st = 'wander'; f.bt = rnd(1, 3);
}
/* ---------- tương tác chạm ---------- */
function react(f, kind){
  const P = f.pers, pool = []; const add = (r, w) => { for(let i = 0; i < w; i++) pool.push(r); };
  if(kind === 'spam'){ add('angry', 3); add('flee', 3); f.fr = Math.max(0, f.fr - 6); }
  else if(kind === 'hold'){ add('follow', 4); add('circle', 3); add('cuddle', 2); if(P.includes('shy')) add('flee', 3); if(P.includes('fierce')) add('angry', 2); }
  else { if(P.includes('shy')){ add('flee', 5); add('hide', 3); } if(P.includes('friendly') || P.includes('social')){ add('approach', 4); add('hearts', 3); add('wag', 2); } if(P.includes('curious')){ add('look', 3); add('approach', 3); } if(P.includes('proud')){ add('flare', 3); add('spin', 2); add('look', 2); } if(P.includes('fierce')){ add('angry', 4); add('flare', 3); } if(P.includes('cuddly')){ add('cuddle', 5); add('hearts', 3); add('circle', 2); } if(P.includes('playful')){ add('joy', 3); add('spin', 3); add('bubbles', 3); } if(P.includes('loner')) add('flee', 2); if(!pool.length){ add('look', 3); add('bubbles', 2); add('wag', 2); } if(f.fr >= 80){ add('glow', 3); add('joy', 3); } }
  const r = pick(pool), p = OC.ptr; f.react = r;
  switch(r){
    case 'flee': f.fleeT = 1.6; f.fr = Math.max(0, f.fr - 2); break;
    case 'look': f.lookT = 2; break; case 'approach': f.curT = 3; f.fr = Math.min(100, f.fr + 1); break;
    case 'hearts': for(let i = 0; i < 4; i++) part('heart', f.x + rnd(-10, 10), f.y - 8); f.fr = Math.min(100, f.fr + 3); f.joy = Math.min(100, f.joy + 5); break;
    case 'bubbles': for(let i = 0; i < 6; i++) part('bubble', f.x + rnd(-10, 10), f.y); break; case 'wag': f.wag = 1.2; break; case 'flare': f.flare = 1.4; break;
    case 'angry': f.angT = 2; f.fr = Math.max(0, f.fr - 2); break;
    case 'cuddle': f.curT = 3.5; for(let i = 0; i < 3; i++) part('heart', f.x, f.y - 8); f.fr = Math.min(100, f.fr + 4); break;
    case 'circle': f.cirT = 3.5; f.orb = rnd(0, 6); break; case 'hide': f.hideT = 4; break; case 'follow': f.folT = 4; break;
    case 'glow': f.pulse = 1.5; for(let i = 0; i < 6; i++) part('spark', f.x + rnd(-14, 14), f.y + rnd(-10, 10)); break;
    case 'joy': f.spin = .9; for(let i = 0; i < 3; i++) part('heart', f.x, f.y - 8); f.joy = Math.min(100, f.joy + 4); break; case 'spin': f.spin = .9; break;
  }
  ev('touch'); if(Math.random() < .35) addXp(1);
}
OC.react = react;
/* ---------- hạt hiệu ứng ---------- */
function part(type, x, y, txt){ if(OC.quiet) return; if(OC.parts.length > 240 * (S.set.parts || 1)) return; const p = { type, x, y, vx: rnd(-14, 14), vy: -rnd(18, 44), life: 0, max: type === 'text' ? 1.5 : type === 'ring' ? .8 : rnd(1.2, 2.4), s: rnd(3, 7), txt }; if(type === 'spark'){ p.vx = rnd(-40, 40); p.vy = rnd(-40, 20); p.max = rnd(.5, 1); } if(type === 'rain'){ p.max = .5; } OC.parts.push(p); }
OC.part = part;
/* ---------- âm thanh tổng hợp ---------- */
let AC = null, master, ambG, rainG, noiseBuf, audioHeld = false;
function audio(){ if(AC) return AC; try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const mk = (fq, type, q) => { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = fq; f.Q.value = q || .7; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); return g; };
    ambG = mk(420, 'lowpass'); rainG = mk(2400, 'bandpass', .5); }catch(e){ AC = null; } return AC; }
OC.audioUnlock = () => { if(audioHeld || document.hidden) return; const a = audio(); if(a && a.state === 'suspended') a.resume(); audioApply(); };
function audioApply(){ if(!AC) return; if(audioHeld){ ambG.gain.value = 0; rainG.gain.value = 0; musicApply(); return; } musicApply(); const v = S.set.vol; master.gain.value = v; const rain = ['rain', 'heavy', 'storm'].includes(OC.wx.k) ? (OC.wx.k === 'rain' ? .05 : .1) : 0; ambG.gain.value = S.set.amb && OC.running ? .05 + .02 * Math.sin(OC.t * .3) : 0; rainG.gain.value = S.set.amb && OC.running ? rain : 0; }

/* ---------- NHẠC NỀN: 4 bản nhạc thư giãn, tạo bằng Web Audio (không cần file âm thanh) ---------- */
const TRACKS = [
  { n: 'Sóng Êm', d: 'Piano mềm · pad ấm áp', bpm: 56, cb: 1, tm: 'piano', sc: [0, 2, 4, 7, 9], mr: 72, ch: [{ r: 48, t: [0, 4, 7, 11] }, { r: 45, t: [0, 3, 7, 10] }, { r: 41, t: [0, 4, 7, 11] }, { r: 43, t: [0, 4, 7, 9] }], pat: [[0, 1, 2, 3, 2, 1, 2, 3], [0, 2, 1, 2, 3, 2, 1, 0], [0, -1, 2, -1, 3, -1, 2, 1], [0, 1, 2, 4, 3, 2, 1, -1]], pad: .5, bass: .5, dens: .8 },
  { n: 'San Hô Lấp Lánh', d: 'Chuông thủy tinh · nhẹ nhàng', bpm: 68, cb: 1, tm: 'bell', sc: [0, 2, 4, 7, 9], mr: 74, ch: [{ r: 50, t: [0, 4, 7, 14] }, { r: 47, t: [0, 3, 7, 10] }, { r: 43, t: [0, 4, 7, 11] }, { r: 45, t: [0, 4, 7, 14] }], pat: [[0, -1, 2, -1, 3, -1, 4, 2], [0, 2, 4, 2, 3, 1, 2, -1], [-1, 1, -1, 3, -1, 2, 4, 5], [0, 1, 2, -1, 4, -1, 3, 1]], pad: .38, bass: .3, dens: .7 },
  { n: 'Đêm Sao Biển', d: 'Pad sâu thẳm · ánh sao lung linh', bpm: 46, cb: 2, tm: 'glass', sc: [0, 3, 5, 7, 10], mr: 76, ch: [{ r: 45, t: [0, 3, 7, 10, 14] }, { r: 41, t: [0, 4, 7, 11] }, { r: 48, t: [0, 4, 7, 11] }, { r: 40, t: [0, 3, 7, 10] }], pat: [[0, -1, -1, 2, -1, -1, 4, -1], [-1, 1, -1, -1, 3, -1, -1, 2], [0, -1, 3, -1, -1, 4, -1, -1]], pad: .75, bass: .7, dens: .5 },
  { n: 'Rừng Tảo Lung Linh', d: 'Đàn hạc · giai điệu trôi chảy', bpm: 64, cb: 1, tm: 'harp', sc: [0, 2, 4, 6, 7, 9, 11], mr: 70, ch: [{ r: 41, t: [0, 4, 7, 11] }, { r: 43, t: [0, 4, 7, 9] }, { r: 45, t: [0, 3, 7, 10] }, { r: 46, t: [0, 4, 7, 11] }], pat: [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 1, 3, 2, 4, 3, 5], [3, 2, 1, 0, 1, 2, 3, 4], [0, 1, 2, 1, 3, 2, 4, 2]], pad: .42, bass: .6, dens: .85 }
];
OC.TRACKS = TRACKS.map(t => ({ n: t.n, d: t.d }));
const MUS = { on: false, timer: 0, sess: null, trk: -1, step: 0, bar: 0, nextT: 0, pi: 0, mel: 0, bus: null };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function musicBus(){
  if(MUS.bus) return MUS.bus; const B = {}; B.out = AC.createGain(); B.out.gain.value = 0; B.out.connect(master);
  B.dry = AC.createGain(); B.dry.connect(B.out); B.pad = AC.createBiquadFilter(); B.pad.type = 'lowpass'; B.pad.frequency.value = 1500; B.pad.Q.value = .4; B.pad.connect(B.dry);
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .07; lg.gain.value = 500; lfo.connect(lg); lg.connect(B.pad.frequency); lfo.start(); B.lfo = lfo;
  try{ const len = Math.floor(AC.sampleRate * 2.4), ir = AC.createBuffer(2, len, AC.sampleRate); for(let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    B.rev = AC.createConvolver(); B.rev.buffer = ir; B.send = AC.createGain(); B.send.gain.value = .5; B.send.connect(B.rev); const rg = AC.createGain(); rg.gain.value = .55; B.rev.connect(rg); rg.connect(B.out); }catch(e){ B.send = null; }
  MUS.bus = B; return B;
}
function mNote(sess, f, t, d, v, kind, pan){
  const B = MUS.bus, g = AC.createGain(); let tail = g; if(pan && AC.createStereoPanner){ const p = AC.createStereoPanner(); p.pan.value = pan; g.connect(p); tail = p; }
  tail.connect(sess); if(B.send){ const sg = AC.createGain(); sg.gain.value = .6; tail.connect(sg); sg.connect(B.send); }
  const mk = (fr, type, vol) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = type; o.frequency.value = fr; og.gain.value = vol; o.connect(og); og.connect(g); o.start(t); o.stop(t + d + .1); };
  let atk = .006, dec = d;
  if(kind === 'piano'){ mk(f, 'sine', 1); mk(f * 2, 'triangle', .22); mk(f * 3, 'sine', .06); dec = d * .8; }
  else if(kind === 'bell'){ mk(f, 'sine', 1); mk(f * 2.76, 'sine', .22); mk(f * 5.4, 'sine', .07); dec = d * 1.1; }
  else if(kind === 'glass'){ mk(f, 'sine', 1); mk(f * 1.5, 'sine', .12); atk = .05; dec = d * 1.2; }
  else { mk(f, 'triangle', 1); mk(f * 2, 'sine', .3); dec = d * .7; }
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(.0001, t + dec);
  setTimeout(() => { try{ g.disconnect(); }catch(e){} }, (t - AC.currentTime + dec + .3) * 1000);
}
function mPad(sess, notes, t, d, v){
  const B = MUS.bus; for(const n of notes){ const g = AC.createGain(); g.connect(B.pad); if(B.send) g.connect(B.send);
    for(const dt of [-6, 5]){ const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = hz(n); o.detune.value = dt; o.connect(g); o.start(t); o.stop(t + d + 2.2); }
    const o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(n + 12); const g2 = AC.createGain(); g2.gain.value = .12; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + d + 2.2);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v / notes.length * 1.6, t + Math.min(2.2, d * .45)); g.gain.setValueAtTime(v / notes.length * 1.6, t + d); g.gain.linearRampToValueAtTime(.0001, t + d + 2);
    setTimeout(() => { try{ g.disconnect(); g2.disconnect(); }catch(e){} }, (t - AC.currentTime + d + 2.6) * 1000); }
}
function musicPump(){
  if(!MUS.on || !AC || audioHeld || AC.state !== 'running') return; const T = TRACKS[MUS.trk], sd = 30 / T.bpm, sess = MUS.sess; if(MUS.nextT < AC.currentTime) MUS.nextT = AC.currentTime + .1;
  while(MUS.nextT < AC.currentTime + 1.3){
    const t = MUS.nextT, st = MUS.step, bar = MUS.bar, ci = Math.floor(bar / T.cb) % T.ch.length, C = T.ch[ci], inCh = bar % T.cb, tones = C.t.map(x => C.r + 12 + x);
    if(st === 0){
      if(bar % 4 === 0) MUS.pi = (Math.random() * T.pat.length) | 0;
      if(inCh === 0){ const vo = C.t.map(x => 55 + ((C.r + x - 55) % 12 + 12) % 12).sort((a, b) => a - b); mPad(sess, vo.slice(0, 4), t, sd * 8 * T.cb, .16 * T.pad); const bs = AC.createOscillator(), bg = AC.createGain(); bs.type = 'sine'; bs.frequency.value = hz(C.r - 12); bs.connect(bg); bg.connect(MUS.bus.dry); bg.gain.setValueAtTime(.0001, t); bg.gain.linearRampToValueAtTime(.1 * T.bass, t + .5); bg.gain.setValueAtTime(.1 * T.bass, t + sd * 8 * T.cb - .3); bg.gain.linearRampToValueAtTime(.0001, t + sd * 8 * T.cb + .6); bs.start(t); bs.stop(t + sd * 8 * T.cb + .7); setTimeout(() => { try{ bg.disconnect(); }catch(e){} }, (t - AC.currentTime + sd * 8 * T.cb + 1) * 1000); }
    }
    const breath = bar % 16 >= 13, pat = T.pat[MUS.pi % T.pat.length], k = pat[st];
    if(k >= 0 && !breath && Math.random() < T.dens){ const n = C.t.length, m = C.r + 12 + C.t[k % n] + 12 * Math.floor(k / n) + (T.tm === 'glass' ? 12 : 0); mNote(sess, hz(m), t, sd * (T.tm === 'glass' ? 7 : 5), (.1 + Math.random() * .05) * (st % 4 === 0 ? 1.15 : 1), T.tm, (Math.random() - .5) * .7); }
    if((st === 0 || st === 4) && Math.random() < (breath ? .25 : .38)){ const sc = T.sc, len = sc.length * 2; MUS.mel = Math.max(0, Math.min(len - 1, MUS.mel + ((Math.random() * 5) | 0) - 2)); const m = T.mr + sc[MUS.mel % sc.length] + 12 * Math.floor(MUS.mel / sc.length) - 5; mNote(sess, hz(m), t + (Math.random() < .5 ? 0 : sd * .5), sd * 9, .11, T.tm === 'harp' ? 'bell' : T.tm, (Math.random() - .5) * .9); }
    if(T.tm === 'glass' && Math.random() < .09) mNote(sess, hz(T.mr + 12 + T.sc[(Math.random() * T.sc.length) | 0]), t, sd * 10, .05, 'glass', (Math.random() - .5) * 1.6);
    if(T.tm === 'harp' && st % 4 === 0 && Math.random() < .7) mNote(sess, hz(C.r - (st ? 0 : 12) + 12), t, sd * 4, .09, 'harp', -.2);
    MUS.nextT += sd; MUS.step = (st + 1) % 8; if(MUS.step === 0) MUS.bar++;
  }
}
function musicVol(){ if(!MUS.bus || !MUS.on) return; MUS.bus.out.gain.setTargetAtTime(Math.max(0, Math.min(1, S.set.mvol == null ? .5 : S.set.mvol)) * .9, AC.currentTime, .3); }
function musicStart(){
  if(!AC) return; const B = musicBus(); if(MUS.sess){ const o = MUS.sess; o.gain.setTargetAtTime(0, AC.currentTime, .25); setTimeout(() => { try{ o.disconnect(); }catch(e){} }, 1500); }
  MUS.sess = AC.createGain(); MUS.sess.gain.value = 0; MUS.sess.connect(B.out); MUS.sess.gain.setTargetAtTime(1, AC.currentTime + .1, .9);
  MUS.trk = Math.max(0, Math.min(TRACKS.length - 1, S.set.trk | 0)); MUS.step = 0; MUS.bar = 0; MUS.mel = 4; MUS.pi = 0; MUS.nextT = AC.currentTime + .15; MUS.on = true; musicVol();
  if(!MUS.timer) MUS.timer = setInterval(musicPump, 200);
}
function musicStop(now){
  MUS.on = false; clearInterval(MUS.timer); MUS.timer = 0; if(MUS.bus && AC){ try{ MUS.bus.out.gain.cancelScheduledValues(AC.currentTime); MUS.bus.out.gain.setTargetAtTime(0, AC.currentTime, now ? .01 : .12); }catch(e){} } const o = MUS.sess; MUS.sess = null; MUS.trk = -1;
  if(o && AC){ try{ if(now) o.gain.value = 0; else o.gain.setTargetAtTime(0, AC.currentTime, .2); }catch(e){} setTimeout(() => { try{ o.disconnect(); }catch(e){} }, now ? 50 : 1500); }
}
function musicApply(){
  if(!AC) return; const want = !audioHeld && S.set.mus && OC.running && !document.hidden;
  if(want){ if(MUS.on && MUS.trk === (S.set.trk | 0)){ return; } musicStart(); } else if(MUS.on) musicStop();
}
OC.musicApply = () => { OC.audioUnlock(); audioApply(); musicVol(); };
function tn(f, t, d, type = 'sine', v = .2, f2){ if(!AC || !S.set.sfx || audioHeld) return; const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + t; o.type = type; o.frequency.setValueAtTime(f, t0); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + .05); }
function sfx(n){
  if(OC.quiet) return;
  if(OC.fx) try{ OC.fx(n); }catch(e){}
  if(!AC || !S.set.sfx || audioHeld) return; if(AC.state === 'suspended') AC.resume();
  switch(n){
    case 'bubble': tn(380 + Math.random() * 200, 0, .08, 'sine', .12, 900); break; case 'plop': tn(260, 0, .1, 'sine', .15, 120); break;
    case 'coin': tn(988, 0, .08, 'square', .09); tn(1319, .07, .14, 'square', .09); break; case 'buy': tn(660, 0, .06, 'triangle', .14); tn(880, .06, .1, 'triangle', .14); break;
    case 'gem': tn(1568, 0, .3, 'sine', .14); tn(2093, .05, .4, 'sine', .1); tn(2637, .1, .5, 'sine', .07); break;
    case 'hatch': [523, 659, 784, 1047].forEach((q, i) => tn(q, i * .09, .2, 'triangle', .14)); break; case 'evolve': [392, 523, 659, 784, 1047].forEach((q, i) => tn(q, i * .08, .3, 'sine', .13)); break;
    case 'err': tn(180, 0, .15, 'square', .1); tn(140, .1, .2, 'square', .1); break; case 'ui': tn(700, 0, .04, 'sine', .08); break;
    case 'thunder': { const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; const g = AC.createGain(); g.gain.setValueAtTime(.5, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + 1.6); s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(AC.currentTime + 1.7); break; }
  }
}
/* tạm dừng toàn bộ âm thanh khi game không còn hiển thị (nền, khóa máy, thoát); quay lại thì khôi phục theo cài đặt */
OC.audioHold = () => { audioHeld = true; if(AC){ musicStop(true); try{ ambG.gain.value = 0; rainG.gain.value = 0; master.gain.value = 0; AC.suspend(); }catch(e){} } };
OC.audioRelease = () => { audioHeld = false; if(AC && !document.hidden){ try{ AC.resume(); }catch(e){} audioApply(); } };
OC.sfx = sfx;
/* ---------- thời tiết, ngày đêm ---------- */
function dayLen(){ return 360 / S.set.dn; }
function pickWeather(){ OC.wx = { k: wpick([['clear', 40], ['sun', 22], ['cloud', 14], ['rain', 10], ['heavy', 3], ['wind', 5], ['storm', 3], ['magic', 3]]), left: rnd(70, 160) }; if(OC.wx.k === 'magic') log('Hiện tượng phát sáng kỳ ảo xuất hiện!'); }
function weatherStep(dt){ OC.wx.left -= dt; if(OC.wx.left <= 0) pickWeather(); const k = OC.wx.k; if(['rain', 'heavy', 'storm'].includes(k)){ const n = k === 'rain' ? 1 : 2; for(let i = 0; i < n; i++) if(Math.random() < dt * 14) part('rain', rnd(WW), 16); }
  if(k === 'storm' && OC.flash <= 0 && Math.random() < dt * .12){ OC.flash = 1; setTimeout(() => sfx('thunder'), 350); } if(OC.flash > 0) OC.flash = Math.max(0, OC.flash - dt * 2.2); }
OC.flash = 0;
const sky = () => OA.skyColors(S.time);
/* ---------- vật phẩm xuất hiện ngẫu nhiên ---------- */
let spawnT = 20;
function spawnStep(dt){
  OC.items = OC.items.filter(i => (i.life -= dt) > 0); spawnT -= dt; if(spawnT > 0) return; spawnT = rnd(ECON.spawnMin, ECON.spawnMax) * (['rain', 'magic'].includes(OC.wx.k) ? .7 : 1);
  const t = now(); S.spawnLog = (S.spawnLog || []).filter(x => t - x < 3600000); if(S.spawnLog.length >= ECON.spawnPerHour || OC.items.length >= ECON.spawnMaxActive) return; S.spawnLog.push(t);
  const day = sky().day > .55 && ['clear', 'sun', 'magic'].includes(OC.wx.k); const type = wpick([['diamond', 45], ['bubble', 25], ['chest', 8], ['relic', 8], ['egg', 4], ['sun', day ? 14 : 0]]);
  const x = rnd(60, WW - 60), pl = S.placed.filter(p => p.k === 'dc' && OD.DC[p.id].glow || p.k === 'dc' && OD.DC[p.id].cave); const base = pl.length && Math.random() < .5 ? pick(pl).x * WW : x; const it = { id: S.uid++, type, x: cl(base + rnd(-40, 40), 40, WW - 40), y: rnd(120, floorY(base) - 24), life: type === 'sun' ? 28 : 24, maxlife: type === 'sun' ? 28 : 24, size: 1 };
  if(type === 'diamond'){ const r = Math.random(); it.size = r < .6 ? .8 : r < .9 ? 1.05 : 1.4; it.val = r < .6 ? ri(15, 30) : r < .9 ? ri(35, 60) : ri(70, 120); } else if(type === 'sun') it.val = ri(120, 300); else if(type === 'chest') it.val = ri(100, 500); else if(type === 'bubble') it.val = ri(5, 20); else if(type === 'relic') it.val = 50;
  OC.items.push(it);
}
OC.collect = function(it){
  const i = OC.items.indexOf(it); if(i < 0) return; OC.items.splice(i, 1); let msg = '';
  if(it.type === 'egg'){ if(capOk()){ const A = OD.SPECIES.filter(s => s.g === 'A' || s.g === 'B'), d = pick(A); OC.eggs.push(eggOf({ sp: d.id, g: randGenes(d), pers: randPers(d), anc: null, gen: 0, mut: [] }, it.x)); msg = 'Trứng bí ẩn: ' + d.n; } else { earn(60, 'item'); msg = 'Hồ đầy: đổi lấy 60 xu'; } }
  else { earn(it.val, 'item'); msg = '+' + it.val + ' xu'; if(it.type === 'relic') ev('relics'); }
  ev('items'); addXp(2); part('text', it.x, it.y - 10, msg); for(let k = 0; k < 10; k++) part('spark', it.x, it.y); sfx(it.type === 'diamond' || it.type === 'sun' ? 'gem' : 'coin'); queueSave();
};
/* ---------- AI cá ---------- */
function buildGrid(){ grid = new Map(); for(const f of OC.fish){ const k = ((f.x / 100) | 0) * 100 + ((f.y / 100) | 0); let a = grid.get(k); if(!a) grid.set(k, a = []); a.push(f); } }
function neighbors(f, r){ const out = [], cx = (f.x / 100) | 0, cy = (f.y / 100) | 0, n = Math.ceil(r / 100); for(let i = -n; i <= n; i++) for(let j = -n; j <= n; j++){ const a = grid.get((cx + i) * 100 + cy + j); if(a) for(const o of a) if(o !== f) out.push(o); } return out; }
const nightF = () => 1 - sky().day;
function shelters(){ return S.placed.filter(p => p.k === 'pl' && OD.PL[p.id].shelter || p.k === 'dc' && OD.DC[p.id].cave); }
function pickWander(f){ const lo = f.d.bottom ? floorY(f.x) - f.len * .3 : 70, hi = f.d.bottom ? lo : floorY(f.x) - 40; f.tx = f.pers.includes('loner') ? cl(f.x + rnd(-300, 300), 40, WW - 40) : rnd(50, WW - 50); f.ty = f.d.bottom ? floorY(f.tx) - f.len * .25 : rnd(70, floorY(f.tx) - 40); }
function chooseState(f){
  const d = f.d, P = f.pers, night = nightF() > .5, bad = ['storm', 'heavy'].includes(OC.wx.k), o = [['wander', 5]];
  if(d.school || P.includes('school')) o.push(['school', 7]); if(P.includes('playful')) o.push(['dart', 3]); if(P.includes('explorer')) o.push(['explore', 3]); if(P.includes('light')) o.push(['surface', 3]); if(P.includes('dark') || (night && d.night)) o.push(['cave', 4]);
  o.push(['bottom', 1.5]); if(shelters().length) o.push(['plant', 3]); if(P.includes('shy') && bad) o.push(['cave', 6]); if(P.includes('proud')) o.push(['show', 1.2]); if(P.includes('social') || P.includes('friendly')) o.push(['curious', 2]); if(bad) o.push(['cave', 2]);
  f.st = wpick(o); f.hid = false; f.bt = rnd(3, 8);
  switch(f.st){
    case 'wander': case 'dart': pickWander(f); if(f.st === 'dart'){ f.tx = cl(f.x + rnd(-260, 260), 40, WW - 40); f.ty = cl(f.y + rnd(-140, 140), 70, floorY(f.tx) - 40); f.bt = 1.3; } break;
    case 'explore': f.tx = Math.random() < .5 ? rnd(40, 200) : rnd(WW - 200, WW - 40); f.ty = rnd(80, floorY(f.tx) - 50); f.bt = rnd(4, 7); break;
    case 'surface': f.tx = rnd(60, WW - 60); f.ty = rnd(50, 110); break; case 'bottom': f.tx = rnd(60, WW - 60); f.ty = floorY(f.tx) - f.len * .3 - 6; break;
    case 'plant': case 'cave': { const s = shelters(); const sh = f.st === 'cave' ? s.filter(p => p.k === 'dc') : s; const p = sh.length ? pick(sh) : (s.length ? pick(s) : null); if(!p){ f.st = 'wander'; pickWander(f); break; } f.tx = p.x * WW; f.ty = floorY(p.x * WW) - (p.k === 'dc' ? 30 : 50); f.sh = p; f.orb = rnd(0, 6); break; }
    case 'show': f.tx = WW / 2 + rnd(-200, 200); f.ty = rnd(160, 360); f.bt = 3; break; case 'curious': f.bt = 3; break; case 'school': break;
  }
}
function maxSpeed(f){ const d = f.d, L = f.len; let s = Math.max(60, 215 - L * .85); if(d.arch === 'jelly') s = 28; else if(d.arch === 'octo') s = 70; else if(d.arch === 'crab' || d.arch === 'shrimp' || d.arch === 'star' || d.arch === 'cuc') s = 26; else if(d.arch === 'horse' || d.arch === 'dragon') s = 38; else if(d.arch === 'ray') s = 85; return s * (f.stg === 0 ? .8 : 1); }
function ai(f, dt, lod){
  const d = f.d, t = OC.t; f.bt -= dt; f.blT -= dt; if(f.blT < 0){ f.bl = .05; f.blT = rnd(2, 6); } f.bl = Math.min(1, f.bl + dt * 9);
  for(const k of ['fleeT', 'curT', 'folT', 'angT', 'wag', 'flare', 'spin', 'pulse', 'lookT', 'cirT', 'hideT']) if(f[k] > 0) f[k] -= dt;
  if(f.mouth > 0) f.mouth = Math.max(0, f.mouth - dt * 3); f.gill = Math.max(0, f.gill - dt * 2);
  if(f.bt <= 0 && !f.pair && f.st !== 'eat') chooseState(f);
  const P = OC.ptr, pa = t - P.t < 4, p2 = { x: P.x, y: P.y }; let mul = .45, tx = f.tx, ty = f.ty;
  // thức ăn
  f.fT -= dt; if(f.fT <= 0){ f.fT = .35; if(OC.food.length && !f.pair && (f.hun < 92 || f.pers.includes('foodie'))){ let best = null, bd = (f.pers.includes('fierce') ? 330 : 250) ** 2; for(const fd of OC.food){ const q = (fd.x - f.x) ** 2 + (fd.y - f.y) ** 2; if(q < bd){ bd = q; best = fd; } } if(best){ f.st = 'eat'; f.ft = best; f.bt = 4; } } }
  if(f.st === 'eat'){ const fd = f.ft; if(!fd || OC.food.indexOf(fd) < 0){ f.st = 'wander'; f.bt = rnd(.5, 2); pickWander(f); } else { tx = fd.x; ty = fd.y; mul = f.pers.includes('fierce') ? 2.2 : 1.8; if((fd.x - f.x) ** 2 + (fd.y - f.y) ** 2 < (f.len * .3 + 7) ** 2){ f.gill = 1; eatFood(f, fd); } } }
  else if(f.fleeT > 0){ mul = 1.9; tx = f.x + (f.x - P.x) * 3; ty = f.y + (f.y - P.y) * 3; }
  else if(f.pair){ const o = canBreed(S.tk) ? OC.fish.find(q => q.id === f.pair.with) : null; if(!o){ f.pair = null; } else { f.orb = (f.orb || 0) + dt * 1.4 * (f.id < o.id ? 1 : -1); tx = (f.x + o.x) / 2 + Math.cos(f.orb) * 36; ty = (f.y + o.y) / 2 + Math.sin(f.orb) * 22; mul = .8; if(Math.hypot(f.x - o.x, f.y - o.y) < 130){ f.pair.t -= dt; if(Math.random() < dt * 2) part('heart', f.x, f.y - 10); if(f.pair.t <= 0 && f.id < o.id) layEggs(f, o); else if(f.pair.t <= 0){ f.pair = null; } } } }
  else if(f.folT > 0 && pa){ mul = 1.1; tx = P.x; ty = P.y; if(OC.ptr.down) f.folT = Math.max(f.folT, .3); }
  else if(f.cirT > 0 && pa){ f.orb = (f.orb || 0) + dt * 2.6; tx = P.x + Math.cos(f.orb) * 50; ty = P.y + Math.sin(f.orb) * 32; mul = 1.2; }
  else if(f.curT > 0 && pa){ mul = 1; tx = P.x - (f.x < P.x ? 26 : -26); ty = P.y; }
  else if(f.hideT > 0){ const s = shelters(); if(s.length){ const p = f.sh && s.includes(f.sh) ? f.sh : (f.sh = pick(s)); tx = p.x * WW; ty = floorY(tx) - 36; mul = 1.4; } }
  else switch(f.st){
    case 'wander': mul = .45; if((f.x - tx) ** 2 + (f.y - ty) ** 2 < 1600) pickWander(f); break;
    case 'school': { mul = .62; const nb = neighbors(f, 260).filter(o => o.sp === f.sp); if(nb.length){ let cx = 0, cy = 0, ax = 0, ay = 0; for(const o of nb){ cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; } cx /= nb.length; cy /= nb.length; tx = cx + ax / nb.length * .9; ty = cy + ay / nb.length * .9; } else { pickWander(f); tx = f.tx; ty = f.ty; } break; }
    case 'dart': mul = 1.5; break; case 'explore': mul = .6; break; case 'surface': mul = .5; break; case 'bottom': mul = .4; break;
    case 'plant': { f.orb += dt * .8; const p = f.sh; if(p){ tx = p.x * WW + Math.cos(f.orb) * 58; ty = floorY(p.x * WW) - 50 + Math.sin(f.orb) * 26; } mul = .5; break; }
    case 'cave': { mul = .5; const p = f.sh; if(p){ tx = p.x * WW; ty = floorY(tx) - 28; if((f.x - tx) ** 2 + (f.y - ty) ** 2 < 2500){ f.hid = true; mul = .12; } } break; }
    case 'curious': if(pa){ tx = P.x - 30; ty = P.y; mul = .8; } else { f.bt = 0; } break;
    case 'show': mul = .55; f.spin = f.spin > 0 ? f.spin : (Math.random() < dt * .6 ? .9 : 0); break;
  }
  const nearP = pa && Math.hypot(f.x - P.x, f.y - P.y) < 24 && (f.curT > 0 || f.folT > 0) && f.fr > 60 && Math.random() < dt * .8; if(nearP && Math.random() < .5) part('heart', f.x, f.y - 8);
  const spd = maxSpeed(f); let dx = tx - f.x, dy = ty - f.y, dist = Math.hypot(dx, dy) || 1; const want = Math.min(spd * mul * (f.wag > 0 ? 1.15 : 1), dist * 2.4 + 8); let dvx = dx / dist * want, dvy = dy / dist * want;
  if(!lod){ for(const o of neighbors(f, 60)){ const ddx = f.x - o.x, ddy = f.y - o.y, dd = Math.hypot(ddx, ddy) || 1, R = (f.len + o.len) * .26; if(dd < R){ dvx += ddx / dd * (R - dd) * 3.2; dvy += ddy / dd * (R - dd) * 3.2; } } }
  const arch = d.arch;
  if(f.d.bottom || arch === 'crab' || arch === 'shrimp' || arch === 'star' || arch === 'cuc'){ dvy = (floorY(f.x) - f.len * .22 - 4 - f.y) * 2.4; if(arch !== 'fish') dvx *= .8; }
  else if(arch === 'jelly'){ dvy = Math.sin(t * .8 + f.id) * 22 + (ty - f.y) * .05; dvx = dx / dist * spd * .5; }
  else if(arch === 'octo'){ const burst = Math.max(0, Math.sin(t * 1.1 + f.id * 2)); dvx *= .4 + burst * 1.8; dvy *= .4 + burst * 1.8; }
  else if(arch === 'horse' || arch === 'dragon'){ dvy += Math.sin(t * 1.2 + f.id) * 12; }
  const k = Math.min(1, dt * (f.st === 'dart' || f.fleeT > 0 ? 6 : 2.2)); f.vx += (dvx - f.vx) * k; f.vy += (dvy - f.vy) * k;
  f.x += f.vx * dt; f.y += f.vy * dt; const fl = floorY(f.x) - f.len * (f.d.bottom ? .16 : .12) - 4;
  if(f.x < 30){ f.x = 30; f.vx = Math.abs(f.vx); if(f.tx < 30) pickWander(f); } if(f.x > WW - 30){ f.x = WW - 30; f.vx = -Math.abs(f.vx); if(f.tx > WW - 30) pickWander(f); } if(f.y < 42){ f.y = 42; f.vy = Math.abs(f.vy); } if(f.y > fl){ f.y = fl; f.vy = -Math.abs(f.vy) * .3; }
  if(Math.abs(f.vx) > 6 && arch !== 'jelly') f.tf = Math.sign(f.vx); f.face += (f.tf - f.face) * Math.min(1, dt * 6);
  const speed = Math.hypot(f.vx, f.vy); f.spd = cl(speed / spd, 0, 1.2); f.ph += dt * (2.2 + 8 * f.spd) * (f.wag > 0 ? 1.7 : 1);
  f.pitch = arch === 'fish' ? f.tf * Math.atan2(f.vy, Math.abs(f.vx) + 25) * .6 : (arch === 'ray' ? f.tf * Math.atan2(f.vy, Math.abs(f.vx) + 25) * .4 : 0);
  if(f.spin > 0 && arch === 'fish'){ f.pitch += (1 - f.spin / .9) * TAU * f.tf; }
  f.mood = f.angT > 0 ? 'angry' : (f.hid && nightF() > .4) ? 'sleep' : 'ok'; f.al = f.hid ? .55 : 1;
  if(pa && f.lookT > 0 || f.curT > 0){ f.lx = cl((P.x - f.x) / 180, -1, 1) * f.tf; f.ly = cl((P.y - f.y) / 180, -1, 1); } else { f.lx *= .9; f.ly *= .9; }
  if(f.hun < 25 && Math.random() < dt * .08) part('bubble', f.x, f.y);
}
/* ---------- mỗi giây ---------- */
const GROW_RATE = f => 75 / (f.d.growMin * 60) * S.set.tm;
function secondTick(dt, offline){
  const t = now();
  for(const f of OC.fish){
    const care = f.hun > 25 && f.joy > 25 ? 1 : .5; f.grow = Math.min(100, f.grow + GROW_RATE(f) * dt * care);
    f.hun = Math.max(offline ? 25 : 0, f.hun - .045 * dt * (offline ? .5 : 1)); f.joy = Math.max(10, f.joy - (f.hun < 30 ? .03 : .008) * dt * (offline ? .5 : 1)); f.hp = f.hun < 15 ? Math.max(40, f.hp - .02 * dt) : Math.min(100, f.hp + .03 * dt);
    const s = stageOf(f); if(s !== f.stg){ f.stg = s; if(!offline){ f.pulse = 2.5; for(let i = 0; i < 14; i++) part('spark', f.x + rnd(-18, 18), f.y + rnd(-14, 14)); for(let i = 0; i < 6; i++) part('bubble', f.x + rnd(-12, 12), f.y); sfx('evolve'); log(`${f.name || f.d.n} lên giai đoạn: ${OD.STAGES[s + 1]}`); if(f.d.tier >= 3) OC.toast(`${f.d.n} tiến hóa: ${OD.STAGES[s + 1]}!`, 'ok'); } }
    if(s === 3 && !f.wasAdult){ f.wasAdult = true; ev('adults'); f.inc.n = t + incMs(f.d, fishLevel(f)); log((f.name || f.d.n) + ' đã trưởng thành!'); }
    if(!offline) f.len = baseLen(f);
    if(s === 3){ const iv = incMs(f.d, fishLevel(f)) / (f.incBoost > t ? 1.5 : 1); let n = 0; while(f.inc.n <= t && n < ECON.maxIncomeStack){ if((f.inc.acc / Math.max(1, incAmount(f))) < ECON.maxIncomeStack){ f.inc.acc += incAmount(f); } f.inc.n += iv; n++; } if(f.inc.n < t) f.inc.n = t + iv; }
  }
  for(const e of OC.eggs.slice()){ if(t >= e.hatch) hatchEgg(e); }
  if(canBreed(S.tk)) for(const f of OC.fish) if(f.d.asex && stageOf(f) === 3 && t >= f.cd && f.hun > 45 && f.joy > 45 && capOk() && Math.random() < .02 * dt){ layEggs(f, f); }
}
OC.secondTick = secondTick;

/* ---------- TỰ ĐỘNG: mua thức ăn khi xuống dưới ngưỡng, cho cá ăn tự động (cấu hình riêng từng loại) ---------- */
function autoFix(){ const a = S.auto = S.auto || { buy: {}, feed: {} }; a.buy = a.buy || {}; a.feed = a.feed || {}; for(const f of OD.FOODS){ const b = a.buy[f.id] = Object.assign({ on: false, min: 0 }, a.buy[f.id]); b.on = !!b.on; b.min = Math.max(0, Math.min(9999, b.min | 0)); a.feed[f.id] = !!a.feed[f.id]; } }
let afT = 0, afRR = 0, abNote = 0;
function autoBuyTick(){
  let bought = 0, sum = 0; for(const F of OD.FOODS){ const b = S.auto.buy[F.id]; if(!b.on || b.min <= 0) continue; const have = S.inv.food[F.id] || 0; if(have >= b.min) continue;
    const n = Math.min(Math.ceil((b.min - have) / F.pack), Math.floor(S.coins / F.price)); if(n <= 0) continue; if(!spend(F.price * n, 'food', 'Tự động mua ' + F.n + ' ×' + n)) continue; S.inv.food[F.id] = have + F.pack * n; bought++; sum += F.price * n; }
  if(bought){ queueSave(); OC.ui.refresh && OC.ui.refresh('food'); const t = now(); if(t - abNote > 12000){ abNote = t; OC.toast(`Tự động mua thức ăn (${bought} loại, −${sum} xu)`, 'info'); } }
}
function autoFeedTank(){
  const en = OD.FOODS.filter(f => S.auto.feed[f.id]); if(!en.length || !OC.fish.length) return; const t = now(); let n = 0;
  for(const f of OC.fish){ if(n >= 4) break; if(f.hun >= 60 || (f.aT || 0) > t) continue; const st = stageOf(f);
    const el = en.filter(F => (S.inv.food[F.id] | 0) > 0 && (!F.fry || st < 2) && (!F.rare || f.d.tier >= 2) && (!F.inc || f.d.tier >= 3) && (!F.breed || st === 3)); if(!el.length) continue;
    const F = el[(afRR++) % el.length]; S.inv.food[F.id]--; f.aT = t + 9000; n++;
    if(OC.quiet) eatFood(f, { type: F.id, x: f.x, y: f.y }); else OC.food.push({ id: S.uid++, x: cl(f.x + rnd(-14, 14), 20, WW - 20), y: Math.max(24, f.y - 40), vy: 24, type: F.id, life: 35 }); }
  if(n) OC.ui.refresh && OC.ui.refresh('food');
}
function autoTick(k){ if(!S.auto) return; autoBuyTick(); afT += k; if(afT >= 3){ afT = 0; for(let i = 0; i < 4; i++) if(TK.fish[i].length) withTank(i, autoFeedTank); autoBuyTick(); } }
OC.autoSet = (kind, id, v) => { const a = S.auto, F = OD.FD[id]; if(!F) return; if(kind === 'buy'){ a.buy[id].on = !!v; if(v && !(a.buy[id].min > 0)) a.buy[id].min = F.pack * 4; } else if(kind === 'min') a.buy[id].min = Math.max(0, Math.min(9999, Math.floor(+v) || 0)); else a.feed[id] = !!v; queueSave(); };
function tickAll(k){
  autoTick(k); secondTick(k); for(let i = 0; i < 4; i++) if(i !== S.tk && (TK.fish[i].length || TK.eggs[i].length)) withTank(i, () => secondTick(k));
  bgBr += k; if(bgBr >= 6){ bgBr = 0; for(let i = 0; i < 4; i++) if(i !== S.tk && canBreed(i) && TK.fish[i].length > 1) withTank(i, bgBreed); }
}
let bgBr = 0;
/* hồ đang chạy nền (không xem): ghép cặp tức thì, vẫn tôn trọng công tắc sinh sản của hồ đó */
function bgBreed(){
  const t = now(), ready = OC.fish.filter(f => stageOf(f) === 3 && t >= f.cd && f.hun > 45 && f.joy > 45 && f.hp > 50 && !f.d.asex); if(ready.length < 2 || !capOk(2)) return; const used = new Set();
  for(const a of ready.slice().sort(() => Math.random() - .5)){ if(used.has(a)) continue; const c = ready.filter(b => b !== a && !used.has(b) && compat(a, b, a.boost.compat || b.boost.compat)); if(c.length && Math.random() < .4){ const b = pick(c); if(!capOk(2)) break; used.add(a); used.add(b); layEggs(a, b); } }
}
function breedTick(){
  if(!canBreed(S.tk)){ for(const f of OC.fish) if(f.pair){ f.pair = null; if(f.st === 'pair') f.st = 'wander'; } return; }
  const t = now(), ready = OC.fish.filter(f => stageOf(f) === 3 && t >= f.cd && f.hun > 45 && f.joy > 45 && f.hp > 50 && !f.pair && !f.d.asex); if(ready.length < 2 || !capOk(2)) return;
  for(const a of ready){ if(a.pair) continue; let best = null, bd = 190 * 190; for(const b of ready){ if(b === a || b.pair || !compat(a, b, a.boost.compat || b.boost.compat)) continue; const q = (a.x - b.x) ** 2 + (a.y - b.y) ** 2; if(q < bd){ bd = q; best = b; } } if(best && Math.random() < .5){ a.pair = { with: best.id, t: 7 }; best.pair = { with: a.id, t: 7 }; a.st = best.st = 'pair'; a.hid = best.hid = false; } }
}
/* ---------- bước mô phỏng ---------- */
function step(dt){
  OC.t += dt; S.time = (S.time + dt / dayLen()) % 1; weatherStep(dt); spawnStep(dt); audioApply();
  acc1 += dt; if(acc1 >= 1){ const k = acc1; acc1 = 0; tickAll(k); } acc2 += dt; if(acc2 >= 2){ acc2 = 0; breedTick(); } acc5 += dt; if(acc5 >= 5){ acc5 = 0; rollDay(); OC.checkQuests(); OC.ui.refresh && OC.ui.refresh('tick'); }
  buildGrid(); const big = OC.fish.length > 60; OC.frame++;
  for(const f of OC.fish){ const lod = big && f.z < .4 && (OC.frame + f.id) % 2; ai(f, lod ? dt * 2 : dt, big && f.z < .5); f.pulse2 = f.pulse > 0; }
  for(const fd of OC.food){ fd.life -= dt; fd.y += fd.vy * dt; fd.vy = Math.min(60, fd.vy + 20 * dt); fd.x += Math.sin(OC.t * 2 + fd.id) * 6 * dt; const fy = floorY(fd.x) - 6; if(fd.y > fy){ fd.y = fy; fd.vy = 0; } } OC.food = OC.food.filter(fd => fd.life > 0);
  for(const p of OC.parts){ p.life += dt; if(p.type === 'bubble'){ p.y -= (30 + p.s * 4) * dt; p.x += Math.sin(OC.t * 3 + p.s * 5) * 12 * dt; if(p.y < 18) p.life = p.max; } else if(p.type === 'rain'){ p.y += 600 * dt; if(p.y > 24) p.life = p.max; if(p.life >= p.max && Math.random() < .3) part('ring', p.x, 18); } else if(p.type === 'ring'){ } else { p.x += p.vx * dt; p.y += p.vy * dt; if(p.type === 'heart') p.vy -= 4 * dt; } } OC.parts = OC.parts.filter(p => p.life < p.max);
  if(Math.random() < dt * .8) for(const v of [.18, .5, .83]) if(Math.random() < .3) part('bubble', v * WW + rnd(-6, 6), floorY(v * WW) - 4);
  saveT += dt; if(saveT > 20){ saveT = 0; save(); }
}
/* ---------- vẽ ---------- */
function clampAll(){ for(const f of OC.fish){ f.x = cl(f.x, 30, WW - 30); f.y = cl(f.y, 42, floorY(f.x) - 10); f.tx = cl(f.tx, 30, WW - 30); f.ty = cl(f.ty, 42, floorY(f.tx) - 10); } for(const e of OC.eggs){ e.x = cl(e.x, 30, WW - 30); e.y = floorY(e.x) - 10; } for(const i of OC.items){ i.x = cl(i.x, 30, WW - 30); i.y = cl(i.y, 60, floorY(i.x) - 20); } for(const fd of OC.food){ fd.x = cl(fd.x, 20, WW - 20); } }
function resize(){ const r = canvas.getBoundingClientRect(); vw = Math.max(100, r.width); vh = Math.max(100, r.height);
  const s0 = Math.min(vh / 560, vw / 440), nw = cl(vw / s0, 440, 1500), nh = cl(vh / s0, 560, 1500); if(Math.abs(nw - WW) > 2 || Math.abs(nh - WH) > 2){ WW = nw; WH = nh; OC.WW = WW; OC.WH = WH; clampAll(); } const q = S.set.q, d = Math.min(q === 'low' ? 1 : q === 'high' ? 2 : (OC.fish.length > 70 ? 1.25 : 1.5), window.devicePixelRatio || 1); dpr = d; canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr); clampCam(); }
OC.resize = resize;
const baseScale = () => Math.max(vh / WH, vw / WW), scale = () => baseScale() * OC.cam.z;
function clampCam(){ OC.cam.z = cl(OC.cam.z, 1, 2.6); const sc = scale(); OC.cam.x = cl(OC.cam.x, 0, Math.max(0, WW - vw / sc)); OC.cam.y = cl(OC.cam.y, 0, Math.max(0, WH - vh / sc)); }
OC.zoom = function(f, cx, cy){ const sc0 = scale(), wx = (cx == null ? vw / 2 : cx) / sc0 + OC.cam.x, wy = (cy == null ? vh / 2 : cy) / sc0 + OC.cam.y; OC.cam.z *= f; clampCam(); const sc = scale(); OC.cam.x = wx - (cx == null ? vw / 2 : cx) / sc; OC.cam.y = wy - (cy == null ? vh / 2 : cy) / sc; clampCam(); };
const toWorld = (sx, sy) => ({ x: sx / scale() + OC.cam.x, y: sy / scale() + OC.cam.y });
/* ---------- hiệu ứng thị giác bổ sung (chỉ vẽ, không đụng logic) ---------- */
const AURA_C = ['', '', '', '255,154,209', '255,211,77', '255,106,61'];
let auraN = 0, vigC = null, vigW = 0, vigH = 0;
function lowFx(){ return S.set.q === 'low' || OC.fpsT === 'low'; }
function aura(c, f, t){ if(auraN++ > 12) return; const col = AURA_C[f.d.tier] || '150,215,255', r = f.len * (.64 + .06 * Math.sin(t * 2 + f.id)), a = .2 + .09 * Math.sin(t * 2.2 + f.id), g = c.createRadialGradient(f.x, f.y, r * .1, f.x, f.y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.6, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, r, 0, TAU); c.fill(); }
function ambient(c, t, night){
  /* dòng bong bóng từ đáy cát */
  if(!lowFx()){ c.lineWidth = 1; for(let i = 0; i < 4; i++){ const bx = WW * (.12 + i * .25) + (i % 2 ? 18 : -14), by = floorY(bx) - 4, span = WH * (.5 + (i % 3) * .1);
      for(let k = 0; k < 6; k++){ const u = ((t * (.07 + i * .006) + k / 6 + i * .17) % 1), y = by - u * span, x = bx + Math.sin(t * 1.6 + k * 2 + i) * (4 + u * 10), r = 1.2 + u * 2.6 + (k % 2) * .6, a = Math.sin(u * Math.PI) * .6; if(a < .03) continue; c.globalAlpha = a; c.strokeStyle = 'rgba(255,255,255,.9)'; c.fillStyle = 'rgba(210,245,255,.2)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .22, 0, TAU); c.fill(); } } c.globalAlpha = 1; }
  /* hạt sáng / phù du: ban đêm chuyển sang phát quang xanh–tím */
  const th = (S.tanks[S.tk] || {}).th | 0, col = th === 3 ? '#9fffe9' : th === 1 ? '#ffe0ee' : th === 2 ? '#efffd8' : night > .35 ? '#8ff7ff' : '#f2fdff'; c.fillStyle = col; night = th === 3 ? 1 : night; let i = 0;
  for(const p of plankton){ p.x = (p.x + p.vx * .016 + WW) % WW; p.y = (p.y + p.vy * .016 + WH) % WH; const tw = .5 + .5 * Math.sin(t * 1.5 + i * 1.7); c.globalAlpha = (.16 + .3 * tw) * (night > .35 ? 1.3 : 1); c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
    if(!(i++ & 3) && !lowFx()){ c.globalAlpha = (.05 + .09 * tw) * (night > .35 ? 1.6 : 1); c.beginPath(); c.arc(p.x, p.y, p.r * 4.2, 0, TAU); c.fill(); } }
  c.globalAlpha = 1;
}
function vignette(c){
  if(!vigC || vigW !== vw || vigH !== vh){ vigC = document.createElement('canvas'); vigW = vw; vigH = vh; vigC.width = Math.max(2, Math.round(vw / 2)); vigC.height = Math.max(2, Math.round(vh / 2)); const v = vigC.getContext('2d'), w = vigC.width, h = vigC.height, r = Math.hypot(w, h) / 2, g = v.createRadialGradient(w / 2, h * .46, r * .42, w / 2, h / 2, r); g.addColorStop(0, 'rgba(2,24,52,0)'); g.addColorStop(1, 'rgba(2,20,46,.46)'); v.fillStyle = g; v.fillRect(0, 0, w, h); const tg = v.createLinearGradient(0, 0, 0, h * .22); tg.addColorStop(0, 'rgba(200,245,255,.16)'); tg.addColorStop(1, 'rgba(200,245,255,0)'); v.fillStyle = tg; v.fillRect(0, 0, w, h * .22); const bg = v.createLinearGradient(0, h * .78, 0, h); bg.addColorStop(0, 'rgba(2,16,40,0)'); bg.addColorStop(1, 'rgba(2,16,40,.28)'); v.fillStyle = bg; v.fillRect(0, h * .78, w, h * .22); }
  c.drawImage(vigC, 0, 0, vw, vh);
}
let bgC = null, bgT = -9;
function drawBg(c, env){ const rf = cl(scale() * dpr * .75, .5, 1), w = Math.ceil(WW * rf), h = Math.ceil((WH + 40) * rf); if(!bgC || bgC.width !== w || bgC.height !== h){ bgC = document.createElement('canvas'); bgC.width = w; bgC.height = h; bgT = -9; } if(OC.t - bgT > .7){ bgT = OC.t; const b = bgC.getContext('2d'); b.setTransform(rf, 0, 0, rf, 0, 0); OA.bg(b, WW, WH + 40, env); } c.drawImage(bgC, 0, 0, WW, WH + 40); }
function draw(){
  const c = ctx, t = OC.t, sk = sky(), env = { sky: sk, t, floor: floorY, theme: (S.tanks[S.tk] || {}).th | 0, light: 1 - (['storm', 'heavy'].includes(OC.wx.k) ? .7 : OC.wx.k === 'cloud' ? .4 : OC.wx.k === 'rain' ? .5 : 0), wave: ['storm'].includes(OC.wx.k) ? 2 : OC.wx.k === 'wind' ? 1.4 : OC.wx.k === 'heavy' ? 1.2 : .4 };
  c.setTransform(dpr, 0, 0, dpr, 0, 0); const sc = scale(); c.save(); c.scale(sc, sc); c.translate(-OC.cam.x, -OC.cam.y);
  drawBg(c, env);
  const night = 1 - sk.day, sway = (OC.wx.k === 'storm' ? 2 : OC.wx.k === 'wind' ? 1.6 : OC.wx.k === 'heavy' ? 1.3 : 1) * 1;
  const drawPlaced = lay => { for(const p of S.placed){ if(p.lay !== lay) continue; const x = p.x * WW, y = floorY(x) + (lay === 2 ? 10 : 4); if(p.k === 'pl'){ const d = OD.PL[p.id]; OA.plant(c, { d, x, y, h: 90 + (p.uid % 4) * 18, w: 80, id: p.uid }, t, sway); } else OA.decor(c, { d: OD.DC[p.id], x, y, s: p.s, id: p.uid }, t, night); if(OC.mode === 'edit'){ c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([5, 4]); c.strokeRect(x - 45, y - 120, 90, 130); c.setLineDash([]); } } };
  drawPlaced(0); drawPlaced(1);
  // trứng
  for(const e of OC.eggs){ e.prog = 1 - (e.hatch - now()) / (e.hatch - e.born); OA.egg(c, e, t); }
  // cá
  auraN = 0; const sorted = OC.fish.slice().sort((a, b) => a.z - b.z), view = { x0: OC.cam.x - 120, x1: OC.cam.x + vw / sc + 120, y0: OC.cam.y - 120, y1: OC.cam.y + vh / sc + 120 };
  for(const f of sorted){ if(f.x < view.x0 || f.x > view.x1 || f.y < view.y0 || f.y > view.y1) continue; const k = .74 + .36 * f.z; f.len = baseLen(f) * k; f.gk = 1 + night * .8; const pl = f.len * sc; f.lod = pl < 30 ? 2 : pl < 62 ? 1 : 0; const gl = c.globalAlpha; if(f.lod < 2 && !lowFx() && (f.d.tier >= 3 || f.g.crown || f.mut.length)) aura(c, f, t); c.globalAlpha = .84 + .16 * f.z; f.fav = f.fav; OA.fish(c, f, t); c.globalAlpha = gl;
    if(f.inc.acc > 0 && f.stg === 3){ c.font = '700 13px Montserrat,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd34d'; c.strokeStyle = '#7a4a00'; c.lineWidth = 3; const by = f.y - f.len * .32 - 12 + Math.sin(t * 5 + f.id) * 3; c.beginPath(); c.arc(f.x, by, 9, 0, TAU); c.fillStyle = '#ffd34d'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#7a4a00'; c.fillText('¢', f.x, by + 4.5); }
    if(f.hun < 25){ c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('🍖', f.x + f.len * .3, f.y - f.len * .28); }
    if(f === OC.sel){ { const hr = f.len * .8, hg = c.createRadialGradient(f.x, f.y, hr * .3, f.x, f.y, hr); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(.75, `rgba(150,240,255,${.16 + .06 * Math.sin(t * 4)})`); hg.addColorStop(1, 'rgba(150,240,255,0)'); c.fillStyle = hg; c.beginPath(); c.arc(f.x, f.y, hr, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(255,255,255,.92)'; c.shadowColor = 'rgba(120,235,255,.9)'; c.shadowBlur = 8; c.lineWidth = 2; c.setLineDash([6, 4]); c.lineDashOffset = -t * 22; c.beginPath(); c.ellipse(f.x, f.y, f.len * .62, f.len * .42, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; c.shadowBlur = 0; c.font = '700 12px Montserrat,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,30,60,.8)'; c.lineWidth = 3; const nm = f.name || f.d.n; c.strokeText(nm, f.x, f.y - f.len * .55 - 6); c.fillText(nm, f.x, f.y - f.len * .55 - 6); } }
  for(const fd of OC.food){ const F = OD.FD[fd.type]; c.beginPath(); c.arc(fd.x, fd.y, 4, 0, TAU); c.fillStyle = { basic: '#c98a4a', growth: '#7adc6a', color: '#ff7ad1', happy: '#ffd34d', fry: '#f0c8a0', breed: '#ff6a8a', rare: '#8f8cff', glow: '#4dffea', legend: '#ffd34d' }[fd.type]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#fff'; c.stroke(); }
  drawPlaced(2);
  for(const it of OC.items) OA.item(c, it, t);
  OA.surface(c, WW, env);
  // plankton
  ambient(c, t, night);
  // hạt
  for(const p of OC.parts){ const u = p.life / p.max; c.globalAlpha = Math.max(0, 1 - u * u);
    if(p.type === 'bubble'){ c.beginPath(); c.arc(p.x, p.y, p.s * .6, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); }
    else if(p.type === 'heart'){ c.fillStyle = '#ff5a8a'; c.font = (10 + p.s) + 'px sans-serif'; c.textAlign = 'center'; c.fillText('♥', p.x, p.y); }
    else if(p.type === 'spark'){ c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(p.x, p.y, p.s * .35 * (1 - u), 0, TAU); c.fill(); }
    else if(p.type === 'ring'){ c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y, 4 + u * 22, 2 + u * 7, 0, 0, TAU); c.stroke(); }
    else if(p.type === 'rain'){ c.strokeStyle = 'rgba(200,225,255,.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x, p.y - 12); c.lineTo(p.x - 2, p.y); c.stroke(); }
    else if(p.type === 'text'){ c.font = '800 14px Montserrat,sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,30,60,.85)'; c.strokeText(p.txt, p.x, p.y); c.fillStyle = '#ffd34d'; c.fillText(p.txt, p.x, p.y); }
    c.globalAlpha = 1; }
  c.restore();
  // lớp phủ ánh sáng
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dark = night * .42 + (['storm'].includes(OC.wx.k) ? .28 : ['heavy', 'rain', 'cloud'].includes(OC.wx.k) ? .14 : 0); if(dark > .01){ c.fillStyle = `rgba(6,10,46,${dark})`; c.fillRect(0, 0, vw, vh); }
  if(OC.wx.k === 'magic'){ const g = c.createLinearGradient(0, 0, vw, vh); g.addColorStop(0, 'rgba(255,120,220,.12)'); g.addColorStop(.5, 'rgba(120,255,220,.14)'); g.addColorStop(1, 'rgba(120,160,255,.12)'); c.fillStyle = g; c.fillRect(0, 0, vw, vh); }
  vignette(c);
  if(OC.flash > 0){ c.fillStyle = `rgba(255,255,255,${OC.flash * .55})`; c.fillRect(0, 0, vw, vh); }
  const vg = c.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .45, vw / 2, vh / 2, Math.max(vw, vh) * .75); vg.addColorStop(0, 'rgba(0,10,40,0)'); vg.addColorStop(1, 'rgba(0,10,40,.35)'); c.fillStyle = vg; c.fillRect(0, 0, vw, vh);
}
/* ---------- vòng lặp ---------- */
function loop(ts){
  if(!running){ raf = 0; return; }
  /* giới hạn khung hình để máy bớt nóng: cân bằng 30, tiết kiệm 20, mượt 60; mở bảng chức năng thì 15 (hồ bị che) */
  const pw = S.set.pw, tgt = OC.hiFps ? 60 : OC.slow ? 15 : pw === 'smooth' ? 60 : pw === 'sav' ? 20 : 30, minF = 1000 / tgt, el = ts - lastTs;
  if(el < minF - 3){ raf = requestAnimationFrame(loop); return; }
  const dt = Math.min(.1, el / 1000); lastTs = ts; OC.fpsAvg += ((el > minF * 1.35 ? el : 16) - OC.fpsAvg) * .03;
  if(S.set.q === 'auto' && OC.fpsAvg > 30 && OC.fpsT !== 'low' && OC.frame % 60 === 0){ OC.fpsT = 'low'; S.set.parts = .5; dpr = 1; canvas.width = Math.round(vw); canvas.height = Math.round(vh); }
  if(dt > .05){ step(dt / 2); step(dt / 2); } else step(dt); draw(); raf = requestAnimationFrame(loop);
}
OC.start = function(){ if(running) return; running = true; if(OC.stoppedAt){ const rep = applyOffline((now() - OC.stoppedAt) / 1000); OC.stoppedAt = 0; if(rep) OC.offline = rep; } lastTs = performance.now(); OC.running = true; resize(); raf = requestAnimationFrame(loop); OC.audioRelease(); audioApply(); };
OC.stop = function(){ running = false; OC.running = false; OC.stoppedAt = now(); save(); OC.audioHold(); };
/* ---------- điều khiển ---------- */
function hitFish(w){ let best = null, bd = 1e9; for(const f of OC.fish){ const k = .74 + .36 * f.z, dx = (w.x - f.x), dy = (w.y - f.y), rx = Math.max(16, f.len * .55), ry = Math.max(14, f.len * (f.d.arch === 'fish' ? f.d.H * .5 : .42) + 6); const q = (dx / rx) ** 2 + (dy / ry) ** 2; if(q < 1 && q - f.z * .05 < bd){ bd = q; best = f; } } return best; }
function hitCoin(w){ for(const f of OC.fish) if(f.inc.acc > 0 && f.stg === 3 && Math.hypot(w.x - f.x, w.y - (f.y - f.len * .32 - 12)) < 16) return f; return null; }
function hitItem(w){ for(const it of OC.items) if(Math.hypot(w.x - it.x, w.y - it.y) < 28 * (it.size || 1)) return it; return null; }
function hitDeco(w){ for(let i = S.placed.length - 1; i >= 0; i--){ const p = S.placed[i], x = p.x * WW; if(Math.abs(w.x - x) < 55 && w.y > floorY(x) - 130 && w.y < floorY(x) + 30) return p; } return null; }
function bindInput(){
  const ptrs = new Map(); let down = null, pinch = null, feedT = 0;
  const pos = e => { const l = X && X.local ? X.local(e, canvas) : (() => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; })(); return { sx: l.x * (vw / l.w), sy: l.y * (vh / l.h) }; };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault(); OC.audioUnlock(); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); const p = pos(e); ptrs.set(e.pointerId, p);
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.sx - b.sx, a.sy - b.sy), z: OC.cam.z }; down = null; return; }
    const w = toWorld(p.sx, p.sy); OC.ptr.x = w.x; OC.ptr.y = w.y; OC.ptr.t = OC.t; OC.ptr.down = true; down = { sx: p.sx, sy: p.sy, w, t: performance.now(), moved: false, cam: { x: OC.cam.x, y: OC.cam.y }, fish: null, deco: null };
    const coin = hitCoin(w); if(coin){ OC.harvest(coin); down = null; return; } const it = hitItem(w); if(it){ OC.collect(it); down = null; return; }
    if(OC.mode === 'edit'){ down.deco = hitDeco(w); if(down.deco) return; }
    if(OC.mode === 'feed'){ OC.dropFood(w.x, w.y); feedT = 0; return; }
    if(OC.mode === 'place' && pendingPlace){ const o = OC.putDeco(pendingPlace.k, pendingPlace.id); if(o){ o.x = cl(w.x / WW, .04, .96); if(!(S.own[pendingPlace.k][pendingPlace.id] > 0)) { pendingPlace = null; OC.setMode('view'); } OC.ui.refresh && OC.ui.refresh('deco'); } return; }
    down.fish = hitFish(w); if(down.fish){ down.hold = setTimeout(() => { if(down && !down.moved && down.fish){ down.held = true; react(down.fish, 'hold'); down.fish.folT = 4; } }, 450); }
  });
  canvas.addEventListener('pointermove', e => {
    if(!ptrs.has(e.pointerId)) { const p = pos(e); const w = toWorld(p.sx, p.sy); OC.ptr.x = w.x; OC.ptr.y = w.y; OC.ptr.t = OC.t; return; } const p = pos(e); ptrs.set(e.pointerId, p);
    if(pinch && ptrs.size === 2){ const [a, b] = [...ptrs.values()], d = Math.hypot(a.sx - b.sx, a.sy - b.sy); const nz = pinch.z * d / pinch.d; OC.zoom(nz / OC.cam.z, (a.sx + b.sx) / 2, (a.sy + b.sy) / 2); return; }
    if(!down) return; const w = toWorld(p.sx, p.sy); OC.ptr.x = w.x; OC.ptr.y = w.y; OC.ptr.t = OC.t; const mv = Math.hypot(p.sx - down.sx, p.sy - down.sy); if(mv > 9){ down.moved = true; clearTimeout(down.hold); }
    if(OC.mode === 'edit' && down.deco){ down.deco.x = cl(w.x / WW, .03, .97); return; }
    if(OC.mode === 'feed'){ feedT += 1; if(feedT % 8 === 0) OC.dropFood(w.x, w.y); return; }
    if(down.fish && down.moved){ down.fish.folT = .6; down.fish.curT = 0; if(!down.dragged){ down.dragged = true; react(down.fish, 'tap'); } return; }
    if(down.moved && !down.fish){ const sc = scale(); OC.cam.x = down.cam.x - (p.sx - down.sx) / sc; OC.cam.y = down.cam.y - (p.sy - down.sy) / sc; clampCam(); }
  });
  const up = e => {
    ptrs.delete(e.pointerId); OC.ptr.down = false; if(ptrs.size < 2) pinch = null; if(!down) return; clearTimeout(down.hold); const d = down; down = null;
    if(OC.mode === 'edit' && d.deco){ queueSave(); return; }
    if(d.fish && !d.moved && !d.held){ const f = d.fish; const t = performance.now(); f.taps = (f.taps || []).filter(x => t - x < 1400); f.taps.push(t); OC.select(f); if(f.taps.length >= 5){ react(f, 'spam'); f.taps = []; OC.toast(`${f.name || f.d.n} không thích bị chọc liên tục`, 'warn'); } else react(f, 'tap'); }
    else if(!d.fish && !d.moved && OC.mode === 'view'){ OC.sel = null; OC.ui.select && OC.ui.select(null); part('ring', d.w.x, d.w.y); for(const f of OC.fish){ if(Math.hypot(f.x - d.w.x, f.y - d.w.y) < 130 && f.pers.includes('shy')){ f.fleeT = 1; } else if(Math.hypot(f.x - d.w.x, f.y - d.w.y) < 220 && (f.pers.includes('curious') || f.pers.includes('social'))){ f.curT = 2; } } sfx('plop'); OC.ptr.t = OC.t; }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); OC.zoom(e.deltaY < 0 ? 1.12 : .9, p.sx, p.sy); }, { passive: false });
}
OC.select = function(f){ OC.sel = f; OC.ui.select && OC.ui.select(f); sfx('ui'); };
OC.setMode = function(m){ OC.mode = m; if(m !== 'place') pendingPlace = null; OC.ui.refresh && OC.ui.refresh('mode'); };
OC.armPlace = function(k, id){ pendingPlace = { k, id }; OC.setMode('place'); };
OC.focus = function(f){ const sc = scale(); OC.cam.x = f.x - vw / sc / 2; OC.cam.y = f.y - vh / sc / 2; clampCam(); };
/* ---------- lưu / tải / ngoại tuyến ---------- */
const FK = ['id', 'sp', 'name', 'born', 'grow', 'hun', 'joy', 'hp', 'g', 'pers', 'fr', 'lock', 'fav', 'inc', 'cd', 'anc', 'gen', 'mut', 'boost', 'wasAdult', 'x', 'y', 'colT'];
const EK = ['id', 'sp', 'g', 'pers', 'anc', 'gen', 'mut', 'x', 'y', 'born', 'hatch', 'rare', 'r', 'col', 'col2'];
const pickKeys = (o, ks) => { const r = {}; for(const k of ks) r[k] = o[k]; return r; };
function save(){ if(!S || OC.noSave) return; try{ S.t = now(); const fo = [], eo = []; for(let i = 0; i < 4; i++){ for(const f of TK.fish[i]){ const o = pickKeys(f, FK); o.tk = i; fo.push(o); } for(const e of TK.eggs[i]){ const o = pickKeys(e, EK); o.tk = i; eo.push(o); } } const out = Object.assign({}, S, { fish: fo, eggs: eo, placed: TK.placed[0], tk: S.tk, tanks: S.tanks.map((t, i) => ({ n: t.n, th: t.th, breed: t.breed, placed: i ? TK.placed[i] : undefined })) }); localStorage.setItem(KEY, JSON.stringify(out)); OC.saveErr = false; }catch(e){ OC.saveErr = true; } }
let saveQ = 0; function queueSave(){ clearTimeout(saveQ); saveQ = setTimeout(save, 800); }
OC.save = save; OC.queueSave = queueSave;
OC.exportData = () => { save(); return localStorage.getItem(KEY) || ''; };
OC.importData = txt => { try{ const o = JSON.parse(txt); if(!o || o.v !== 1 || !Array.isArray(o.fish)) return false; try{ const cur = localStorage.getItem(KEY); if(cur) localStorage.setItem(KEY + '_prev', cur); }catch(e){} localStorage.setItem(KEY, txt); OC.noSave = true; return true; }catch(e){ return false; } };
OC.reset = () => { localStorage.removeItem(KEY); OC.noSave = true; OC.offline = null; };
/* ---------- tiến trình khi vắng mặt (đóng app / ẩn app / rời game) ---------- */
function applyOfflineOne(el){
  const t = now();
  const acc0 = OC.fish.reduce((s, f) => s + f.inc.acc, 0), ad0 = OC.fish.filter(f => stageOf(f) === 3).length;
  const steps = Math.min(240, Math.ceil(el / 30)), dt = el / steps;
  for(let i = 0; i < steps; i++) for(const f of OC.fish){ const care = f.hun > 25 && f.joy > 25 ? 1 : .5; f.grow = Math.min(100, f.grow + GROW_RATE(f) * dt * care); f.hun = Math.max(25, f.hun - .045 * dt * .5); f.joy = Math.max(25, f.joy - .008 * dt * .5); }
  for(const f of OC.fish){ f.stg = stageOf(f); if(f.stg === 3){ if(!f.wasAdult){ f.wasAdult = true; ev('adults'); } const iv = incMs(f.d, fishLevel(f)), n = Math.min(ECON.maxIncomeStack, Math.floor(el * 1000 / iv)); let add = 0; for(let i = 0; i < n; i++) add += incAmount(f); f.inc.acc = Math.min(f.inc.acc + add, incAmount(f) * ECON.maxIncomeStack); f.inc.n = t + iv; } f.len = baseLen(f); }
  for(const e of OC.eggs){ e.hatch -= el * 1000; e.born -= el * 1000; }
  const due = OC.eggs.filter(e => t >= e.hatch); due.forEach(hatchEgg);
  return { el, acc: OC.fish.reduce((s, f) => s + f.inc.acc, 0) - acc0, adults: OC.fish.filter(f => stageOf(f) === 3).length - ad0, hatched: due.length };
}
function applyOffline(el){
  el = Math.min(el, ECON.offlineCapH * 3600); if(!(el > 45)) return null; const r = { el, acc: 0, adults: 0, hatched: 0 };
  for(let i = 0; i < 4; i++){ const x = withTank(i, () => applyOfflineOne(el)); if(x){ r.acc += x.acc; r.adults += x.adults; r.hatched += x.hatched; } }
  return r;
}
OC.applyOffline = applyOffline;
function load(){
  let raw = null; try{ raw = localStorage.getItem(KEY); }catch(e){}
  if(!raw){ newState(); return; }
  try{ S = JSON.parse(raw); }catch(e){ newState(); return; }
  S.inv = S.inv || { food: {}, potion: {} }; S.own = S.own || { pl: {}, dc: {} }; autoFix(); S.set = Object.assign({ sfx: true, amb: true, mus: true, mvol: .5, trk: 0, vol: .6, q: 'auto', tm: ECON.timeMult, dn: 1, vib: true, parts: 1 }, S.set); S.q = S.q || { claimed: {}, day: '', cnt: {} }; S.col = S.col || {}; S.hyb = S.hyb || {}; S.phen = S.phen || {}; S.st = S.st || {}; S.ach = S.ach || {};
  { const t0 = Array.isArray(S.tanks) ? S.tanks : null, saved = !!t0; initTanks(S.placed || []);
    S.tanks.forEach((t, i) => { const o = t0 && t0[i]; if(o){ if(o.n) t.n = String(o.n).slice(0, 20); if(i === 0) t.breed = o.breed !== false; if(i > 0) TK.placed[i] = o.placed || []; } });
    S.tk = (t0 && S.tk >= 0 && S.tk < 4) ? S.tk | 0 : 0;
    for(const f of (S.fish || [])){ const i = f.tk >= 1 && f.tk <= 3 ? f.tk | 0 : 0; delete f.tk; rt(f); TK.fish[i].push(f); }
    for(const e of (S.eggs || [])){ const i = e.tk >= 1 && e.tk <= 3 ? e.tk | 0 : 0; delete e.tk; TK.eggs[i].push(e); }
    bindActive(); if(!saved) seedTanks(); }
  S.fish = []; S.eggs = []; OC.food = []; OC.items = [];
  const t = now(); const rep = applyOffline((t - (S.t || t)) / 1000); if(rep) OC.offline = rep;
  S.t = t;
}
/* ---------- khởi tạo ---------- */
OC.init = function(cv){
  canvas = cv; ctx = cv.getContext('2d'); load(); for(let i = 0; i < 50; i++) plankton.push({ x: rnd(WW), y: rnd(WH), vx: rnd(-6, 6), vy: rnd(-4, 3), r: rnd(.6, 1.8) });
  OC.booting = true; allFish().forEach(f => { markOwned(f.sp); }); OC.booting = false; rollDay(); if(!S.wx) pickWeather(); bindInput(); OC.checkQuests();
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => { if(document.hidden){ hiddenAt = now(); save(); OC.audioHold(); } else if(running) OC.audioRelease(); if(document.hidden){}  else if(hiddenAt){ const el = (now() - hiddenAt) / 1000; hiddenAt = 0; if(running && el > 45){ const rep = applyOffline(el); if(rep){ OC.offline = rep; OC.ui.offlineReport && OC.ui.offlineReport(); queueSave(); } } } });
  window.addEventListener('pagehide', () => { save(); OC.audioHold(); }); window.addEventListener('pageshow', () => { if(running) OC.audioRelease(); }); document.addEventListener('freeze', () => OC.audioHold());
};

/* ---------- quản lý hồ: chuyển hồ, bật/tắt sinh sản, chuyển cá, bán hàng loạt ---------- */
OC.tankIdx = () => S.tk; OC.allFish = allFish; OC.canBreed = canBreed;
OC.tankInfo = i => ({ i, n: S.tanks[i].n, th: S.tanks[i].th, breed: canBreed(i), locked: !!S.tanks[i].noBreed, fish: TK.fish[i].length, eggs: TK.eggs[i].length, cap: S.cap, cur: i === S.tk });
OC.setTank = function(i){
  i = +i; if(!(i >= 0 && i < 4) || i === S.tk) return; S.tk = i; bindActive(); OC.sel = null; OC.items = []; OC.food = []; OC.parts = []; OC.mode = 'view'; pendingPlace = null; OC.cam.z = 1; OC.cam.x = 0; OC.cam.y = 0; clampCam(); clampAll(); bgT = -9;
  queueSave(); sfx('plop'); OC.ui.refresh && OC.ui.refresh('all'); OC.ui.tankChanged && OC.ui.tankChanged();
};
OC.setBreed = function(i, on){
  i = +i; const t = S.tanks[i]; if(!t) return false; if(t.noBreed){ OC.toast('Hồ này không áp dụng tự động sinh sản / đẻ trứng', 'warn'); return false; }
  t.breed = !!on; if(!t.breed) withTank(i, () => { for(const f of OC.fish) if(f.pair){ f.pair = null; if(f.st === 'pair') f.st = 'wander'; } });
  log(`${t.n}: ${t.breed ? 'BẬT' : 'TẮT'} tự động sinh sản`); queueSave(); OC.ui.refresh && OC.ui.refresh('all'); return true;
};
OC.moveFish = function(list, dest){
  dest = +dest; if(!S.tanks[dest] || dest === S.tk) return 0; list = Array.from(new Set(list)).filter(f => OC.fish.indexOf(f) >= 0); if(!list.length) return 0;
  const room = S.cap - (TK.fish[dest].length + TK.eggs[dest].length); if(list.length > room){ OC.toast(room > 0 ? `${S.tanks[dest].n} chỉ còn ${room} chỗ trống, hãy chọn ít cá hơn` : `${S.tanks[dest].n} đã đầy`, 'err'); return 0; }
  const ids = new Set(list.map(f => f.id)), moved = [];
  for(const f of OC.fish) if(f.pair && ids.has(f.pair.with) && !ids.has(f.id)){ f.pair = null; if(f.st === 'pair') f.st = 'wander'; }
  for(const f of list){ const i = OC.fish.indexOf(f); if(i < 0) continue; OC.fish.splice(i, 1); f.pair = null; if(f.st === 'pair') f.st = 'wander'; const x = rnd(90, WW - 90); rt(f, x, rnd(110, Math.max(130, floorY(x) - 90))); f.fT = rnd(0, .4); TK.fish[dest].push(f); moved.push(f); }
  if(OC.sel && ids.has(OC.sel.id)) OC.sel = null;
  log(`Chuyển ${moved.length} cá sang ${S.tanks[dest].n}`); sfx('plop'); queueSave(); OC.ui.refresh && OC.ui.refresh('all'); return moved.length;
};
OC.sellMany = function(list){
  list = Array.from(new Set(list)).filter(f => OC.fish.indexOf(f) >= 0); const skip = list.filter(f => f.lock).length; list = list.filter(f => !f.lock); if(!list.length){ OC.toast(skip ? 'Các cá đã chọn đều đang khóa bảo vệ' : 'Chưa chọn cá nào', 'err'); return null; }
  let total = 0; for(const f of list){ total += sellPrice(f); const i = OC.fish.indexOf(f); if(i >= 0) OC.fish.splice(i, 1); if(OC.sel === f) OC.sel = null; }
  earn(total, 'sale'); ev('sold', list.length); log(`Bán ${list.length} cá: +${total} xu`); sfx('coin'); queueSave(); return { n: list.length, total, skipped: skip };
};
OC.mkFish = mkFish; OC.rt = rt; OC.hybridOf = hybridOf; OC.markOwned = markOwned; OC.randGenes = randGenes; OC.randPers = randPers; OC.WORLD = { WW, WH };
OC.pedigree = f => ({ self: { sp: f.sp, n: f.name, gen: f.gen }, anc: f.anc });
OC.feedFish = function(f){ if(!(S.inv.food[S.feedType] > 0)) return OC.toast('Hết thức ăn đang chọn', 'warn'); OC.dropFood(f.x + rnd(-10, 10), Math.max(30, f.y - 60)); OC.dropFood(f.x + rnd(-10, 10), Math.max(30, f.y - 50)); };
OC.rename = (f, n) => { f.name = String(n || '').trim().slice(0, 16); queueSave(); };
OC.toggleLock = f => { f.lock = !f.lock; queueSave(); }; OC.toggleFav = f => { f.fav = !f.fav; if(f.fav) f.lock = true; queueSave(); };
OC.ptrDrop = (x, y) => { OC.ptr.x = x; OC.ptr.y = y; OC.ptr.t = OC.t; };
OC.toast = (m, t) => OC.quiet ? 0 : OC.ui.toast ? OC.ui.toast(m, t) : 0;
})();
