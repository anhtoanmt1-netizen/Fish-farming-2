/* OCEAN LIFE – Bộ vẽ đồ họa: phong cách hình dán kawaii (viền trắng, mắt to, má hồng), hoạt ảnh thân uốn, vây, xúc tu */
(() => {
'use strict';
const OA = window.OA = {};
const TAU = Math.PI * 2, cl = (v, a, b) => Math.max(a, Math.min(b, v)), sin = Math.sin, cos = Math.cos;
/* ---------- màu ---------- */
const h2r = h => { h = h.replace('#', ''); if(h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const r2h = r => '#' + r.map(v => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
function r2hsl([r, g, b]){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0, l = (mx + mn) / 2; if(mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2r(h, s, l){ h = ((h % 360) + 360) % 360 / 360; if(!s) return [l * 255, l * 255, l * 255]; const f = (p, q, t) => { if(t < 0) t += 1; if(t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; }
const mix = (a, b, t) => { const A = h2r(a), B = h2r(b); return r2h(A.map((v, i) => v + (B[i] - v) * t)); };
const shade = (c, t) => t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#0a1030', -t);
const tint = (c, g, sat) => { if(!c || c === 'rainbow') return c; const [h, s, l] = r2hsl(h2r(c)); return r2h(hsl2r(h + (g.hue || 0), cl(s * (g.sat || 1) * sat, 0, 1), cl(l * (g.bri || 1), .04, .97))); };
const rgba = (c, a) => { const [r, g, b] = h2r(c); return `rgba(${r},${g},${b},${a})`; };
const rng = seed => { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
OA.mix = mix; OA.shade = shade; OA.rgba = rgba; OA.rng = rng; OA.tint = tint;
OA.G0 = () => ({ hue: 0, sat: 1, bri: 1, pat: null, patC: null, fin: 1, tail: 1, tails: 1, layers: 1, glow: 0, crystal: 0, horn: 0, spikes: 0, wings: 0, heads: 1, size: 1, crown: 0, foil: 0, rare: [] });
const MORPH = { len: [.42, .62, .82, 1], h: [1.35, 1.18, 1.06, 1], head: [1.5, 1.28, 1.1, 1], fin: [.55, .75, .92, 1], tail: [.6, .78, .92, 1], sat: [.5, .72, .9, 1], pat: [0, .4, .8, 1], gloss: [.25, .5, .8, 1] };
OA.lenOf = (d, g, stg) => d.L * (g.size || 1) * MORPH.len[stg];
const PROF = { t: [0, .55, .86, 1, .97, .84, .62, .38, .18], r: [0, .78, .98, 1, .96, .86, .68, .44, .22], l: [0, .5, .8, 1, 1, 1, .96, .8, .55] };
const prof = (a, s) => { const x = s * (a.length - 1), i = Math.min(a.length - 2, x | 0), f = x - i; return a[i] * (1 - f) + a[i + 1] * f; };
function pal(f){
  const d = f.d, g = f.g, key = (g.hue | 0) + ',' + g.sat + ',' + g.bri + ',' + f.stg + ',' + (g.patC || '') + ',' + d.id + ',' + (f.col || 0);
  if(f._pk === key) return f._pal;
  const s = MORPH.sat[f.stg] * (f.col ? 1.18 : 1);
  const P = { body: tint(d.c[0], g, s), belly: tint(d.c[1], g, s), fin: tint(d.c[2], g, s), pat: g.patC || tint(d.patC, g, 1) };
  P.edge = shade(P.body, -.5); P.fedge = shade(P.fin, -.4); P.hi = shade(P.body, .5);
  f._pk = key; f._pal = P; return P;
}
OA.pal = pal;
function smoothClosed(p, pts){
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]);
  p.moveTo(m0[0], m0[1]);
  for(let i = 0; i < n; i++){ const a = pts[i], b = pts[(i + 1) % n], m = mid(a, b); p.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  p.closePath();
}
/* ---------- đuôi ---------- */
function tailPath(style, tl, th, ph){
  const p = new Path2D(), rip = sin(ph * 1.3) * th * .22;
  switch(style){
    case 'fork': p.moveTo(0, 0); p.bezierCurveTo(tl * .3, -th * .5, tl * .8, -th * 1.1, tl, -th); p.quadraticCurveTo(tl * .72, 0, tl, th); p.bezierCurveTo(tl * .8, th * 1.1, tl * .3, th * .5, 0, 0); break;
    case 'veil': tl *= 1.3; th *= 1.1; p.moveTo(0, 0); p.bezierCurveTo(tl * .3, -th * .7, tl * .7, -th * 1.5 + rip, tl, -th * .8 + rip * .5); p.bezierCurveTo(tl * 1.06, -th * .2, tl * 1.1, th * .2, tl, th * .9 - rip * .5); p.bezierCurveTo(tl * .7, th * 1.5 - rip, tl * .3, th * .7, 0, 0); break;
    case 'round': p.ellipse(tl * .38, 0, tl * .5, th * .75, 0, 0, TAU); break;
    case 'sword': p.moveTo(0, 0); p.bezierCurveTo(tl * .3, -th * .4, tl * .6, -th * .9, tl * .7, -th * .7); p.quadraticCurveTo(tl * .85, 0, tl * .7, th * .6); p.lineTo(tl * 1.7, th * .75); p.lineTo(tl * .45, th * .25); p.closePath(); break;
    case 'flame': p.moveTo(0, 0); p.quadraticCurveTo(tl * .35, -th * .9, tl * .75, -th * 1.2 + rip); p.quadraticCurveTo(tl * .8, -th * .5, tl * 1.15, -th * .45); p.quadraticCurveTo(tl * .9, -th * .1, tl * 1.35, th * .1 - rip); p.quadraticCurveTo(tl * .85, th * .3, tl * 1.05, th * 1.0 + rip); p.quadraticCurveTo(tl * .5, th * .8, 0, 0); break;
    case 'squid': p.moveTo(0, 0); p.lineTo(tl * .55, -th * 1.2); p.lineTo(tl, 0); p.lineTo(tl * .55, th * 1.2); p.closePath(); break;
    case 'none': break;
    default: p.moveTo(0, 0); p.bezierCurveTo(tl * .35, -th * .4, tl * .8, -th * 1.1, tl, -th * .95); p.quadraticCurveTo(tl * 1.14, 0, tl, th * .95); p.bezierCurveTo(tl * .8, th * 1.1, tl * .35, th * .4, 0, 0);
  }
  return p;
}
/* ---------- vương miện ---------- */
const CROWN_COL = [null, '#cd7f32', '#d6dce6', '#ffd34d', '#bff0ff', 'rainbow', '#6a4cff', '#ffcf33', '#7fe0a0'];
OA.crown = function(c, tier, x, y, s, t){
  if(!tier) return; const col = CROWN_COL[tier]; c.save(); c.translate(x, y); c.scale(s, s);
  let fill = col;
  if(col === 'rainbow'){ const g = c.createLinearGradient(-1, 0, 1, 0); ['#ff5a5a', '#ffd34d', '#4dff9a', '#4dc8ff', '#b84dff'].forEach((k, i) => g.addColorStop(i / 4, k)); fill = g; }
  c.beginPath(); c.moveTo(-1, 0); c.lineTo(-1.1, -1.5); c.lineTo(-.5, -.8); c.lineTo(0, -1.9); c.lineTo(.5, -.8); c.lineTo(1.1, -1.5); c.lineTo(1, 0); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = .22; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.stroke(); c.lineWidth = .1; c.strokeStyle = '#6a4a10'; c.stroke();
  for(const [gx, gy, gc] of [[0, -.45, tier >= 7 ? '#ff4a6a' : '#7ad0ff'], [-.55, -.3, '#fff'], [.55, -.3, '#fff']]){ c.beginPath(); c.arc(gx, gy, .17, 0, TAU); c.fillStyle = gc; c.fill(); }
  if(tier >= 4){ const a = .5 + .5 * sin(t * 4); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(-.05, -2.4, .1, .9); c.fillRect(-.45, -1.95, .9, .1); }
  c.restore();
};
/* ---------- CÁ (khung chung) ---------- */
OA.fish = function(c, f, t){
  const d = f.d;
  if(d.arch !== 'fish') return SPECIAL[d.arch](c, f, t);
  const g = f.g, stg = f.stg, P = pal(f), lod = f.lod | 0, L = f.len, M = MORPH, fl = d.fl, sp = f.spd, ph = f.ph;
  const arr = d.H > .85 || d.tail === 'round' ? PROF.r : d.H < .25 ? PROF.l : PROF.t, Hh = L * d.H * .5 * M.h[stg] * (d.H > .85 ? .92 : 1);
  const crystal = fl.includes('c') || g.crystal, glow = fl.includes('g') || g.glow > 0, clear = fl.includes('x');
  c.save(); c.translate(f.x, f.y); if(f.pitch) c.rotate(f.pitch); c.scale(f.face, 1); if(f.al < 1) c.globalAlpha *= f.al;
  if(f.pulse){ const k = 1 + .08 * sin(t * 10); c.scale(k, k); }
  if(glow && lod < 1){ const gc = P.fin, a = (.2 + .1 * sin(t * 2 + f.id) + (g.glow || 0) * .25) * (f.gk || 1), gr = c.createRadialGradient(0, 0, L * .1, 0, 0, L * .85); gr.addColorStop(0, rgba(gc, a)); gr.addColorStop(1, rgba(gc, 0)); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, L * .85, 0, TAU); c.fill(); }
  if(L < 24 || lod === 2){ // LOD đơn giản
    c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, L * .5, Hh, 0, 0, TAU); c.fill(); c.fillStyle = P.fin; c.beginPath(); c.moveTo(-L * .45, 0); c.lineTo(-L * .85, -Hh); c.lineTo(-L * .85, Hh); c.closePath(); c.fill();
    c.fillStyle = '#123'; c.beginPath(); c.arc(L * .28, -Hh * .15, Math.max(1, L * .06), 0, TAU); c.fill(); c.restore(); return;
  }
  const amp = L * (.015 + .06 * sp), wy = s => sin(ph - s * 3.4) * amp * Math.pow(s, 1.25), N = 11, top = [], bot = [];
  for(let i = 0; i <= N; i++){ const s = i / N, x = L * (.5 - s), y = wy(s), h = Hh * prof(arr, s); top.push([x, y - h]); bot.push([x, y + h]); }
  const body = new Path2D(), pts = [[L * .5, wy(0)]]; for(let i = 1; i <= N; i++) pts.push(top[i]); for(let i = N; i >= 1; i--) pts.push(bot[i]); smoothClosed(body, pts);
  const ow = cl(L * .05, 2.2, 5), tx = -L * .5 + 1, ty = wy(1), tr = sin(ph - 3.4 + .9) * (.22 + .4 * sp);
  let tstyle = d.tail; if(g.tails === 3 || fl.includes('t')) tstyle = 'tri'; const tl = L * .36 * M.tail[stg] * (g.tail || 1), th = Hh * .95 * M.tail[stg];
  const layers = fl.includes('l') || g.layers > 1 ? 3 : 1;
  const drawTail = (fillPass) => {
    for(let k = layers - 1; k >= 0; k--){
      const kk = k === 0 ? 1 : 1 + k * .22;
      const variants = tstyle === 'tri' ? [-.5, 0, .5] : [0];
      for(const va of variants){
        c.save(); c.translate(tx, ty); c.rotate(tr * (1 + k * .4) + va * .9); c.scale(-kk * (tstyle === 'tri' ? .85 : 1), kk * (tstyle === 'tri' ? .85 : 1));
        const tp = tailPath(tstyle === 'tri' ? 'fan' : tstyle, tl, th, ph - k * .5);
        if(!fillPass){ c.stroke(tp); } else {
          let tfs = P.fin; if(!lod){ const gr = c.createLinearGradient(0, 0, tl * 1.3, 0); gr.addColorStop(0, P.fin); gr.addColorStop(1, shade(P.fin, .35 + k * .1)); tfs = gr; } c.fillStyle = tfs; c.globalAlpha *= clear ? .5 : (1 - k * .18); c.fill(tp); c.globalAlpha /= clear ? .5 : (1 - k * .18);
          c.lineWidth = 1.1; c.strokeStyle = P.fedge; c.stroke(tp);
          if(lod < 1){ c.strokeStyle = rgba(P.fedge, .35); c.lineWidth = .8; c.beginPath(); for(let q = -2; q <= 2; q++){ c.moveTo(0, 0); c.lineTo(tl * .95, q * th * .36); } c.stroke(); }
        }
        c.restore();
      }
    }
  };
  // vây lưng, vây ngực/bụng
  const fs = M.fin[stg] * (g.fin || 1), dorsal = new Path2D(), dh = Hh * (d.H > .85 ? 1.15 : .6) * fs, a = top[3], b = top[d.H > .85 ? 8 : 7];
  if(d.tail === 'feather'){ dorsal.moveTo(a[0], a[1]); dorsal.quadraticCurveTo(a[0] - L * .12, a[1] - dh * 1.9, b[0], b[1]); dorsal.closePath(); }
  else { dorsal.moveTo(a[0] + L * .05, a[1] + 1); dorsal.bezierCurveTo(a[0], a[1] - dh * 1.1, (a[0] + b[0]) / 2 - L * .03, a[1] - dh * 1.5, b[0] - (d.H > .85 ? L * .14 : 0), b[1] - (d.H > .85 ? dh * .8 : 0)); dorsal.lineTo(b[0], b[1] + 1); dorsal.closePath(); }
  let anal = null; if(d.H > .85){ anal = new Path2D(); const a2 = bot[3], b2 = bot[8]; anal.moveTo(a2[0] + L * .05, a2[1] - 1); anal.bezierCurveTo(a2[0], a2[1] + dh * 1.1, (a2[0] + b2[0]) / 2, a2[1] + dh * 1.4, b2[0] - L * .14, b2[1] + dh * .8); anal.lineTo(b2[0], b2[1] - 1); anal.closePath(); }
  const pf = L * (d.tail === 'feather' ? .2 : .1) * fs, pfx = L * .2, pfy = Hh * .25, pfr = .55 + sin(ph * 1.4 + 1) * .35;
  const pect = new Path2D(); pect.ellipse(0, 0, pf, pf * .5, 0, 0, TAU);
  // cánh/sừng/gai
  const wings = fl.includes('w') || g.wings, horn = fl.includes('h') || g.horn, spikes = fl.includes('k') || g.spikes;
  const wingP = wings ? (() => { const w = new Path2D(), fl2 = sin(ph * 1.3) * .35; w.moveTo(L * .12, -Hh * .5); w.bezierCurveTo(L * .05, -Hh * 2.4 - fl2 * Hh, -L * .3, -Hh * 2.9 - fl2 * Hh, -L * .42, -Hh * 1.2); w.quadraticCurveTo(-L * .2, -Hh * 1.2, -L * .15, -Hh * .5); w.closePath(); return w; })() : null;
  const hornP = horn ? (() => { const h = new Path2D(); h.moveTo(L * .38, -Hh * .5); h.lineTo(L * .72, -Hh * 1.55); h.lineTo(L * .5, -Hh * .35); h.closePath(); return h; })() : null;
  // 1) viền dán trắng
  c.lineJoin = 'round'; c.lineWidth = ow * 2; c.strokeStyle = '#fff'; c.fillStyle = '#fff'; drawTail(false); if(!lod){ if(wingP) c.stroke(wingP); c.stroke(dorsal); if(anal) c.stroke(anal); if(hornP) c.stroke(hornP);
  c.save(); c.translate(pfx, pfy); c.rotate(pfr); c.stroke(pect); c.restore(); } c.stroke(body);
  // 2) tô màu
  drawTail(true);
  if(wingP){ c.globalAlpha *= .6; c.fillStyle = shade(P.fin, .4); c.fill(wingP); c.globalAlpha /= .6; c.lineWidth = 1; c.strokeStyle = P.fedge; c.stroke(wingP); }
  const fa = clear ? .5 : .95;
  c.globalAlpha *= fa; c.fillStyle = P.fin; c.fill(dorsal); if(anal) c.fill(anal); c.globalAlpha /= fa; c.lineWidth = 1; c.strokeStyle = P.fedge; c.stroke(dorsal); if(anal) c.stroke(anal);
  if(d.tail === 'feather'){ c.strokeStyle = rgba(P.fedge, .55); c.lineWidth = .9; c.beginPath(); for(let q = 0; q < 6; q++){ c.moveTo(a[0] - q * L * .02, a[1]); c.lineTo(a[0] - L * .12 - q * L * .015, a[1] - dh * (1.4 - q * .08)); } c.stroke(); }
  // thân
  c.save(); c.globalAlpha *= crystal ? .78 : 1;
  let bgf = P.body; if(!lod){ const bg = c.createLinearGradient(0, -Hh, 0, Hh); bg.addColorStop(0, P.body); bg.addColorStop(.62, P.body); bg.addColorStop(1, P.belly); bgf = bg; } c.fillStyle = bgf; c.fill(body);
  c.restore();
  if(lod < 1){ c.save(); c.clip(body);
  const pa = M.pat[stg], pc = P.pat, rnd = rng(f.id * 7919 + 3), pat = g.pat || d.pat;
  if(pa > 0.01 && pat !== 'none'){
    c.globalAlpha *= pa;
    if(pat === 'bands'){ for(const s of [.22, .48, .72]){ const x = L * (.5 - s); c.fillStyle = pc; c.beginPath(); c.moveTo(x + L * .035, -Hh * 1.2); c.lineTo(x - L * .035, -Hh * 1.2); c.lineTo(x - L * .045, Hh * 1.2); c.lineTo(x + L * .025, Hh * 1.2); c.fill(); c.strokeStyle = shade(P.body, -.5); c.lineWidth = 1; c.stroke(); } }
    else if(pat === 'stripe'){ c.fillStyle = pc; c.beginPath(); c.moveTo(L * .3, -Hh * .12); c.quadraticCurveTo(0, -Hh * .3, -L * .5, -Hh * .08); c.lineTo(-L * .5, Hh * .18); c.quadraticCurveTo(0, Hh * .02, L * .3, Hh * .12); c.fill(); }
    else if(pat === 'spots'){ c.fillStyle = pc; for(let i = 0; i < 9; i++){ c.beginPath(); c.arc(L * (.35 - rnd() * .8), Hh * (rnd() * 1.4 - .7), Hh * (.07 + rnd() * .1), 0, TAU); c.fill(); } }
    else if(pat === 'scales'){ c.strokeStyle = rgba(pc, .7); c.lineWidth = .9; const sz = Math.max(4, L * .07); for(let r = -2; r <= 2; r++) for(let q = 0; q < 9; q++){ const x = L * .4 - q * sz * 1.35 + (r & 1) * sz * .65, y = r * sz * .8; c.beginPath(); c.arc(x, y, sz * .6, .2, Math.PI - .2); c.stroke(); } }
    else if(pat === 'galaxy'){ const gr = c.createRadialGradient(-L * .05, 0, 2, 0, 0, L * .5); gr.addColorStop(0, rgba(P.belly, .85)); gr.addColorStop(.6, rgba(P.fin, .45)); gr.addColorStop(1, rgba(P.body, 0)); c.fillStyle = gr; c.fillRect(-L * .6, -Hh * 1.2, L * 1.2, Hh * 2.4); c.fillStyle = '#fff'; for(let i = 0; i < 14; i++){ c.globalAlpha = pa * (.35 + .65 * Math.abs(sin(t * 2 + i))); c.beginPath(); c.arc(L * (.45 - rnd() * .9), Hh * (rnd() * 1.8 - .9), .8 + rnd() * 1.3, 0, TAU); c.fill(); } }
    else if(pat === 'rainbow'){ const gr = c.createLinearGradient(L * .5, 0, -L * .5, 0); ['#ff6a8a', '#ffb04d', '#ffe14d', '#6aff9a', '#4dc8ff', '#b84dff'].forEach((k, i) => gr.addColorStop(i / 5, k)); c.globalAlpha = pa * .55; c.fillStyle = gr; c.fillRect(-L * .6, -Hh * 1.2, L * 1.2, Hh * 2.4); }
    c.globalAlpha = 1;
  }
  if(g.foil || g.rare.length){ const sw = ((t * .4 + f.id * .13) % 1.4 - .2) * L * 1.2 - L * .6, gr = c.createLinearGradient(sw - L * .15, -Hh, sw + L * .15, Hh); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(-L * .6, -Hh * 1.2, L * 1.2, Hh * 2.4); }
  if(crystal){ c.globalAlpha = .5; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(L * .3, -Hh * .8); c.lineTo(L * .05, -Hh * .1); c.lineTo(L * .12, Hh * .7); c.lineTo(-L * .2, Hh * .2); c.closePath(); c.fill(); c.globalAlpha = 1; }
  c.fillStyle = `rgba(255,255,255,${.38 * M.gloss[stg]})`; c.beginPath(); c.ellipse(L * .1, -Hh * .5, L * .2, Hh * .13, -.08, 0, TAU); c.fill();
  c.restore(); }
  c.lineWidth = 1.3; c.strokeStyle = P.edge; c.stroke(body);
  if(hornP){ const hg = c.createLinearGradient(L * .4, -Hh * .5, L * .72, -Hh * 1.5); hg.addColorStop(0, '#fff'); hg.addColorStop(1, '#bfe8ff'); c.fillStyle = hg; c.fill(hornP); c.lineWidth = 1; c.strokeStyle = '#7ab8e0'; c.stroke(hornP); }
  if(spikes){ c.fillStyle = fl.includes('g') ? '#fff7a0' : P.fedge; c.strokeStyle = '#fff'; c.lineWidth = .8; for(let i = 1; i < 9; i++){ const p = top[i], q = bot[i], k = Math.max(3, L * .05); for(const [pp, dir] of [[p, -1], [q, 1]]){ c.beginPath(); c.moveTo(pp[0] - k * .5, pp[1]); c.lineTo(pp[0], pp[1] + dir * k * 1.2); c.lineTo(pp[0] + k * .5, pp[1]); c.closePath(); c.fill(); } } }
  // vây ngực & bụng gần
  c.save(); c.translate(pfx, pfy); c.rotate(pfr); c.globalAlpha *= clear ? .55 : .95; c.fillStyle = P.fin; c.fill(pect); c.lineWidth = 1; c.strokeStyle = P.fedge; c.stroke(pect); c.restore();
  // mang
  if(!lod){ c.strokeStyle = rgba(P.edge, .55); c.lineWidth = 1.2; c.beginPath(); const gx = L * (.5 - .32), gm = f.gill * Hh * .12; c.moveTo(gx, -Hh * .6); c.quadraticCurveTo(gx - L * .05 - gm, 0, gx, Hh * .6); c.stroke(); }
  // đầu thứ hai
  if(fl.includes('d') || g.heads === 2){ const hx = L * .12, hy = -Hh * 1.05, hr = Hh * .62; c.fillStyle = '#fff'; c.beginPath(); c.arc(hx, hy, hr + ow, 0, TAU); c.fill(); c.fillStyle = P.body; c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.fill(); c.lineWidth = 1.2; c.strokeStyle = P.edge; c.stroke(); eye(c, hx + hr * .35, hy - hr * .1, hr * .45, f, t, 0); }
  // mắt, má hồng, miệng
  const er = cl(Hh * .34 * M.head[stg], 2.6, 15), ex = L * .5 - L * .2 - er * .15, ey = -Hh * .16;
  eye(c, ex, ey, er, f, t, 1);
  if(!lod){ c.fillStyle = 'rgba(255,110,150,.45)'; c.beginPath(); c.ellipse(ex - er * .55, ey + er * 1.55, er * .6, er * .33, 0, 0, TAU); c.fill(); }
  c.strokeStyle = '#5a2a2a'; c.lineWidth = 1.3; c.beginPath(); const mx = L * .5 - 1.5, my = Hh * .2;
  if(lod){} else if(f.mouth > .1){ c.fillStyle = '#c03a52'; c.ellipse(mx - er * .15, my, er * .26, er * .2 * f.mouth + .5, 0, 0, TAU); c.fill(); } else { c.arc(mx - er * .55, my - er * .2, er * .45, .35, 1.6); c.stroke(); }
  if(g.crown || fl.includes('r')) OA.crown(c, g.crown || 2, L * .3, -Hh * (.95 + (d.H > .85 ? .1 : 0)), Math.max(5, L * .095), t);
  if(f.fav){ c.fillStyle = '#ff4a8a'; c.font = Math.max(10, L * .18) + 'px sans-serif'; c.fillText('♥', -L * .05, -Hh * 1.5); }
  c.restore();
};
function eye(c, x, y, r, f, t, big){
  const bl = f.bl; c.save(); c.translate(x, y); c.scale(1, Math.max(.06, bl));
  if(f.mood === 'sleep'){ c.restore(); c.strokeStyle = '#2a2a4a'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y + r * .1, r * .7, .2, Math.PI - .2); c.stroke(); return; }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(40,40,70,.5)'; c.stroke();
  const lx = (f.lx || 0) * r * .22, ly = (f.ly || 0) * r * .22; c.fillStyle = '#1e2144'; c.beginPath(); c.arc(lx + r * .06, ly, r * .7, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(lx - r * .08, ly - r * .28, r * .26, 0, TAU); c.fill(); c.beginPath(); c.arc(lx + r * .26, ly + r * .22, r * .12, 0, TAU); c.fill();
  if(f.mood === 'angry'){ c.restore(); c.strokeStyle = '#3a1a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r, y - r * 1.1); c.lineTo(x + r * .8, y - r * .6); c.stroke(); return; }
  c.restore();
}
/* ---------- SINH VẬT ĐẶC BIỆT ---------- */
function stick(c, P, ow){ c.lineJoin = 'round'; c.lineCap = 'round'; }
function face(c, x, y, r, f, P, smile = 1){
  eye(c, x - r * .55, y, r * .38, f, 0, 1); eye(c, x + r * .55, y, r * .38, f, 0, 1);
  c.fillStyle = 'rgba(255,110,150,.5)'; for(const s of [-1, 1]){ c.beginPath(); c.ellipse(x + s * r * 1.0, y + r * .5, r * .22, r * .14, 0, 0, TAU); c.fill(); }
  c.strokeStyle = '#5a2a2a'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y + r * .22, r * .22 * smile, .2, Math.PI - .2); c.stroke();
}
function wiggle(c, pts, w, col, outline){ // vẽ đường dày có viền trắng
  const path = new Path2D(); path.moveTo(pts[0][0], pts[0][1]); for(let i = 1; i < pts.length - 1; i++){ const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#fff'; c.lineWidth = w + outline * 2; c.stroke(path); c.strokeStyle = col; c.lineWidth = w; c.stroke(path);
}
const SPECIAL = {
  jelly(c, f, t){
    const P = pal(f), r = f.len * .5 * (1 + .07 * sin(f.ph * 1.3)) * (.6 + .4 * MORPH.len[f.stg]), ow = 3; c.save(); c.translate(f.x, f.y); if(f.pitch) c.rotate(f.pitch * .5); if(f.al < 1) c.globalAlpha *= f.al;
    const gc = c.createRadialGradient(0, 0, 2, 0, 0, r * 1.6); gc.addColorStop(0, rgba(P.body, .35)); gc.addColorStop(1, rgba(P.body, 0)); c.fillStyle = gc; c.beginPath(); c.arc(0, 0, r * 1.6, 0, TAU); c.fill();
    for(let i = 0; i < 7; i++){ const x0 = -r * .72 + i * r * .24, pts = []; for(let k = 0; k <= 6; k++){ const s = k / 6; pts.push([x0 + sin(f.ph * .9 + i * 1.3 - s * 3) * r * .28 * s, r * .12 + s * r * (1.0 + (i & 1) * .5)]); } wiggle(c, pts, Math.max(2, r * .08), rgba(P.fin, .85), 2); }
    const b = new Path2D(); b.moveTo(-r, r * .1); b.bezierCurveTo(-r, -r * 1.35, r, -r * 1.35, r, r * .1); for(let i = 5; i >= 0; i--){ const x = -r + (i + .5) * r * 2 / 6; b.quadraticCurveTo(x + r / 6, r * .32, x - r / 6 + r * .0, r * .1); } b.closePath();
    c.lineJoin = 'round'; c.lineWidth = ow * 2; c.strokeStyle = '#fff'; c.stroke(b); const gr = c.createLinearGradient(0, -r, 0, r * .3); gr.addColorStop(0, rgba(shade(P.body, .35), .95)); gr.addColorStop(1, rgba(P.body, .85)); c.fillStyle = gr; c.fill(b); c.lineWidth = 1.2; c.strokeStyle = P.edge; c.stroke(b);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * .35, -r * .65, r * .22, r * .1, -.5, 0, TAU); c.fill(); face(c, 0, -r * .3, r * .55, f, P); c.restore();
  },
  octo(c, f, t){
    const P = pal(f), r = f.len * .34 * (.6 + .4 * MORPH.len[f.stg]); c.save(); c.translate(f.x, f.y); if(f.al < 1) c.globalAlpha *= f.al;
    for(let i = 0; i < 8; i++){ const bx = -r * .85 + i * r * .243, pts = []; for(let k = 0; k <= 8; k++){ const s = k / 8; pts.push([bx + (bx / r) * s * r * .5 + sin(f.ph * 1.1 + i * .9 + s * 3.2) * r * .38 * s, r * .5 + s * r * 1.5]); } wiggle(c, pts, Math.max(3, r * .3), P.fin, 2.4);
      c.fillStyle = rgba(P.belly, .7); for(let k = 2; k < 8; k += 2){ c.beginPath(); c.arc(pts[k][0], pts[k][1], Math.max(.8, r * .06), 0, TAU); c.fill(); } }
    const hp = new Path2D(); hp.ellipse(0, 0, r * 1.05, r * 1.12, 0, 0, TAU); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(hp); const gr = c.createRadialGradient(-r * .3, -r * .4, 2, 0, 0, r * 1.2); gr.addColorStop(0, shade(P.body, .35)); gr.addColorStop(1, P.body); c.fillStyle = gr; c.fill(hp); c.lineWidth = 1.2; c.strokeStyle = P.edge; c.stroke(hp);
    c.fillStyle = rgba(P.pat, .5); for(let i = 0; i < 6; i++){ c.beginPath(); c.arc(r * (-.5 + (i % 3) * .5), -r * (.7 - (i / 3 | 0) * .2), r * .07, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-r * .4, -r * .6, r * .25, r * .12, -.5, 0, TAU); c.fill(); face(c, 0, r * .05, r * .72, f, P); c.restore();
  },
  crab(c, f, t){
    const P = pal(f), w = f.len * .5 * (.6 + .4 * MORPH.len[f.stg]), sh = d => d; c.save(); c.translate(f.x, f.y); if(f.al < 1) c.globalAlpha *= f.al;
    const sw = sin(f.ph * 2), legs = new Path2D(); for(const s of [-1, 1]) for(let i = 0; i < 3; i++){ const bx = s * w * .5, by = w * (.15 + i * .13), kx = s * w * (.95 + i * .08), ky = w * (.5 + i * .2 + sw * .06 * (i & 1 ? 1 : -1)); legs.moveTo(bx, by); legs.lineTo(kx, ky - w * .2); legs.lineTo(kx + s * w * .12, ky + w * .22); }
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#fff'; c.lineWidth = w * .17 + 4; c.stroke(legs); c.strokeStyle = P.fin; c.lineWidth = w * .17; c.stroke(legs);
    for(const s of [-1, 1]){ const ang = sin(f.ph * 1.6 + (s > 0 ? 1.5 : 0)) * .2, ax = s * w * .85, ay = -w * .1, cx2 = s * w * 1.18, cy2 = -w * (.55 + ang * .6); wiggle(c, [[s * w * .6, w * .05], [ax, ay], [cx2, cy2 + w * .25]], w * .16, P.fin, 2);
      const cp = new Path2D(); cp.ellipse(cx2, cy2, w * .3, w * .24, s * .6, 0, TAU); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(cp); c.fillStyle = P.fin; c.fill(cp); c.lineWidth = 1.2; c.strokeStyle = P.fedge; c.stroke(cp);
      c.fillStyle = shade(P.body, -.3); c.beginPath(); c.moveTo(cx2 + s * w * .05, cy2 - w * .26); c.lineTo(cx2 - s * w * .06, cy2 - w * .02); c.lineTo(cx2 + s * w * .22, cy2 - w * .05); c.closePath(); c.fill();
      wiggle(c, [[s * w * .28, -w * .4], [s * w * .28, -w * .78]], w * .05, P.edge, 1.5); }
    const cp = new Path2D(); cp.ellipse(0, 0, w, w * .64, 0, 0, TAU); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(cp); const gr = c.createLinearGradient(0, -w * .6, 0, w * .6); gr.addColorStop(0, shade(P.body, .25)); gr.addColorStop(1, P.body); c.fillStyle = gr; c.fill(cp); c.lineWidth = 1.2; c.strokeStyle = P.edge; c.stroke(cp);
    c.fillStyle = rgba(P.belly, .6); for(let i = 0; i < 5; i++){ c.beginPath(); c.arc(w * (-.55 + i * .28), w * (.28 - (i % 2) * .08), w * .05, 0, TAU); c.fill(); }
    for(const s of [-1, 1]){ c.fillStyle = '#fff'; c.beginPath(); c.arc(s * w * .28, -w * .8, w * .17, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = '#345'; c.stroke(); c.fillStyle = '#1e2144'; c.beginPath(); c.arc(s * w * .28, -w * .78, w * .11, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(s * w * .25, -w * .82, w * .04, 0, TAU); c.fill(); }
    c.strokeStyle = '#5a2a2a'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, w * .08, w * .17, .2, Math.PI - .2); c.stroke(); c.fillStyle = 'rgba(255,110,150,.5)'; for(const s of [-1, 1]){ c.beginPath(); c.ellipse(s * w * .5, w * .15, w * .13, w * .08, 0, 0, TAU); c.fill(); } c.restore();
  },
  shrimp(c, f, t){
    const P = pal(f), L = f.len * (.6 + .4 * MORPH.len[f.stg]); c.save(); c.translate(f.x, f.y); c.scale(f.face, 1); if(f.al < 1) c.globalAlpha *= f.al;
    const seg = []; for(let i = 0; i < 7; i++){ const s = i / 6; seg.push([L * (.4 - s * .8), -sin(s * 2.6) * L * .18 + sin(f.ph - s * 3) * L * .03 * s + L * .05, L * (.17 - s * .075)]); }
    for(const a of [-1, 1]) wiggle(c, [[L * .38, -L * .08], [L * .62, -L * (.14 + a * .1) + sin(f.ph + a) * 3], [L * .85, -L * (.2 + a * .2)]], 1.6, P.edge, 1.4);
    const tl = seg[6]; c.save(); c.translate(tl[0], tl[1]); c.rotate(.5 + sin(f.ph) * .2); for(const a of [-.5, 0, .5]){ c.save(); c.rotate(a); const tp = new Path2D(); tp.ellipse(-L * .1, 0, L * .12, L * .06, 0, 0, TAU); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(tp); c.fillStyle = P.fin; c.fill(tp); c.restore(); } c.restore();
    for(let i = 6; i >= 0; i--){ const s = seg[i], p = new Path2D(); p.arc(s[0], s[1], s[2], 0, TAU); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(p); c.fillStyle = i % 2 ? P.body : shade(P.body, .12); c.fill(p); c.lineWidth = 1; c.strokeStyle = P.edge; c.stroke(p); }
    const hd = seg[0]; eye(c, hd[0] + hd[2] * .45, hd[1] - hd[2] * .1, hd[2] * .42, f, t, 1); c.fillStyle = 'rgba(255,110,150,.45)'; c.beginPath(); c.ellipse(hd[0] + hd[2] * .2, hd[1] + hd[2] * .5, hd[2] * .25, hd[2] * .14, 0, 0, TAU); c.fill(); c.restore();
  },
  star(c, f, t){
    const P = pal(f), R = f.len * .5 * (.6 + .4 * MORPH.len[f.stg]); c.save(); c.translate(f.x, f.y); c.rotate(sin(f.ph * .5) * .12 + (f.rot || 0)); if(f.al < 1) c.globalAlpha *= f.al;
    const p = new Path2D(); for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, r = (i & 1 ? R * .5 : R * (1 + .04 * sin(f.ph + i))); const x = cos(a) * r, y = sin(a) * r; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath();
    c.lineJoin = 'round'; c.lineWidth = R * .3 + 6; c.strokeStyle = '#fff'; c.stroke(p); c.fillStyle = P.body; c.fill(p); c.lineWidth = R * .3; c.strokeStyle = P.body; c.stroke(p); c.lineWidth = 1; c.strokeStyle = P.edge; c.stroke(p);
    c.fillStyle = rgba(P.pat, .7); for(let i = 0; i < 5; i++){ const a = -Math.PI / 2 + i * TAU / 5; for(const k of [.55, .8]){ c.beginPath(); c.arc(cos(a) * R * k, sin(a) * R * k, R * .05, 0, TAU); c.fill(); } }
    face(c, 0, -R * .05, R * .42, f, P); c.restore();
  },
  cuc(c, f, t){
    const P = pal(f), L = f.len * (.6 + .4 * MORPH.len[f.stg]); c.save(); c.translate(f.x, f.y); c.scale(f.face, 1); if(f.al < 1) c.globalAlpha *= f.al;
    const w = sin(f.ph) * L * .03, p = new Path2D(); p.moveTo(L * .45, 0); p.bezierCurveTo(L * .4, -L * .26 + w, -L * .3, -L * .3, -L * .5, -L * .05 + w); p.bezierCurveTo(-L * .55, L * .1, -L * .3, L * .22, 0, L * .2); p.bezierCurveTo(L * .3, L * .2, L * .5, L * .12, L * .45, 0); p.closePath();
    c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(p); c.fillStyle = P.body; c.fill(p); c.lineWidth = 1.2; c.strokeStyle = P.edge; c.stroke(p);
    c.fillStyle = P.fin; for(let i = 0; i < 6; i++){ c.beginPath(); c.ellipse(L * (.3 - i * .13), -L * (.2 - Math.abs(i - 2.5) * .02), L * .035, L * .06, .1 * (i - 2.5), 0, TAU); c.fill(); }
    for(let i = 0; i < 4; i++) wiggle(c, [[L * .45, -L * .02 + i * L * .03], [L * .54, -L * .05 + i * L * .035 + sin(f.ph * 2 + i) * 2], [L * .58, i * L * .04]], 2.4, P.belly, 1.4);
    eye(c, L * .28, -L * .05, L * .06, f, t, 1); c.fillStyle = 'rgba(255,110,150,.45)'; c.beginPath(); c.ellipse(L * .22, L * .03, L * .035, L * .02, 0, 0, TAU); c.fill(); c.restore();
  },
  ray(c, f, t){
    const P = pal(f), L = f.len * (.6 + .4 * MORPH.len[f.stg]), w = L * .5, fp = sin(f.ph * .9) * .3; c.save(); c.translate(f.x, f.y); if(f.pitch) c.rotate(f.pitch); c.scale(f.face, 1); if(f.al < 1) c.globalAlpha *= f.al;
    wiggle(c, [[-w * .5, 0], [-w * .9, sin(f.ph) * 6], [-w * 1.4, sin(f.ph - 1) * 12]], 3, P.fin, 1.6);
    const p = new Path2D(); p.moveTo(w, 0); p.bezierCurveTo(w * .55, -L * .18 * (1 + fp), -w * .1, -L * .38 * (1 + fp), -w * .55, -L * .3 * (1 + fp)); p.quadraticCurveTo(-w * .7, -L * .05, -w * .62, 0); p.quadraticCurveTo(-w * .7, L * .05, -w * .55, L * .3 * (1 + fp)); p.bezierCurveTo(-w * .1, L * .38 * (1 + fp), w * .55, L * .18 * (1 + fp), w, 0); p.closePath();
    c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(p); const gr = c.createLinearGradient(0, -L * .3, 0, L * .3); gr.addColorStop(0, P.body); gr.addColorStop(.7, P.body); gr.addColorStop(1, P.belly); c.fillStyle = gr; c.fill(p); c.lineWidth = 1.3; c.strokeStyle = P.edge; c.stroke(p);
    c.save(); c.clip(p); c.fillStyle = rgba(P.pat, .75); const rn = rng(f.id); for(let i = 0; i < 14; i++){ c.beginPath(); c.arc(w * (.6 - rn() * 1.2), L * (rn() * .5 - .25), 1.5 + rn() * 2.2, 0, TAU); c.fill(); } c.restore();
    eye(c, w * .5, -L * .03, L * .055, f, t, 1); c.fillStyle = 'rgba(255,110,150,.45)'; c.beginPath(); c.ellipse(w * .42, L * .04, L * .04, L * .022, 0, 0, TAU); c.fill(); c.strokeStyle = '#5a2a2a'; c.lineWidth = 1.3; c.beginPath(); c.arc(w * .82, L * .02, L * .04, .4, 2.4); c.stroke(); c.restore();
  },
  horse(c, f, t){ horse(c, f, t, false); }, dragon(c, f, t){ horse(c, f, t, true); }
};
function horse(c, f, t, dragon){
  const P = pal(f), L = f.len * (.65 + .35 * MORPH.len[f.stg]), ph = f.ph; c.save(); c.translate(f.x, f.y); c.scale(f.face, 1); if(f.al < 1) c.globalAlpha *= f.al;
  const pts = [], N = 22; let cx0 = 0, cy0 = 0;
  for(let i = 0; i <= N; i++){ const u = i / N; let x, y; if(u < .55){ x = L * .09 * sin(u * 3.1 + ph * .4) - u * L * .1; y = -L * .5 + u * L * .98; } else { if(!cx0){ cx0 = pts[Math.floor(N * .55)][0] - L * .15; cy0 = pts[Math.floor(N * .55)][1] + L * .1; } const a = .35 + (u - .55) / .45 * 4.4, rr = L * .17 * (1 - (u - .55) / .45 * .75); x = cx0 + cos(a) * rr; y = cy0 + sin(a) * rr; } pts.push([x, y, L * (u < .08 ? .1 : u < .25 ? .075 + (u - .08) * .3 : u < .55 ? .13 - (u - .25) * .12 : .09 - (u - .55) * .18)]); }
  const fin = new Path2D(); const fb = pts[9]; fin.moveTo(fb[0] - fb[2] * .8, fb[1] - L * .08); fin.quadraticCurveTo(fb[0] - L * .22, fb[1] + sin(ph * 3) * 6, fb[0] - fb[2] * .8, fb[1] + L * .1); fin.closePath(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(fin); c.globalAlpha *= .85; c.fillStyle = P.fin; c.fill(fin); c.globalAlpha /= .85;
  if(dragon){ c.fillStyle = P.fin; c.strokeStyle = '#fff'; c.lineWidth = 2; for(let i = 3; i < 16; i += 3){ const p = pts[i], k = L * .09, s = sin(ph * 1.2 + i); c.beginPath(); c.ellipse(p[0] - p[2] - k * .5, p[1] + s * 2, k, k * .45, -.7 + s * .3, 0, TAU); c.fill(); c.stroke(); } }
  for(const pass of [0, 1]) for(let i = N; i >= 0; i--){ const p = pts[i]; c.beginPath(); c.arc(p[0], p[1], p[2] + (pass ? 0 : 3.2), 0, TAU); c.fillStyle = pass ? (i % 4 === 0 ? shade(P.body, -.12) : P.body) : '#fff'; c.fill(); }
  const h = pts[0], sn = new Path2D(); sn.moveTo(h[0] + h[2] * .6, h[1] - h[2] * .3); sn.lineTo(h[0] + L * .27, h[1] + L * .03); sn.lineTo(h[0] + h[2] * .5, h[1] + h[2] * .6); sn.closePath(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(sn); c.fillStyle = P.body; c.fill(sn); c.lineWidth = 1; c.strokeStyle = P.edge; c.stroke(sn);
  c.fillStyle = P.belly; c.beginPath(); c.ellipse(pts[7][0] + pts[7][2] * .55, pts[7][1], pts[7][2] * .55, pts[7][2] * 1.2, 0, 0, TAU); c.fill();
  c.fillStyle = rgba(P.pat, .7); for(let i = 4; i < 17; i += 3){ c.beginPath(); c.arc(pts[i][0] - pts[i][2] * .2, pts[i][1], 2, 0, TAU); c.fill(); }
  eye(c, h[0] + h[2] * .35, h[1] - h[2] * .1, h[2] * .45, f, t, 1); c.fillStyle = 'rgba(255,110,150,.45)'; c.beginPath(); c.ellipse(h[0] + h[2] * .2, h[1] + h[2] * .55, h[2] * .3, h[2] * .17, 0, 0, TAU); c.fill();
  c.fillStyle = shade(P.fin, .1); for(let i = 0; i < 3; i++){ c.beginPath(); c.moveTo(h[0] - h[2] * .5 + i * h[2] * .3, h[1] - h[2] * .85); c.lineTo(h[0] - h[2] * .6 + i * h[2] * .3, h[1] - h[2] * 1.5); c.lineTo(h[0] - h[2] * .1 + i * h[2] * .3, h[1] - h[2] * .85); c.fill(); }
  c.restore();
}
/* ---------- TRỨNG ---------- */
OA.egg = function(c, e, t){
  const r = e.r || 12, prog = e.prog || 0, wob = prog > .75 ? sin(t * 18) * (prog - .75) * .5 : sin(t * 2 + e.id) * .05; c.save(); c.translate(e.x, e.y); c.rotate(wob);
  const col = e.col || '#ffeedd', p = new Path2D(); p.ellipse(0, 0, r * .78, r, 0, 0, TAU);
  c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(p); const gr = c.createRadialGradient(-r * .25, -r * .35, 1, 0, 0, r); gr.addColorStop(0, '#fff'); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, -.2)); c.fillStyle = gr; c.fill(p); c.lineWidth = 1.2; c.strokeStyle = shade(col, -.45); c.stroke(p);
  const rn = rng(e.id * 31); c.fillStyle = rgba(e.col2 || '#ffb0c0', .6); for(let i = 0; i < 5; i++){ c.beginPath(); c.arc(r * (rn() * 1 - .5), r * (rn() * 1.4 - .7), r * .09, 0, TAU); c.fill(); }
  if(e.rare){ c.strokeStyle = `rgba(255,240,150,${.4 + .4 * sin(t * 4)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, r * 1.05, r * 1.25, 0, 0, TAU); c.stroke(); }
  if(prog > .6){ c.strokeStyle = 'rgba(70,40,30,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r * .3, -r * .1); c.lineTo(-r * .05, r * .05); c.lineTo(r * .1, -r * .12); c.lineTo(r * .35, r * .08); c.stroke(); }
  c.restore();
};
/* ---------- THỰC VẬT ---------- */
OA.plant = function(c, p, t, sway){
  const d = p.d, h = p.h, w = p.w || h * .5, s = sway, rn = rng(p.id * 977 + 5), [c1, c2] = d.c, rb = c1 === 'rainbow'; c.save(); c.translate(p.x, p.y);
  const col = (i, n) => rb ? `hsl(${(i / n * 330 + t * 20) % 360},85%,62%)` : c1, col2 = rb ? '#fff' : c2;
  const grad = (x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c1 === 'rainbow' ? '#ff7ad1' : c1); g.addColorStop(1, c2 === 'rainbow' ? '#4dd2ff' : c2); return g; };
  if(d.glow){ const a = .18 + .1 * sin(t * 2 + p.id); const gr = c.createRadialGradient(0, -h * .5, 2, 0, -h * .5, h * .9); gr.addColorStop(0, rgba(rb ? '#ff7ad1' : c2, a)); gr.addColorStop(1, rgba(rb ? '#ff7ad1' : c2, 0)); c.fillStyle = gr; c.beginPath(); c.arc(0, -h * .5, h * .9, 0, TAU); c.fill(); }
  c.lineJoin = 'round'; c.lineCap = 'round';
  const blade = (bx, bh, bw, ph) => { const tipx = bx + sin(t * 1.3 + ph) * s * bh * .22, p2 = new Path2D(); p2.moveTo(bx - bw, 0); p2.quadraticCurveTo(bx - bw + (tipx - bx) * .5, -bh * .55, tipx, -bh); p2.quadraticCurveTo(bx + bw + (tipx - bx) * .5, -bh * .5, bx + bw, 0); p2.closePath(); c.fillStyle = grad(0, 0, 0, -bh); c.fill(p2); c.lineWidth = 1; c.strokeStyle = rgba(shade(rb ? '#ff7ad1' : c1, -.5), .7); c.stroke(p2); };
  switch(d.kind){
    case 'blade': for(let i = 0; i < 6; i++) blade((i - 2.5) * w * .12, h * (.65 + rn() * .35), w * .06, i * 1.1); break;
    case 'grass': for(let i = 0; i < 10; i++) blade((i - 4.5) * w * .07, h * (.5 + rn() * .5), w * .03, i * .8); break;
    case 'paddle': for(let i = 0; i < 4; i++){ const ph = i * 1.3, ang = (i - 1.5) * .35 + sin(t * 1.1 + ph) * s * .12, lh = h * (.6 + rn() * .4); c.save(); c.rotate(ang); wiggle(c, [[0, 0], [0, -lh * .5]], w * .03, shade(c1, -.3), 0); c.translate(0, -lh * .55); const lp = new Path2D(); lp.ellipse(0, -lh * .22, w * .17, lh * .3, 0, 0, TAU); c.fillStyle = grad(0, 0, 0, -lh * .5); c.fill(lp); c.lineWidth = 1; c.strokeStyle = rgba(shade(c1, -.5), .7); c.stroke(lp); c.strokeStyle = rgba('#fff', .3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -lh * .5); c.stroke(); c.restore(); } break;
    case 'kelp': { const n = rb ? 3 : 2; for(let k = 0; k < n; k++){ const bx = (k - (n - 1) / 2) * w * .18, pts = []; for(let i = 0; i <= 10; i++){ const u = i / 10; pts.push([bx + sin(t * 1.2 + u * 3 + k * 2) * s * w * .25 * u, -u * h * (.8 + k * .1)]); }
        const pa = new Path2D(); pts.forEach((q, i) => { const wd = w * .07 * (1 - i / 11) + 1.2; i ? pa.lineTo(q[0] + wd, q[1]) : pa.moveTo(q[0] + wd, q[1]); }); for(let i = pts.length - 1; i >= 0; i--){ const wd = w * .07 * (1 - i / 11) + 1.2; pa.lineTo(pts[i][0] - wd, pts[i][1]); } pa.closePath();
        c.fillStyle = grad(0, 0, 0, -h); c.fill(pa); c.lineWidth = 1; c.strokeStyle = rgba(shade(rb ? '#ff7ad1' : c1, -.5), .7); c.stroke(pa); c.fillStyle = col2; for(let i = 2; i < 10; i += 2){ const sd = (i & 2 ? 1 : -1); c.beginPath(); c.ellipse(pts[i][0] + sd * w * .08, pts[i][1], w * .06, w * .028, sd * .5, 0, TAU); c.fill(); } } break; }
    case 'blob': for(let i = 0; i < 5; i++){ const bx = (i - 2) * w * .16, by = -h * (.2 + (i % 2) * .25 + rn() * .15); wiggle(c, [[bx * .3, 0], [bx, by + sin(t + i) * s * 3]], w * .03, shade(c1, -.3), 0); c.beginPath(); c.arc(bx, by + sin(t + i) * s * 3, w * (.1 + rn() * .06), 0, TAU); c.fillStyle = grad(0, by - 10, 0, by + 10); c.fill(); c.strokeStyle = rgba('#fff', .6); c.lineWidth = 1; c.stroke(); } break;
    case 'tree': case 'branch': { const rec = (x, y, ang, len, dep) => { if(dep > 3 || len < 4) return; const sw = sin(t * 1.2 + dep + x * .05) * s * .08, x2 = x + sin(ang + sw) * len, y2 = y - cos(ang + sw) * len; c.lineWidth = Math.max(2, (4 - dep) * w * (d.kind === 'tree' ? .035 : .05)); c.strokeStyle = rb ? `hsl(${((x + y) * .8 + t * 25) % 360},80%,60%)` : (dep < 2 ? c1 : c2); c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if(dep >= 2){ c.fillStyle = col2; c.beginPath(); c.arc(x2, y2, Math.max(2, w * .035), 0, TAU); c.fill(); } rec(x2, y2, ang - .55 - rn() * .1, len * .72, dep + 1); rec(x2, y2, ang + .5 + rn() * .1, len * .72, dep + 1); if(dep < 1) rec(x2, y2, ang, len * .75, dep + 1); }; const r0 = rng(p.id * 13); rn.call = null; rec(0, 0, 0, h * .34, 0); break; }
    case 'fan': { c.save(); c.translate(0, 0); const fa = new Path2D(), sw = sin(t * 1.1 + p.id) * s * .06; fa.moveTo(0, 0); for(let i = 0; i <= 12; i++){ const a = -Math.PI * .5 + (i / 12 - .5) * 2.3 + sw, r = h * (.85 + .1 * sin(i * 2.1)); fa.lineTo(sin(a) * r * .9, -cos(a) * r * .9 + 0); } fa.closePath(); c.fillStyle = grad(0, 0, 0, -h); c.fill(fa); c.lineWidth = 1.4; c.strokeStyle = rgba(shade(c1, -.4), .8); c.stroke(fa); c.strokeStyle = rgba('#fff', .35); for(let i = 1; i < 12; i++){ const a = -Math.PI * .5 + (i / 12 - .5) * 2.3 + sw; c.beginPath(); c.moveTo(0, 0); c.lineTo(sin(a) * h * .8, -cos(a) * h * .8); c.stroke(); } c.restore(); break; }
    case 'anem': { c.fillStyle = shade(c1, -.25); c.beginPath(); c.ellipse(0, -h * .1, w * .24, h * .16, 0, 0, TAU); c.fill(); for(let i = 0; i < 16; i++){ const bx = (i / 15 - .5) * w * .42, pts = []; for(let k = 0; k <= 5; k++){ const u = k / 5; pts.push([bx * (1 + u * .8) + sin(t * 1.8 + i + u * 2.5) * s * w * .06 * u * 3, -h * .15 - u * h * .85]); } wiggle(c, pts, w * .035, i % 2 ? c1 : c2, 1); c.fillStyle = i % 2 ? c2 : '#fff'; c.beginPath(); c.arc(pts[5][0], pts[5][1], w * .035, 0, TAU); c.fill(); } break; }
    case 'bubble': for(let i = 0; i < 6; i++){ const bx = (i - 2.5) * w * .15, tipy = -h * (.45 + rn() * .5), tipx = bx + sin(t * 1.3 + i) * s * 5; wiggle(c, [[bx * .5, 0], [tipx, tipy]], w * .025, shade(c1, -.3), 0); c.beginPath(); c.arc(tipx, tipy, w * (.07 + rn() * .06), 0, TAU); c.fillStyle = rgba(c2, .65); c.fill(); c.lineWidth = 1.2; c.strokeStyle = c1; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(tipx - 2, tipy - 2, w * .02, 0, TAU); c.fill(); } break;
    case 'crystal': for(let i = 0; i < 5; i++){ const ang = (i - 2) * .28, ch = h * (.5 + rn() * .5), cw = w * .09; c.save(); c.rotate(ang); const cp = new Path2D(); cp.moveTo(-cw, 0); cp.lineTo(-cw * .8, -ch * .7); cp.lineTo(0, -ch); cp.lineTo(cw * .8, -ch * .7); cp.lineTo(cw, 0); cp.closePath(); const gr = c.createLinearGradient(-cw, 0, cw, -ch); gr.addColorStop(0, rgba(c1, .85)); gr.addColorStop(.5, '#ffffffcc'); gr.addColorStop(1, rgba(c1, .6)); c.fillStyle = gr; c.fill(cp); c.lineWidth = 1.3; c.strokeStyle = rgba('#fff', .9); c.stroke(cp); c.restore(); } break;
    case 'ancient': { const tr = new Path2D(); tr.moveTo(-w * .08, 0); tr.bezierCurveTo(-w * .05, -h * .4, -w * .1, -h * .6, -w * .03, -h * .8); tr.lineTo(w * .03, -h * .8); tr.bezierCurveTo(w * .1, -h * .6, w * .05, -h * .4, w * .08, 0); tr.closePath(); c.fillStyle = c1; c.fill(tr); c.lineWidth = 1.2; c.strokeStyle = shade(c1, -.5); c.stroke(tr);
      for(let i = 0; i < 5; i++){ const by = -h * (.3 + i * .12), dir = i % 2 ? 1 : -1, ex = dir * w * (.25 + rn() * .15) + sin(t * 1.1 + i) * s * 3, ey = by - h * .15; wiggle(c, [[0, by], [dir * w * .1, by - h * .06], [ex, ey]], w * .03, c1, 0); c.beginPath(); c.arc(ex, ey, w * .05, 0, TAU); c.fillStyle = `rgba(255,211,77,${.6 + .4 * sin(t * 3 + i)})`; c.fill(); } break; }
    default: blade(0, h, w * .1, 0);
  }
  c.restore();
};
/* ---------- VẬT TRANG TRÍ ---------- */
function ob(c, p, fill, ow = 3, st){ c.lineJoin = 'round'; c.lineWidth = ow * 2; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke(p); c.fillStyle = fill; c.fill(p); c.lineWidth = 1.3; c.strokeStyle = st || 'rgba(20,30,60,.55)'; c.stroke(p); }
OA.decor = function(c, dd, t, night){
  const d = dd.d, s = dd.s, c1 = d.c[0], c2 = d.c[1], rb = c1 === 'rainbow'; c.save(); c.translate(dd.x, dd.y); c.scale(s, s);
  if(d.glow){ const a = .22 + .12 * sin(t * 2 + dd.id) + night * .25, gr = c.createRadialGradient(0, -40, 4, 0, -40, 90); gr.addColorStop(0, rgba(rb ? '#ff7ad1' : c2, a)); gr.addColorStop(1, rgba(rb ? '#ff7ad1' : c2, 0)); c.fillStyle = gr; c.beginPath(); c.arc(0, -40, 90, 0, TAU); c.fill(); }
  const g1 = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  switch(d.prim){
    case 'rock': { const p = new Path2D(); p.moveTo(-40, 0); p.quadraticCurveTo(-46, -26, -18, -36); p.quadraticCurveTo(6, -52, 28, -34); p.quadraticCurveTo(48, -20, 42, 0); p.closePath(); ob(c, p, g1(-50, 0, c2, c1)); if(d.glow){ c.strokeStyle = c2; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -30); c.lineTo(0, -14); c.lineTo(14, -24); c.stroke(); } const p2 = new Path2D(); p2.ellipse(40, -4, 18, 12, 0, 0, TAU); ob(c, p2, g1(-12, 8, c2, c1)); break; }
    case 'cliff': { const p = new Path2D(); p.moveTo(-50, 0); p.lineTo(-44, -90); p.quadraticCurveTo(-20, -112, 6, -96); p.lineTo(26, -60); p.lineTo(52, 0); p.closePath(); ob(c, p, g1(-110, 0, c2, c1)); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -90); c.lineTo(-10, -30); c.moveTo(10, -80); c.lineTo(20, -20); c.stroke(); break; }
    case 'cave': { const big = d.fl.includes('L') ? 1.35 : 1, p = new Path2D(); p.moveTo(-60 * big, 0); p.quadraticCurveTo(-64 * big, -74 * big, 0, -82 * big); p.quadraticCurveTo(64 * big, -74 * big, 60 * big, 0); p.closePath(); ob(c, p, g1(-90, 0, c2 === '#4a5aa0' ? c1 : c1, shade(c1, -.2))); const h = new Path2D(); h.moveTo(-30 * big, 0); h.quadraticCurveTo(-30 * big, -48 * big, 0, -50 * big); h.quadraticCurveTo(30 * big, -48 * big, 30 * big, 0); h.closePath(); c.fillStyle = c2; c.fill(h); const gr = c.createRadialGradient(0, -10, 2, 0, -10, 40 * big); gr.addColorStop(0, 'rgba(0,0,10,.0)'); gr.addColorStop(1, 'rgba(0,0,20,.45)'); c.fillStyle = gr; c.fill(h);
      if(d.glow){ c.fillStyle = '#e8fbff'; for(let i = 0; i < 5; i++){ c.beginPath(); c.moveTo(-50 + i * 24, -62 + (i % 2) * 14); c.lineTo(-44 + i * 24, -84 + (i % 2) * 8); c.lineTo(-38 + i * 24, -62 + (i % 2) * 14); c.closePath(); c.fill(); } } break; }
    case 'arch': { const p = new Path2D(); p.moveTo(-70, 0); p.lineTo(-62, -60); p.quadraticCurveTo(0, -120, 62, -60); p.lineTo(70, 0); p.lineTo(40, 0); p.quadraticCurveTo(38, -50, 0, -66); p.quadraticCurveTo(-38, -50, -40, 0); p.closePath(); ob(c, p, g1(-110, 0, rb ? '#ff7ad1' : c2, c1)); if(d.fl.includes('h')){ c.fillStyle = rgba('#ffc0d0', .9); for(let i = 0; i < 6; i++){ c.beginPath(); c.arc(-50 + i * 20, -78 + Math.abs(i - 2.5) * 6, 5, 0, TAU); c.fill(); } } break; }
    case 'gate': { const ph = new Path2D(); ph.rect(-58, -96, 22, 96); ph.rect(36, -96, 22, 96); ph.rect(-62, -110, 124, 20); ob(c, ph, g1(-110, 0, c2, c1)); c.fillStyle = d.glow ? `rgba(255,255,255,${.16 + .08 * sin(t * 3)})` : 'rgba(255,255,255,.1)'; c.fillRect(-36, -88, 72, 88); if(d.id === 'd31'){ c.fillStyle = '#fff'; for(let i = 0; i < 14; i++){ c.globalAlpha = .4 + .6 * Math.abs(sin(t * 2 + i)); c.beginPath(); c.arc(-30 + (i * 37 % 60), -80 + (i * 23 % 76), 1.4, 0, TAU); c.fill(); } c.globalAlpha = 1; } if(d.id === 'd10' || d.id === 'd38'){ c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(-14, -110); c.lineTo(0, -132); c.lineTo(14, -110); c.closePath(); c.fill(); } break; }
    case 'ruins': { for(const [x, h, w] of [[-44, 80, 18], [-10, 112, 20], [30, 60, 18]]){ const p = new Path2D(); p.rect(x - w / 2, -h, w, h); ob(c, p, g1(-h, 0, c2, c1)); c.fillStyle = '#4a8a5a'; c.fillRect(x - w / 2, -h, w, 6); } const b = new Path2D(); b.rect(-54, -122, 70, 12); ob(c, b, c2); break; }
    case 'coral': { const rn = rng(dd.id * 17), br = (x, y, a, l, dep) => { if(dep > 3) return; const sw = sin(t * 1.2 + dep + x) * .05, x2 = x + sin(a + sw) * l, y2 = y - cos(a + sw) * l; c.strokeStyle = '#fff'; c.lineWidth = (5 - dep) * 3 + 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = dep > 1 ? c2 : c1; c.lineWidth = (5 - dep) * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); br(x2, y2, a - .5 - rn() * .2, l * .74, dep + 1); br(x2, y2, a + .5 + rn() * .2, l * .74, dep + 1); }; br(0, 0, 0, 34, 0); break; }
    case 'anem': { for(let k = -1; k <= 1; k++){ c.fillStyle = shade(c1, -.25); c.beginPath(); c.ellipse(k * 26, -4, 14, 8, 0, 0, TAU); c.fill(); for(let i = 0; i < 9; i++){ const bx = k * 26 + (i / 8 - .5) * 20, pts = []; for(let q = 0; q <= 4; q++){ const u = q / 4; pts.push([bx + sin(t * 1.8 + i + k + u * 2) * 4 * u, -6 - u * 36]); } wiggle(c, pts, 3, i % 2 ? c1 : c2, 1); } } break; }
    case 'tuft': { const n = 7; for(let i = 0; i < n; i++){ const bx = (i - 3) * 12, hh = 50 + (i % 3) * 22, pts = []; for(let q = 0; q <= 8; q++){ const u = q / 8; pts.push([bx + sin(t * 1.2 + i * 1.3 + u * 3) * 8 * u, -u * hh]); } wiggle(c, pts, 6, rb ? `hsl(${(i * 50 + t * 25) % 360},80%,62%)` : (i % 2 ? c1 : c2), 1.6); } break; }
    case 'crys': { for(let i = 0; i < 6; i++){ const ang = (i - 2.5) * .3, ch = 36 + (i % 3) * 22, cw = 8; c.save(); c.translate(i * 8 - 20, 0); c.rotate(ang); const cp = new Path2D(); cp.moveTo(-cw, 0); cp.lineTo(-cw * .8, -ch * .7); cp.lineTo(0, -ch); cp.lineTo(cw * .8, -ch * .7); cp.lineTo(cw, 0); cp.closePath(); const gr = c.createLinearGradient(-cw, 0, cw, -ch); gr.addColorStop(0, rgba(c1, .85)); gr.addColorStop(.5, '#ffffffcc'); gr.addColorStop(1, rgba(c1, .6)); ob(c, cp, gr); c.restore(); } break; }
    case 'tree': { c.strokeStyle = '#fff'; c.lineWidth = 11; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-6, -30, 0, -52); c.stroke(); c.strokeStyle = '#7a5a3a'; c.lineWidth = 7; c.stroke(); for(const [x, y] of [[-20, -62], [0, -76], [20, -62], [-8, -48], [12, -48]]){ c.beginPath(); c.arc(x + sin(t + x) * 2, y, 15, 0, TAU); c.fillStyle = c1; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#fff'; c.stroke(); } c.fillStyle = c2; for(const [x, y] of [[-14, -66], [8, -82], [18, -58]]){ c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); } break; }
    case 'ship': { const gh = d.fl.includes('G'), a = gh ? .7 : 1; c.globalAlpha *= a; c.save(); c.rotate(-.12); const hl = new Path2D(); hl.moveTo(-70, -36); hl.lineTo(70, -48); hl.quadraticCurveTo(60, 0, 20, 0); hl.lineTo(-48, 0); hl.quadraticCurveTo(-72, -10, -70, -36); hl.closePath(); ob(c, hl, g1(-50, 0, c2, c1)); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; for(let i = 0; i < 4; i++){ c.beginPath(); c.moveTo(-60 + i * 30, -38 + i * -3); c.lineTo(-52 + i * 28, -4); c.stroke(); } c.fillStyle = 'rgba(20,30,60,.65)'; for(let i = 0; i < 3; i++){ c.beginPath(); c.arc(-30 + i * 28, -28 - i * 3, 5, 0, TAU); c.fill(); } const m = new Path2D(); m.rect(-6, -110, 6, 66); ob(c, m, c1); const sl = new Path2D(); sl.moveTo(0, -108); sl.quadraticCurveTo(34 + sin(t * 1.5) * 4, -92, 30, -58); sl.lineTo(0, -62); sl.closePath(); ob(c, sl, gh ? 'rgba(200,210,255,.7)' : '#f5ead0'); c.restore(); c.globalAlpha /= a; if(gh){ c.fillStyle = `rgba(160,200,255,${.4 + .3 * sin(t * 3)})`; c.beginPath(); c.arc(10, -70, 6, 0, TAU); c.fill(); } break; }
    case 'chest': { const bx = new Path2D(); bx.rect(-34, -34, 68, 34); ob(c, bx, g1(-34, 0, c1, shade(c1, -.2))); const lid = new Path2D(); lid.moveTo(-34, -34); lid.quadraticCurveTo(-34, -64, 0, -64); lid.quadraticCurveTo(34, -64, 34, -34); lid.closePath(); ob(c, lid, g1(-64, -34, shade(c1, .2), c1)); c.fillStyle = c2; c.fillRect(-34, -38, 68, 6); c.fillRect(-6, -42, 12, 16); c.fillStyle = '#fff3a0'; for(let i = 0; i < 5; i++){ c.beginPath(); c.arc(-20 + i * 10, -36, 3, 0, TAU); c.fill(); } const gl = .5 + .5 * sin(t * 3); c.fillStyle = `rgba(255,240,150,${gl})`; c.fillRect(-3, -66 - 4 * gl, 6, 8); break; }
    case 'anchor': { c.strokeStyle = '#fff'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -8); c.moveTo(-26, -64); c.lineTo(26, -64); c.moveTo(-34, -24); c.quadraticCurveTo(-30, 0, 0, -2); c.quadraticCurveTo(30, 0, 34, -24); c.stroke(); c.strokeStyle = c1; c.lineWidth = 8; c.stroke(); c.beginPath(); c.arc(0, -86, 8, 0, TAU); c.lineWidth = 12; c.strokeStyle = '#fff'; c.stroke(); c.lineWidth = 6; c.strokeStyle = c1; c.stroke(); break; }
    case 'statue': { const poseid = d.id === 'd29', bs = new Path2D(); bs.rect(-26, -14, 52, 14); ob(c, bs, g1(-14, 0, c2, c1)); const bd = new Path2D(); bd.moveTo(-14, -14); bd.quadraticCurveTo(-18, -58, -8, -76); bd.lineTo(8, -76); bd.quadraticCurveTo(18, -58, 14, -14); bd.closePath(); ob(c, bd, g1(-76, -14, c2, c1)); const hd = new Path2D(); hd.arc(0, -88, 12, 0, TAU); ob(c, hd, g1(-100, -76, c2, c1)); if(poseid){ c.strokeStyle = '#ffd34d'; c.lineWidth = 3; c.beginPath(); c.moveTo(28, -10); c.lineTo(28, -112); c.moveTo(20, -100); c.lineTo(20, -112); c.moveTo(36, -100); c.lineTo(36, -112); c.moveTo(20, -100); c.quadraticCurveTo(28, -92, 36, -100); c.stroke(); } break; }
    case 'castle': { const big = d.id === 'd33'; const k = big ? 1.5 : 1; const bd = new Path2D(); bd.rect(-40 * k, -50 * k, 80 * k, 50 * k); bd.rect(-52 * k, -78 * k, 22 * k, 78 * k); bd.rect(30 * k, -78 * k, 22 * k, 78 * k); ob(c, bd, g1(-80 * k, 0, c2, c1)); for(const x of [-41, 41]){ const rf = new Path2D(); rf.moveTo((x - 15) * k, -78 * k); rf.lineTo(x * k, -104 * k); rf.lineTo((x + 15) * k, -78 * k); rf.closePath(); ob(c, rf, big ? '#ff7ad1' : '#ff6a6a'); } c.fillStyle = 'rgba(30,30,70,.6)'; c.beginPath(); c.moveTo(-10 * k, 0); c.lineTo(-10 * k, -26 * k); c.quadraticCurveTo(0, -38 * k, 10 * k, -26 * k); c.lineTo(10 * k, 0); c.fill(); c.fillStyle = d.glow ? '#fff3a0' : 'rgba(255,255,255,.5)'; for(const x of [-41, 41]){ c.fillRect((x - 3) * k, -58 * k, 6 * k, 10 * k); } break; }
    case 'light': { const tw = new Path2D(); tw.moveTo(-18, 0); tw.lineTo(-11, -100); tw.lineTo(11, -100); tw.lineTo(18, 0); tw.closePath(); ob(c, tw, '#ffffff'); c.fillStyle = c2; for(const y of [-80, -48, -16]){ c.fillRect(-16 + (y + 100) * .06, y, 32 - (y + 100) * .1, 14); } const tp = new Path2D(); tp.rect(-14, -122, 28, 22); ob(c, tp, g1(-122, -100, '#fff3a0', '#ffd34d')); const bm = .4 + .3 * sin(t * 2); c.fillStyle = `rgba(255,240,150,${bm})`; c.beginPath(); c.moveTo(14, -112); c.lineTo(110, -140); c.lineTo(110, -86); c.closePath(); c.fill(); break; }
    case 'wheel': { c.strokeStyle = '#fff'; c.lineWidth = 14; c.beginPath(); c.arc(0, -46, 32, 0, TAU); c.stroke(); c.strokeStyle = c1; c.lineWidth = 9; c.stroke(); for(let i = 0; i < 8; i++){ const a = i * TAU / 8 + t * .0; c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.moveTo(cos(a) * 14, -46 + sin(a) * 14); c.lineTo(cos(a) * 48, -46 + sin(a) * 48); c.stroke(); c.strokeStyle = c2; c.lineWidth = 4; c.stroke(); } c.beginPath(); c.arc(0, -46, 10, 0, TAU); c.fillStyle = c2; c.fill(); break; }
    case 'tower': { for(const [x, h, w] of [[-20, 90, 14], [0, 130, 18], [22, 80, 14]]){ const cp = new Path2D(); cp.moveTo(x - w, 0); cp.lineTo(x - w * .8, -h * .75); cp.lineTo(x, -h); cp.lineTo(x + w * .8, -h * .75); cp.lineTo(x + w, 0); cp.closePath(); const gr = c.createLinearGradient(x - w, 0, x + w, -h); gr.addColorStop(0, rgba(c1, .85)); gr.addColorStop(.5, '#ffffffcc'); gr.addColorStop(1, rgba(c1, .6)); ob(c, cp, gr); } break; }
    case 'fountain': { const bs = new Path2D(); bs.ellipse(0, -8, 50, 14, 0, 0, TAU); ob(c, bs, g1(-20, 4, c2, c1)); const st = new Path2D(); st.rect(-6, -48, 12, 40); ob(c, st, c1); const tp = new Path2D(); tp.ellipse(0, -52, 22, 8, 0, 0, TAU); ob(c, tp, g1(-60, -44, c2, c1)); c.fillStyle = 'rgba(255,255,255,.7)'; for(let i = 0; i < 10; i++){ const u = ((t * .6 + i / 10) % 1); c.beginPath(); c.arc(sin(i * 2.1) * 14 * u, -58 - u * 56 + u * u * 30, 3 - u * 1.5, 0, TAU); c.fill(); } break; }
    case 'crown': { const p = new Path2D(); p.moveTo(-62, 0); p.lineTo(-70, -80); p.lineTo(-34, -46); p.lineTo(0, -110); p.lineTo(34, -46); p.lineTo(70, -80); p.lineTo(62, 0); p.closePath(); ob(c, p, g1(-110, 0, '#fff3a0', c1)); for(const [x, y, k] of [[0, -30, c2], [-36, -26, '#4dc8ff'], [36, -26, '#4dc8ff']]){ c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fillStyle = k; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); } break; }
    case 'moon': { for(const [x, h, w, a] of [[-14, 96, 16, -.16], [10, 128, 20, .08], [30, 80, 14, .26]]){ c.save(); c.translate(x, 0); c.rotate(a); const cp = new Path2D(); cp.moveTo(-w, 0); cp.lineTo(-w * .8, -h * .7); cp.lineTo(0, -h); cp.lineTo(w * .8, -h * .7); cp.lineTo(w, 0); cp.closePath(); const gr = c.createLinearGradient(-w, 0, w, -h); gr.addColorStop(0, rgba(c1, .9)); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, rgba(c1, .7)); ob(c, gr ? cp : cp, gr); c.restore(); } break; }
    case 'sun': { c.save(); c.translate(0, -70); const r = 28 + sin(t * 2) * 2; for(let i = 0; i < 14; i++){ const a = i * TAU / 14 + t * .4; c.strokeStyle = '#fff'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(cos(a) * (r + 6), sin(a) * (r + 6)); c.lineTo(cos(a) * (r + 22), sin(a) * (r + 22)); c.stroke(); c.strokeStyle = c1; c.lineWidth = 5; c.stroke(); } const gr = c.createRadialGradient(-8, -8, 2, 0, 0, r); gr.addColorStop(0, '#fff7c0'); gr.addColorStop(1, c2); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = gr; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke(); c.restore(); break; }
    case 'dragon': { const bs = new Path2D(); bs.rect(-34, -12, 68, 12); ob(c, bs, '#8aa0b0'); const pts = []; for(let i = 0; i <= 14; i++){ const u = i / 14; pts.push([sin(u * 5 + t * .6) * 18 * (1 - u * .4), -12 - u * 120]); } wiggle(c, pts, 20, c1, 2.4); const hd = pts[14]; c.fillStyle = c1; c.beginPath(); c.ellipse(hd[0] + 10, hd[1] - 6, 22, 14, -.3, 0, TAU); c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(hd[0] + 6, hd[1] - 10, 5, 0, TAU); c.fill(); c.fillStyle = '#2a2a4a'; c.beginPath(); c.arc(hd[0] + 7, hd[1] - 10, 2.6, 0, TAU); c.fill(); c.fillStyle = c2; for(let i = 1; i < 14; i += 2){ c.beginPath(); c.moveTo(pts[i][0] - 14, pts[i][1] + 3); c.lineTo(pts[i][0] - 24, pts[i][1] - 6); c.lineTo(pts[i][0] - 12, pts[i][1] - 6); c.fill(); } break; }
    case 'heart': { const hp = new Path2D(); hp.moveTo(0, -20); hp.bezierCurveTo(-72, -86, -34, -130, 0, -96); hp.bezierCurveTo(34, -130, 72, -86, 0, -20); ob(c, hp, g1(-130, -20, c2, c1)); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-24, -92, 12, 7, -.6, 0, TAU); c.fill(); const pl = new Path2D(); pl.arc(0, -66, 12, 0, TAU); c.fillStyle = `rgba(255,255,255,${.55 + .3 * sin(t * 3)})`; c.fill(pl); break; }
    default: { const p = new Path2D(); p.rect(-20, -40, 40, 40); ob(c, p, c1); }
  }
  c.restore();
};
/* ---------- VẬT PHẨM RƠI NGẪU NHIÊN ---------- */
OA.item = function(c, it, t){
  c.save(); c.translate(it.x, it.y + sin(t * 2 + it.id) * 4); const k = it.size || 1, pulse = 1 + .06 * sin(t * 5 + it.id); c.scale(k * pulse, k * pulse);
  const a = Math.min(1, it.life * 1.5, (it.maxlife - it.life) * 3 + .2); c.globalAlpha = Math.max(.15, Math.min(1, a));
  const gl = (col, r) => { const g = c.createRadialGradient(0, 0, 2, 0, 0, r); g.addColorStop(0, rgba(col, .55)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); };
  if(it.type === 'diamond'){ gl('#7ad8ff', 34); const p = new Path2D(); p.moveTo(-14, -6); p.lineTo(-7, -14); p.lineTo(7, -14); p.lineTo(14, -6); p.lineTo(0, 16); p.closePath(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.stroke(p); const g = c.createLinearGradient(-14, -14, 14, 16); g.addColorStop(0, '#e8fbff'); g.addColorStop(.5, '#6ad0ff'); g.addColorStop(1, '#3a8aff'); c.fillStyle = g; c.fill(p); c.lineWidth = 1.2; c.strokeStyle = '#2a6ac0'; c.stroke(p); c.beginPath(); c.moveTo(-14, -6); c.lineTo(14, -6); c.moveTo(-7, -14); c.lineTo(-3, -6); c.lineTo(0, 16); c.moveTo(7, -14); c.lineTo(3, -6); c.lineTo(0, 16); c.stroke(); const s = (t * 2 + it.id) % 2; if(s < 1){ c.fillStyle = '#fff'; c.fillRect(8 - s * 2, -12, 2, 8); c.fillRect(5 - s * 2, -9, 8, 2); } }
  else if(it.type === 'sun'){ gl('#ffd34d', 54); for(let i = 0; i < 12; i++){ const an = i * TAU / 12 + t * .6; c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cos(an) * 18, sin(an) * 18); c.lineTo(cos(an) * 28, sin(an) * 28); c.stroke(); c.strokeStyle = '#ffb21f'; c.lineWidth = 4; c.stroke(); } const g = c.createRadialGradient(-5, -5, 2, 0, 0, 16); g.addColorStop(0, '#fff7c0'); g.addColorStop(1, '#ff9a1a'); c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#7a3a00'; c.beginPath(); c.arc(-5, -2, 1.8, 0, TAU); c.arc(5, -2, 1.8, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 3, 5, .2, Math.PI - .2); c.strokeStyle = '#7a3a00'; c.lineWidth = 1.4; c.stroke(); }
  else if(it.type === 'chest'){ gl('#ffd34d', 36); const bx = new Path2D(); bx.rect(-16, -6, 32, 18); const lid = new Path2D(); lid.moveTo(-16, -6); lid.quadraticCurveTo(-16, -22, 0, -22); lid.quadraticCurveTo(16, -22, 16, -6); lid.closePath(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(bx); c.stroke(lid); c.fillStyle = '#b07a3a'; c.fill(bx); c.fillStyle = '#c9923a'; c.fill(lid); c.lineWidth = 1.2; c.strokeStyle = '#6a4a1a'; c.stroke(bx); c.stroke(lid); c.fillStyle = '#ffd34d'; c.fillRect(-16, -8, 32, 4); c.fillRect(-3, -10, 6, 8); }
  else if(it.type === 'bubble'){ const p = new Path2D(); p.arc(0, 0, 15, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.95)'; c.stroke(p); const g = c.createRadialGradient(-5, -5, 1, 0, 0, 15); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(160,230,255,.35)'); c.fillStyle = g; c.fill(p); c.fillStyle = '#ffd34d'; c.font = '700 13px Montserrat,sans-serif'; c.textAlign = 'center'; c.fillText('★', 0, 5); }
  else if(it.type === 'egg'){ gl('#ff9ad1', 36); OA.egg(c, { x: 0, y: 0, r: 15, id: it.id, col: '#f0e0ff', col2: '#7a5cff', rare: true, prog: 0 }, t); c.fillStyle = '#7a3a9a'; c.font = '800 14px Montserrat,sans-serif'; c.textAlign = 'center'; c.fillText('?', 0, 5); }
  else { gl('#c9a8ff', 32); const p = new Path2D(); p.moveTo(-6, -18); p.quadraticCurveTo(-18, 0, -8, 16); p.lineTo(8, 16); p.quadraticCurveTo(18, 0, 6, -18); p.closePath(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(p); c.fillStyle = '#c98a4a'; c.fill(p); c.lineWidth = 1.2; c.strokeStyle = '#6a3a1a'; c.stroke(p); c.strokeStyle = '#ffd34d'; c.beginPath(); c.moveTo(-10, -4); c.lineTo(10, -4); c.moveTo(-9, 6); c.lineTo(9, 6); c.stroke(); }
  c.restore();
};
/* ---------- NỀN ĐẠI DƯƠNG ---------- */
const KEYS = { day: ['#9fe4ff', '#2aa0e8', '#0a4a8a'], dusk: ['#ffc59a', '#c9689a', '#3a2a6b'], night: ['#34459f', '#17236a', '#070b2a'], dawn: ['#ffd9b0', '#7cc0ea', '#1a5a9a'] };
OA.skyColors = tod => { // tod 0..1: 0 bình minh, .25 ngày, .5 hoàng hôn, .75 đêm
  const seq = ['dawn', 'day', 'dusk', 'night'], i = Math.floor(tod * 4) % 4, f = (tod * 4) % 1, A = KEYS[seq[i]], B = KEYS[seq[(i + 1) % 4]], e = f * f * (3 - 2 * f);
  const day = [1, 1.0, .35, 0][i] * (1 - e) + [1, .35, 0, .4][i] * e * 0; return { c: A.map((a, k) => mix(a, B[k], e)), day: cl([.7, 1, .5, .08][i] * (1 - e) + [1, .5, .08, .7][i] * e, 0, 1) };
};
OA.bg = function(c, W, H, env){
  const th = env.theme | 0, TH = [null, { c: ['#ffc2d4', '#ee6a9c', '#5a2070'], sand: '#f7dcc8', w: .6 }, { c: ['#c8f2a8', '#34b574', '#0d4f3c'], sand: '#d6dca4', w: .6 }, { c: ['#3a2a8f', '#16266f', '#060624'], sand: '#2b3d72', w: .85 }][th];
  let sk = env.sky; if(TH) sk = { c: sk.c.map((a, k) => mix(a, TH.c[k], TH.w * (th === 3 ? 1 : .55 + .45 * sk.day))), day: th === 3 ? Math.min(sk.day, .22) : sk.day };
  const day = sk.day, lt = env.light, t = env.t;
  // nước: dải màu trời + ngả ngọc lam ở tầng sâu
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sk.c[0]); g.addColorStop(.45, sk.c[1]); g.addColorStop(1, sk.c[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // quầng sáng mặt trời/mặt trăng phía trên
  { const cx = W * (.5 + .12 * sin(t * .05)), rg = c.createRadialGradient(cx, -H * .05, 10, cx, -H * .05, H * .95); rg.addColorStop(0, `rgba(220,252,255,${(.28 * day + .06) * lt})`); rg.addColorStop(.5, `rgba(120,230,240,${.09 * day * lt})`); rg.addColorStop(1, 'rgba(120,230,240,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); }
  // tia sáng xuyên mặt nước (mềm, nhiều lớp)
  if(day > .08){ const a = .085 * day * lt; for(let i = 0; i < 7; i++){ const x = W * (.04 + i * .15) + sin(t * .22 + i * 2) * 46, w = 36 + 34 * sin(i * 3.1 + t * .3), lg = c.createLinearGradient(x, 0, x + 130, H * .85); lg.addColorStop(0, `rgba(235,255,255,${a * 2.2})`); lg.addColorStop(.6, `rgba(200,250,255,${a * .8})`); lg.addColorStop(1, 'rgba(200,250,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w + 240, H * .88); c.lineTo(x + 90, H * .88); c.fill(); } }
  // dãy đá/san hô xa (sương mù độ sâu)
  c.fillStyle = rgba(sk.c[2], .42); c.beginPath(); c.moveTo(0, H); for(let x = 0; x <= W; x += 40){ c.lineTo(x, env.floor(x) - 110 - 50 * sin(x * .006 + 2) - 28 * sin(x * .017)); } c.lineTo(W, H); c.fill();
  c.fillStyle = rgba(sk.c[2], .58); c.beginPath(); c.moveTo(0, H); for(let x = 0; x <= W; x += 40){ c.lineTo(x, env.floor(x) - 70 - 40 * sin(x * .008 + 1) - 25 * sin(x * .02)); } c.lineTo(W, H); c.fill();
  // rặng san hô mờ phía xa
  for(let i = 0; i < 18; i++){ const x = i * W / 17 + 22 * sin(i * 5), y = env.floor(x) - 20, h = 56 + (i * 53 % 74), sw = sin(t * .8 + i) * 9; c.fillStyle = rgba(i % 3 ? sk.c[2] : mix(sk.c[2], '#7a5cff', .25), .72); c.beginPath(); c.moveTo(x - 11, y); c.quadraticCurveTo(x + sw * .5, y - h * .6, x + sw * 1.4, y - h); c.quadraticCurveTo(x + 4, y - h * .5, x + 11, y); c.fill(); if(i % 4 === 0){ c.beginPath(); c.moveTo(x - 2, y - h * .35); c.quadraticCurveTo(x + 14 + sw, y - h * .55, x + 20 + sw, y - h * .78); c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = c.fillStyle; c.stroke(); } }
  // sương độ sâu: đáy nước tối và xanh hơn
  { const fg = c.createLinearGradient(0, H * .35, 0, H); fg.addColorStop(0, rgba(sk.c[1], 0)); fg.addColorStop(1, rgba(mix(sk.c[2], '#041a3a', .5), .5)); c.fillStyle = fg; c.fillRect(0, H * .35, W, H * .65); }
  // cát đáy: gradient, gợn sóng, caustics
  const sand = mix(TH ? TH.sand : '#f0d49a', '#223055', th === 3 ? .15 : 1 - cl(day * 1.3, 0, 1) * .85); c.beginPath(); c.moveTo(0, H); for(let x = 0; x <= W; x += 20) c.lineTo(x, env.floor(x)); c.lineTo(W, H); c.closePath(); const sg = c.createLinearGradient(0, H * .72, 0, H); sg.addColorStop(0, sand); sg.addColorStop(1, shade(sand, -.4)); c.fillStyle = sg; c.fill(); c.lineWidth = 3; c.strokeStyle = rgba(shade(sand, .4), .55); c.stroke();
  c.save(); c.clip(); c.lineCap = 'round';
  c.strokeStyle = rgba(shade(sand, -.18), .28); c.lineWidth = 2; for(let i = 0; i < 26; i++){ const x = (i * 97) % W, y = env.floor(x) + 14 + (i * 31 % 46), l = 26 + (i % 5) * 12; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); }
  if(day > .1){ c.strokeStyle = `rgba(255,255,230,${.2 * day * lt})`; c.lineWidth = 2.4; for(let i = 0; i < 34; i++){ const x = (i * 71 + sin(t * .5 + i) * 20) % W, y = env.floor(x) + 6 + (i * 29 % 40), l = 14 + (i % 4) * 8; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l * .5, y - 5 * sin(t + i), x + l, y + 1); c.stroke(); } }
  c.restore();
  c.fillStyle = rgba(shade(sand, -.2), .4); for(let i = 0; i < 34; i++){ const x = (i * 97) % W; c.beginPath(); c.ellipse(x + 8, env.floor(x) + 18 + (i * 31 % 40), 4 + (i % 4) * 3, 1.8, 0, 0, TAU); c.fill(); }
};
OA.surface = function(c, W, env){
  const amp = 3 + env.wave * 6, d = env.sky.day, t = env.t, y = (x, k) => 14 + k * 3 + sin(x * .02 + t * 1.6 + k) * amp + sin(x * .05 + t * 2.4 + k) * amp * .5;
  c.beginPath(); c.moveTo(0, 0); for(let x = 0; x <= W; x += 16) c.lineTo(x, y(x, 0)); c.lineTo(W, 0); c.closePath(); const g = c.createLinearGradient(0, 0, 0, 44); g.addColorStop(0, `rgba(255,255,255,${.62 * (.4 + d * .6)})`); g.addColorStop(.5, `rgba(190,245,255,${.2 * (.4 + d * .6)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fill();
  for(let k = 1; k >= 0; k--){ c.strokeStyle = `rgba(255,255,255,${(k ? .22 : .5) + .25 * d})`; c.lineWidth = k ? 1.4 : 2.2; c.beginPath(); for(let x = 0; x <= W; x += 16){ const yy = y(x, k * 1.6); x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
};
/* ---------- ẢNH THU NHỎ ---------- */
let TC = {}, TCn = 0;
OA.thumb = function(spec, w = 120, h = 84){
  const key = [spec.kind, spec.id, spec.stg, spec.sil ? 1 : 0, JSON.stringify(spec.g || ''), w, h].join('|'); if(TC[key]) return TC[key];
  const cv = document.createElement('canvas'), dpr = 2; cv.width = w * dpr; cv.height = h * dpr; const c0 = cv.getContext('2d'); c0.scale(dpr, dpr); let c = c0;
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9f7ff'); gr.addColorStop(.55, '#7fd3ee'); gr.addColorStop(1, '#3a9fd0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); { const rg = c.createRadialGradient(w * .5, h * .35, 2, w * .5, h * .35, w * .6); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.28)'; for(let i = 0; i < 5; i++){ c.beginPath(); c.arc((i * 37 + 11) % w, h - ((i * 23 + 9) % (h - 8)), 1.4 + i % 3 * .7, 0, 6.3); c.fill(); } }
  let tcv = null; if(spec.sil){ tcv = document.createElement('canvas'); tcv.width = cv.width; tcv.height = cv.height; c = tcv.getContext('2d'); c.scale(dpr, dpr); }
  c.save();
  if(spec.kind === 'sp'){ const d = OD.SP[spec.id] || spec.d; const g = Object.assign(OA.G0(), spec.g || {}); const stg = spec.stg == null ? 3 : spec.stg; const f = { d, g, stg, id: 7, x: w / 2 + (d.arch === 'fish' ? w * .035 : 0), y: h / 2 + (d.arch === 'horse' || d.arch === 'dragon' ? 0 : 3), len: 0, face: 1, pitch: 0, ph: 1.2, spd: .3, bl: 1, gill: 0, mouth: 0, al: 1, mood: 'ok', lx: .3, ly: 0 };
    const maxL = (d.arch === 'horse' || d.arch === 'dragon' || d.arch === 'jelly' || d.arch === 'octo') ? h * .82 : w * .6; f.len = maxL * (d.arch === 'fish' ? .9 : 1) / (d.arch === 'fish' && d.H > .85 ? 1.05 : 1); OA.fish(c, f, 1.3); }
  else if(spec.kind === 'pl'){ OA.plant(c, { d: spec.d, x: w / 2, y: h - 6, h: h * .8, w: h * .6, id: 3 }, 1, .6); }
  else if(spec.kind === 'dc'){ OA.decor(c, { d: spec.d, x: w / 2, y: h - 6, s: Math.min(.62, h / 150), id: 3 }, 1, 0); }
  c.restore(); if(tcv){ c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, tcv.width, tcv.height); c0.setTransform(1, 0, 0, 1, 0, 0); c0.drawImage(tcv, 0, 0); }
  if(++TCn > 500){ TC = {}; TCn = 1; } return TC[key] = cv.toDataURL();
};
})();
