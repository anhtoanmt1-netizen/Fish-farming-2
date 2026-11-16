/* OCEAN LIFE – Giao diện: thanh trạng thái, bảng thông tin cá, cửa hàng (xem trước động), bộ sưu tập, lai tạo, thuốc, trang trí, nhiệm vụ, ví, nhật ký, cài đặt, chụp ảnh */
(() => {
'use strict';
const OD = window.OD, OA = window.OA, OC = window.OC, X = window.SPX, G = window.SPXGames;
const S = () => OC.S(), now = () => Date.now(), cl = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtN = n => Math.round(n).toLocaleString('vi-VN');
const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 3600 ? Math.floor(s / 3600) + 'g ' + Math.floor(s % 3600 / 60) + 'p' : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const tier = d => OD.TIERS[d.tier], stg = f => OC.stageOf(f);
let root, panel = null, shopTab = 'fish', shopSel = null, collTab = 'A', questTab = 's', decoTab = 'pl', potCat = 'Tăng trưởng', breedSel = { a: null, b: null }, pvH = null, infoOpen = true;
let liveN = 0;

/* ---------- bộ biểu tượng SVG đồng bộ ---------- */
const ICN = {
  back: '<path d="M15 5l-7 7 7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M7.8 13c1.4-2.8 2.8-2.8 4.2 0s2.8 2.8 4.200 0"/><path d="M8 9.600c1.300-2 2.700-2 4 0s2.700 2 4 0" opacity=".55"/>',
  feed: '<circle class="f" cx="8" cy="5.500" r="1.600"/><circle class="f" cx="13.500" cy="4" r="1.600"/><circle class="f" cx="17" cy="8" r="1.600"/><circle class="f" cx="11" cy="9.500" r="1.600"/><path d="M4 14h16l-1.800 5.200a1.500 1.500 0 01-1.400 1H7.200a1.500 1.500 0 01-1.400-1z"/>',
  fish: '<path d="M2.500 12c2.600-4.600 7.200-6 11.200-3.400L18.500 6v12l-4.800-2.600C9.700 18 5.100 16.600 2.500 12z"/><circle class="f" cx="8.200" cy="11" r="1"/>',
  shop: '<path d="M5 8.500h14l-1.100 11.500H6.100z"/><path d="M9 8.500V7a3 3 0 016 0v1.500"/>',
  coll: '<path d="M12 4C7.500 4 4 7.500 4 12c0 3 2 6 8 8 6-2 8-5 8-8 0-4.500-3.500-8-8-8z"/><path d="M12 20V4M12 20L7.500 5M12 20l4.500-15M12 20L4.500 14.500M12 20l7.500-5.500"/>',
  breed: '<path d="M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/><path d="M9.200 6.500h5.600M9.200 17.500h5.600"/>',
  pot: '<path d="M9 3h6M10 3v6l-5.200 9.200A2 2 0 006.500 21h11a2 2 0 001.700-2.800L14 9V3"/><path d="M7.600 15h8.800"/>',
  deco: '<path d="M12 21v-8M12 13c-3.400 0-5.500-2.200-5.500-5.500M12 13c3.400 0 5.500-2.200 5.500-6M12 17.500c-2 0-3.500-1-4-3.200M8 21h8"/><circle class="f" cx="6.500" cy="6.200" r="1.300"/><circle class="f" cx="17.500" cy="5.200" r="1.300"/>',
  quest: '<rect x="4.500" y="5" width="15" height="16" rx="2.500"/><path d="M9 3.500h6V7H9z"/><path d="M8.500 14l2.500 2.500 4.500-5"/>',
  photo: '<path d="M4 8.500h3L8.500 6h7L17 8.500h3V19H4z"/><circle cx="12" cy="13.500" r="3.500"/>',
  log: '<path d="M6 4h10a2 2 0 012 2v14H8a2 2 0 01-2-2z"/><path d="M6 18a2 2 0 002 2M10 8.500h5M10 12.500h5"/>',
  set: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
};
const I = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICN[k]}</svg>`;
const COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.500" fill="url(#ocGold)" stroke="#a86a00" stroke-width="1.200"/><circle cx="12" cy="12" r="7.600" fill="none" stroke="#b9780a" stroke-width="1" opacity=".7"/><path d="M7.800 13c1.400-2.800 2.800-2.800 4.200 0s2.800 2.800 4.200 0" fill="none" stroke="#8a5300" stroke-width="1.600" stroke-linecap="round"/><path d="M7.500 8.500a5.500 5.500 0 013-2.200" fill="none" stroke="#fff" stroke-width="1.300" stroke-linecap="round" opacity=".8"/></svg>';
let shT = 0, fxNext = false, lastBurst = 0;
const fishF = { stg: -1, rar: -1, fav: false, mut: false, ready: false, coin: false, q: '', sort: 'new', col: '' };
const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];

const CSS = `
.oc{--ink:#f3fbff;--ink2:#b4d6ea;--mut:#8db4cd;--gold:#ffd86b;--gold2:#f2a516;--teal:#5eead4;--coral:#ff8fa3;--lav:#b79cff;--line:rgba(255,255,255,.2);--glass:rgba(9,40,70,.56);--panel:linear-gradient(180deg,rgba(16,64,104,.95),rgba(6,30,58,.98));--ease:cubic-bezier(.22,.9,.28,1);position:fixed;inset:0;z-index:45;background:#06182b;color:var(--ink);font-family:'Nunito','Be Vietnam Pro','Montserrat',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-font-smoothing:antialiased}
.oc[hidden]{display:none}
.oc button{color:inherit;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden;transition:transform .16s var(--ease),background .2s,border-color .2s,box-shadow .2s,opacity .2s}
.oc svg.ic{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;display:block}
.oc svg.ic .f{fill:currentColor;stroke:none}
#ocC{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.ocRip{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,0) 70%);transform:scale(0);animation:ocRip .55s ease-out forwards;pointer-events:none}
@keyframes ocRip{to{transform:scale(1);opacity:0}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes ocUp{from{transform:translateY(26px) scale(.98);opacity:0}to{transform:none;opacity:1}}
@keyframes ocDown{to{transform:translateY(40px);opacity:0}}
@keyframes ocLeft{from{transform:translateX(-40px);opacity:0}to{transform:none;opacity:1}}
@keyframes ocPop{from{transform:scale(.88);opacity:0}to{transform:none;opacity:1}}
@keyframes ocFx{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ocCoinPop{40%{transform:scale(1.12)}}
@keyframes ocShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes ocSheen{from{transform:translateX(-120%) skewX(-20deg)}to{transform:translateX(260%) skewX(-20deg)}}
@keyframes ocPulse{50%{box-shadow:0 0 0 7px rgba(94,234,212,0),0 6px 18px rgba(94,234,212,.5)}}
/* ---- thanh trên ---- */
.ocTop{position:absolute;left:0;right:0;top:0;display:flex;gap:6px;align-items:center;padding:calc(7px + env(safe-area-inset-top)) 9px 6px;pointer-events:none}
.ocTop>*{pointer-events:auto}
.ocB{width:38px;height:38px;border-radius:50%;background:var(--glass);border:1px solid var(--line);color:#fff;font-size:19px;display:grid;place-items:center;backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3);padding:0;box-shadow:0 4px 14px rgba(0,20,50,.3),inset 0 1px 0 rgba(255,255,255,.22)}
.ocB:active{transform:scale(.9)}.ocB.big{width:50px;height:50px;font-size:24px}
.ocB.on{background:linear-gradient(145deg,#5eead4,#1aa6b8);border-color:#fff;box-shadow:0 0 0 3px rgba(94,234,212,.3),0 6px 18px rgba(26,166,184,.55);animation:ocPulse 1.8s infinite}
.ocCoin{height:38px;padding:0 13px 0 6px;border-radius:99px;background:linear-gradient(180deg,rgba(60,46,8,.6),rgba(30,26,8,.55));border:1.5px solid rgba(255,216,107,.85);color:var(--gold);font-weight:900;font-size:14.5px;display:flex;align-items:center;gap:6px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 14px rgba(0,20,50,.3),inset 0 1px 0 rgba(255,236,170,.3);font-variant-numeric:tabular-nums}
.ocCoin svg{width:26px;height:26px;flex:none}.ocCoin.pop{animation:ocCoinPop .4s var(--ease)}
.ocLv{flex:1;min-width:64px;max-width:190px;height:38px;display:flex;align-items:center;gap:7px;background:var(--glass);border-radius:99px;padding:0 11px 0 4px;border:1px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 14px rgba(0,20,50,.3),inset 0 1px 0 rgba(255,255,255,.2)}
.ocLvB{width:30px;height:30px;flex:none;border-radius:50%;display:grid;place-items:center;background:conic-gradient(from 200deg,#b79cff,#5eead4,#ffd86b,#ff8fa3,#b79cff);padding:2px}
.ocLvB b{width:100%;height:100%;border-radius:50%;display:grid;place-items:center;background:#0a3258;font-size:13px;font-weight:900}
.ocLvT{flex:1;min-width:0;font-size:9.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--ink2)}
.ocLvT i{display:block;height:7px;border-radius:7px;background:rgba(255,255,255,.18);margin-top:3px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.3)}.ocLvT i b{display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,#5eead4,#ffd86b);width:0;transition:width .5s var(--ease)}
.ocTools{display:flex;gap:2px;padding:2px;border-radius:99px;background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 14px rgba(0,20,50,.3),inset 0 1px 0 rgba(255,255,255,.2)}
.ocTools .ocB{width:34px;height:34px;font-size:17px;background:transparent;border:0;box-shadow:none;backdrop-filter:none}
.ocTools .ocB:active{background:rgba(255,255,255,.18)}
.ocSide{position:absolute;right:9px;top:calc(62px + env(safe-area-inset-top));display:flex;flex-direction:column;align-items:center;gap:8px}
.ocZoom{display:flex;flex-direction:column;border-radius:99px;background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);overflow:hidden;box-shadow:0 4px 14px rgba(0,20,50,.3)}
.ocZoom .ocB{width:38px;height:36px;border-radius:0;background:transparent;border:0;box-shadow:none;backdrop-filter:none;font-size:18px}.ocZoom .ocB+.ocB{border-top:1px solid var(--line)}
#ocFeedB{background:linear-gradient(145deg,#ffb36b,#f0662c);border-color:rgba(255,255,255,.7)}
#ocFeedB.on{background:linear-gradient(145deg,#5eead4,#1aa6b8)}
.ocB.gold{background:linear-gradient(145deg,#ffe27a,#f2a516);border-color:rgba(255,255,255,.7);color:#5a3500}
.ocB.dotOn::after{content:"";position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:50%;background:#ff4a6a;border:1.5px solid #fff}
/* ---- thanh điều hướng ---- */
.ocNav{z-index:4;position:absolute;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:5px;border-radius:26px;background:linear-gradient(180deg,rgba(14,56,92,.8),rgba(6,28,54,.86));border:1px solid var(--line);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 10px 30px rgba(0,12,32,.5),inset 0 1px 0 rgba(255,255,255,.22)}
.ocNav button{height:54px;border-radius:20px;background:transparent;color:var(--ink2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:0;min-width:0}
.ocNav button .ni{width:30px;height:24px;border-radius:12px;display:grid;place-items:center;font-size:19px;transition:.25s var(--ease)}
.ocNav button span.nl{font-size:9.5px;font-weight:800;letter-spacing:.1px;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.ocNav button:active{transform:scale(.92);background:rgba(255,255,255,.1)}
.ocNav button.on{color:#fff;background:linear-gradient(180deg,rgba(94,234,212,.28),rgba(94,234,212,.08));box-shadow:inset 0 0 0 1px rgba(94,234,212,.5)}
.ocNav button.on .ni{background:linear-gradient(145deg,#5eead4,#1aa6b8);color:#04283f;transform:translateY(-2px);box-shadow:0 4px 12px rgba(26,166,184,.6)}
.ocDot{position:absolute;top:4px;right:calc(50% - 20px);width:10px;height:10px;border-radius:50%;background:#ff4a6a;border:1.5px solid #fff;animation:ocPulse 1.6s infinite}
/* ---- HUD cho ăn ---- */
.ocHud{z-index:3;position:absolute;left:8px;right:8px;bottom:calc(80px + env(safe-area-inset-bottom));padding:9px 10px;border-radius:20px;background:linear-gradient(180deg,rgba(14,56,92,.88),rgba(6,28,54,.9));border:1px solid var(--line);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-size:12px;font-weight:700;display:flex;gap:6px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 24px rgba(0,12,32,.45);animation:ocUp .25s var(--ease)}
.ocHud[hidden]{display:none}
.ocFd{padding:7px 11px;border-radius:99px;background:rgba(255,255,255,.1);border:1.5px solid transparent;color:#fff;font-weight:800;font-size:11px}.ocFd.on{border-color:var(--gold);background:rgba(255,216,107,.22);color:var(--gold)}
/* ---- bảng thông tin cá ---- */
.ocInfo{position:absolute;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));max-height:56%;overflow:auto;border-radius:24px;background:var(--panel);border:1px solid var(--line);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:11px;touch-action:pan-y;animation:ocUp .3s var(--ease);box-shadow:0 12px 34px rgba(0,12,32,.55),inset 0 1px 0 rgba(255,255,255,.22);scrollbar-width:none}
.ocInfo::-webkit-scrollbar{display:none}
.ocInfo[hidden]{display:none}
.ocIH{display:flex;gap:11px;align-items:center}.ocIH img{width:84px;height:59px;border-radius:15px;background:#5fb8e8;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.65),0 6px 14px rgba(0,0,0,.3)}
.ocIH b{font-size:15.5px;display:block;margin-bottom:3px;font-weight:900}.ocTag{display:inline-block;font-size:9.5px;font-weight:900;padding:2px 9px;border-radius:99px;color:#06182b;margin:0 4px 2px 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.55)}
.ocBars{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin:10px 0 8px}
.ocBar{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800}.ocBar span{width:62px;color:var(--ink2);flex:none}.ocBar i{flex:1;height:8px;border-radius:8px;background:rgba(255,255,255,.16);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.3)}.ocBar i b{display:block;height:100%;border-radius:8px;position:relative;transition:width .4s var(--ease)}.ocBar i b::after,.ocPg b::after{content:"";position:absolute;left:0;right:0;top:0;height:45%;background:linear-gradient(rgba(255,255,255,.45),rgba(255,255,255,0))}.ocBar em{font-style:normal;width:30px;text-align:right}
.ocRows{font-size:11.5px;line-height:1.6;color:var(--ink2)}.ocRows b{color:#fff}
.ocAct{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:9px}
.ocAct button,.ocBtn{min-height:44px;border-radius:15px;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.08));color:#fff;font-weight:800;font-size:10.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.ocAct button span:first-child{font-size:17px;line-height:1}.ocAct button:active,.ocBtn:active{transform:scale(.94)}
.ocAct button.warn{background:linear-gradient(180deg,rgba(255,110,140,.4),rgba(255,74,106,.22));border-color:rgba(255,143,163,.5)}.ocAct button.gold{background:linear-gradient(180deg,rgba(255,216,107,.4),rgba(242,165,22,.2));border-color:rgba(255,216,107,.55)}
.ocAct button.dis,.ocBtn.dis{opacity:.42;filter:saturate(.4);cursor:not-allowed}
.ocBtn{flex-direction:row;padding:0 16px;font-size:12.5px;gap:6px;min-height:42px}
.ocBtn.pri{background:linear-gradient(180deg,#ffe27a,#f2a516);color:#4a2a00;border-color:rgba(255,255,255,.6);box-shadow:0 4px 12px rgba(242,165,22,.4),inset 0 1px 0 rgba(255,255,255,.65)}
.ocBtn.pri.dis{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.1));color:#fff;box-shadow:none}
.ocBtn.grn{background:linear-gradient(180deg,#3de0a0,#0a9a6a)}
.ocBtn.warn{background:linear-gradient(180deg,rgba(255,110,140,.45),rgba(255,74,106,.3))!important;border-color:rgba(255,143,163,.6)}
/* ---- bảng chức năng ---- */
.ocSheet{position:absolute;inset:0;padding-bottom:calc(76px + env(safe-area-inset-bottom));box-sizing:border-box;background:radial-gradient(ellipse at 50% 0,rgba(2,18,40,.35),rgba(2,12,28,.7));display:flex;align-items:flex-end;justify-content:center;animation:fade .22s;touch-action:pan-y}
.ocSheet[hidden]{display:none}.ocSheet.out{animation:fade .2s reverse forwards}
.ocSh{width:100%;max-width:660px;height:78%;max-height:100%;background:var(--panel);border-radius:28px 28px 0 0;border:1px solid var(--line);border-bottom:0;display:flex;flex-direction:column;animation:ocUp .34s var(--ease);box-shadow:0 -14px 44px rgba(0,10,30,.55),inset 0 1px 0 rgba(255,255,255,.25);position:relative}
.ocSheet.out .ocSh{animation:ocDown .2s ease-in forwards}
.ocSh::before{content:"";position:absolute;top:7px;left:50%;width:42px;height:4px;margin-left:-21px;border-radius:4px;background:rgba(255,255,255,.28)}
.ocShH{display:flex;align-items:center;justify-content:space-between;padding:20px 16px 8px;font-size:17px;font-weight:900;letter-spacing:.2px}
.ocShH b{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,#fff,#bff3ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.ocX{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:15px;padding:0;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18)}
.ocShB{flex:1;overflow-y:auto;padding:4px 13px 16px;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.25) transparent}
.ocShB.fx>*{animation:ocFx .3s var(--ease) both}
.ocTabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 9px;scrollbar-width:none}.ocTabs::-webkit-scrollbar{display:none}
.ocTab{flex:none;padding:8px 14px;border-radius:99px;background:rgba(255,255,255,.09);color:var(--ink2);font-size:12px;font-weight:800;border:1px solid rgba(255,255,255,.1)}.ocTab:active{transform:scale(.94)}
.ocTab.on{background:linear-gradient(180deg,#ffe27a,#f2a516);color:#3d2400;border-color:rgba(255,255,255,.6);box-shadow:0 3px 10px rgba(242,165,22,.35)}
.ocGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.ocCard{border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16);padding:6px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:800;text-align:center;position:relative;color:#fff;box-shadow:0 4px 12px rgba(0,16,40,.28),inset 0 -3px 0 var(--rc,transparent)}
.ocCard:active{transform:scale(.95)}.ocCard img{width:100%;border-radius:13px;background:#5fb8e8;aspect-ratio:120/84;object-fit:cover;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}.ocCard small{font-size:9.5px;color:var(--mut);font-weight:700}
.ocCard .pr{color:#4a2a00;font-weight:900;background:linear-gradient(180deg,#ffe27a,#f2a516);padding:2px 10px;border-radius:99px;font-size:10.5px}
.ocCard.lock{filter:saturate(.55) brightness(.85)}.ocCard.lock img{filter:grayscale(.5)}.ocCard .bd{position:absolute;top:8px;right:9px;font-size:13px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))}
.ocCard[data-t="4"]::after,.ocCard[data-t="5"]::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);animation:ocSheen 3.2s ease-in-out infinite;pointer-events:none}
.ocCard[data-t="3"],.ocCard[data-t="4"],.ocCard[data-t="5"]{box-shadow:0 4px 14px rgba(0,16,40,.3),0 0 14px -2px var(--rc),inset 0 -3px 0 var(--rc)}
.ocRow{display:flex;gap:11px;align-items:center;padding:9px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.13);margin-bottom:8px}
.ocRow img{width:68px;height:48px;border-radius:12px;background:#5fb8e8;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}.ocRow>div{flex:1;min-width:0;font-size:11.5px;line-height:1.45;color:var(--ink2)}.ocRow b{font-size:13px;display:block;color:#fff;font-weight:900}.ocRow small{color:var(--mut);font-weight:700}
.ocFil{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}.ocFil input,.ocFil select,.ocSw select{height:36px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:0 11px;font-size:12.5px;font-family:inherit;font-weight:700;width:auto;flex:1;min-width:90px;outline:0}.ocFil input:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(94,234,212,.2)}.ocFil select option,.ocSw select option{color:#000}.ocSw select{flex:none;min-width:110px}
.ocDlg{position:absolute;inset:0;background:rgba(2,12,28,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:5;animation:fade .18s;touch-action:pan-y}.ocDlg[hidden]{display:none}
.ocDlgC{width:100%;max-width:430px;max-height:88%;overflow:auto;background:var(--panel);border:1px solid rgba(255,255,255,.28);border-radius:26px;padding:18px;animation:ocPop .28s var(--ease);box-shadow:0 20px 60px rgba(0,8,24,.6),inset 0 1px 0 rgba(255,255,255,.25)}
.ocDlgC h3{margin:0 0 9px;font-size:17px;font-weight:900}.ocDlgC p{font-size:13px;color:var(--ink2);line-height:1.55;margin:7px 0}.ocBtns{display:flex;gap:9px;margin-top:14px}.ocBtns .ocBtn{flex:1;justify-content:center;min-height:46px;font-size:13.5px}
.ocDlgC input[type=text]{width:100%;height:44px;border-radius:14px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.28);color:#fff;padding:0 13px;font-size:15px;font-family:inherit;box-sizing:border-box;outline:0}.ocDlgC input[type=text]:focus{border-color:var(--teal)}
.ocToast{position:absolute;left:50%;top:calc(60px + env(safe-area-inset-top));transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none;z-index:9;width:92%}
.ocToast div{padding:9px 16px;border-radius:99px;background:rgba(8,36,64,.92);border:1px solid rgba(255,255,255,.3);font-size:12.5px;font-weight:800;text-align:center;box-shadow:0 8px 22px rgba(0,10,30,.45);backdrop-filter:blur(10px);animation:ocUp .3s var(--ease),fade .3s reverse 2.6s forwards;max-width:100%}
.ocToast .ok{border-color:#4dffb0;color:#c6ffe6}.ocToast .err{border-color:#ff6a8a;color:#ffc9d4}.ocToast .warn{border-color:var(--gold);color:#fff0b8}
.ocPv{width:100%;border-radius:22px;background:#5fb8e8;aspect-ratio:16/9;display:block;margin-bottom:9px;box-shadow:0 0 0 2px rgba(255,255,255,.4),0 10px 24px rgba(0,16,40,.4)}
.ocSec{font-size:11.5px;font-weight:900;color:var(--gold);text-transform:uppercase;letter-spacing:.8px;margin:15px 0 8px;display:flex;align-items:center;gap:8px}.ocSec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,216,107,.5),transparent)}
.ocTbl{width:100%;font-size:12px;border-collapse:collapse}.ocTbl td{padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.1)}.ocTbl td:first-child{color:var(--ink2)}.ocTbl td:last-child{text-align:right;font-weight:900;color:var(--gold)}
.ocPg{height:9px;border-radius:9px;background:rgba(255,255,255,.16);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.3);margin-top:4px}.ocPg b{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#5eead4,#ffd86b);position:relative;transition:width .5s var(--ease)}
.ocSil{filter:brightness(0) opacity(.5)}
.ocPed{font-size:11.5px;line-height:1.55}.ocPed div{padding-left:14px;border-left:2px solid rgba(255,255,255,.25);margin-left:6px}
.ocSlot{flex:1;border-radius:20px;border:2px dashed rgba(255,255,255,.35);min-height:116px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11.5px;font-weight:800;padding:7px;background:rgba(255,255,255,.06);color:#fff}.ocSlot img{width:80%;border-radius:12px;background:#5fb8e8;box-shadow:0 0 0 2px rgba(255,255,255,.5)}
.ocSw{display:flex;align-items:center;justify-content:space-between;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.1);font-size:13px;font-weight:700;gap:8px}
.ocSw input[type=range]{width:46%;accent-color:var(--gold)}
.ocSw input[type=checkbox]{appearance:none;-webkit-appearance:none;width:46px;height:26px;border-radius:26px;background:rgba(255,255,255,.2);position:relative;transition:.2s;flex:none;border:0;outline:0}
.ocSw input[type=checkbox]::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.22s var(--ease);box-shadow:0 2px 5px rgba(0,0,0,.3)}
.ocSw input[type=checkbox]:checked{background:linear-gradient(90deg,#1aa6b8,#5eead4)}.ocSw input[type=checkbox]:checked::after{transform:translateX(20px)}
.ocPhoto{position:absolute;left:0;right:0;bottom:calc(22px + env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center;animation:ocUp .3s var(--ease)}
.ocPhoto .ocBtn{background:rgba(8,36,64,.6);backdrop-filter:blur(10px);border-radius:99px;min-width:46px;justify-content:center}.ocPhoto .ocBtn.pri{background:linear-gradient(180deg,#ffe27a,#f2a516)}
/* ---- hiệu ứng ăn mừng ---- */
.ocFxL{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:8}
.ocFxL i{position:absolute;left:50%;top:50%;width:var(--s,8px);height:var(--s,8px);margin:-4px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c);animation:ocBurst var(--d,.9s) cubic-bezier(.1,.7,.3,1) forwards}
@keyframes ocBurst{from{transform:translate(0,0) scale(1)}to{transform:translate(var(--x),var(--y)) scale(.1);opacity:0}}
.ocFxL.sm i{--s:5px}
/* ---- ngang ---- */
html.ls .ocNav{left:auto;right:8px;top:calc(56px + env(safe-area-inset-top));bottom:8px;width:64px;grid-template-columns:1fr;grid-template-rows:repeat(7,1fr);border-radius:24px}
html.ls .ocNav button{height:auto;min-height:0}html.ls .ocDot{right:6px}
html.ls .ocSide{right:82px;top:calc(52px + env(safe-area-inset-top))}
html.ls .ocSheet{justify-content:flex-start;align-items:stretch;padding:0 80px 0 0}
html.ls .ocSh{max-width:min(540px,60%);height:100%;border-radius:0 28px 28px 0;border:1px solid var(--line);border-left:0;animation-name:ocLeft}
html.ls .ocSh::before{display:none}html.ls .ocShH{padding-top:14px}
html.ls .ocInfo{right:auto;width:min(430px,50%);bottom:8px;max-height:72%}
html.ls .ocHud{right:82px;bottom:8px}
html.ls .ocTop{padding-right:80px}
html.ls .ocGrid{grid-template-columns:repeat(3,1fr)}
@media (max-width:370px){.ocTools .ocB{width:30px;height:32px;font-size:15px}.ocCoin{font-size:13px;padding-right:9px}.ocNav button span.nl{font-size:8.5px}.ocGrid{gap:6px}}
@media (min-width:700px){.ocGrid{grid-template-columns:repeat(4,1fr)}.ocSh{border-radius:28px}.ocSheet{align-items:center}.ocSh{height:84%;border-bottom:1px solid var(--line)}.ocSheet{padding-bottom:calc(76px + env(safe-area-inset-bottom))}}
@media (prefers-reduced-motion:reduce){.oc *{animation-duration:.01s!important;animation-iteration-count:1!important;transition-duration:.01s!important}}
html.oc-standalone .ocTop [data-act=exit]{display:none}
`;
{ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }

/* ---------- khung ---------- */
function build(){
  const app = document.getElementById('app') || document.body; root = document.createElement('div'); root.className = 'oc'; root.hidden = true; app.appendChild(root);
  root.innerHTML = `<canvas id="ocC"></canvas><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ocGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#ffc83d"/><stop offset="1" stop-color="#d98a0b"/></linearGradient></defs></svg>
  <div class="ocTop"><button class="ocB" data-act="exit" aria-label="Thoát">${I('back')}</button><button class="ocCoin" data-act="wallet" aria-label="Ví xu">${COIN}<b id="ocCoins">0</b></button><div class="ocLv"><div class="ocLvB"><b id="ocLvN">1</b></div><div class="ocLvT">Cấp độ<i><b id="ocXp"></b></i></div></div>
    <div class="ocTools"><button class="ocB" id="ocWx" data-act="wx" aria-label="Thời tiết">☀️</button><button class="ocB" data-act="photo" aria-label="Chụp ảnh">${I('photo')}</button><button class="ocB" data-act="log" aria-label="Nhật ký">${I('log')}</button><button class="ocB" data-act="set" aria-label="Cài đặt">${I('set')}</button></div></div>
  <div class="ocSide"><button class="ocB big" id="ocFeedB" data-act="feed" aria-label="Cho ăn">${I('feed')}</button><button class="ocB big gold" data-act="harv" aria-label="Thu tất cả xu">${I('coin')}</button><div class="ocZoom"><button class="ocB" data-act="zin" aria-label="Phóng to">${I('plus')}</button><button class="ocB" data-act="zout" aria-label="Thu nhỏ">${I('minus')}</button></div></div>
  <div class="ocHud" id="ocHud" hidden></div><div class="ocInfo" id="ocInfo" hidden></div>
  <div class="ocNav" id="ocNav">${[['fish', 'Cá'], ['shop', 'Cửa hàng'], ['coll', 'Sưu tập'], ['breed', 'Lai tạo'], ['pot', 'Thuốc'], ['deco', 'Trang trí'], ['quest', 'Nhiệm vụ']].map(([k, n]) => `<button data-act="nav" data-k="${k}" id="nav_${k}" aria-label="${n}"><span class="ni">${I(k)}</span><span class="nl">${n}</span></button>`).join('')}</div>
  <div class="ocSheet" id="ocSheet" hidden></div><div class="ocDlg" id="ocDlg" hidden></div><div class="ocToast" id="ocToast"></div>`;
  root.addEventListener('pointerdown', ripple, { passive: true });
  root.addEventListener('click', e => { if(e.target.id === 'ocSheet'){ closeSheet(); return; } const el = e.target.closest('[data-act]'); if(!el) return; if(/Tab$|^ff$|^ft$|^shopSel$|^shopBack$|^potCat$/.test(el.dataset.act)) fxNext = true; if(el.classList.contains('dis')){ toast(el.dataset.why || 'Không khả dụng lúc này', 'warn'); return; } const f = ACT[el.dataset.act]; if(f){ OC.audioUnlock(); f(el.dataset, el, e); } });
  root.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if(el && IN[el.dataset.in]) IN[el.dataset.in](el.value, el); });
  root.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if(el && IN[el.dataset.ch]) IN[el.dataset.ch](el.value, el); });
  OC.init($('#ocC')); OC.fx = fxEvent; OC.ui = { refresh, toast, select, back, offlineReport }; new ResizeObserver(() => { if(!root.hidden) OC.resize(); }).observe(root); refresh('all');
}

/* ---------- hoạt ảnh tương tác ---------- */
function ripple(e){ const b = e.target.closest && e.target.closest('button'); if(!b) return; const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.7, sp = document.createElement('span'); sp.className = 'ocRip'; sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`; b.appendChild(sp); setTimeout(() => sp.remove(), 600); }
function burst(n, small){ if(!root || root.hidden) return; const t = now(); if(t - lastBurst < 250) return; lastBurst = t; n = Math.max(4, Math.round(n * ((S() && S().set.parts) || 1))); const L = document.createElement('div'); L.className = 'ocFxL' + (small ? ' sm' : ''); const cols = ['#ffd86b', '#5eead4', '#ff8fa3', '#b79cff', '#ffffff']; for(let i = 0; i < n; i++){ const a = Math.random() * 6.283, r = (small ? 50 : 80) + Math.random() * (small ? 70 : 150), q = document.createElement('i'); q.style.cssText = `--c:${cols[i % 5]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r - 30}px;--s:${4 + Math.random() * 7}px;--d:${.7 + Math.random() * .6}s`; L.appendChild(q); } root.appendChild(L); setTimeout(() => L.remove(), 1500); }
function fxEvent(n){ if(!root || root.hidden) return; if(n === 'coin'){ const p = $('.ocCoin'); if(p){ p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); } } else if(n === 'evolve' || n === 'hatch' || n === 'gem') burst(n === 'gem' ? 22 : 18); else if(n === 'buy') burst(9, true); else if(n === 'err'){ const p = $('.ocCoin'); if(p){ p.style.animation = 'none'; void p.offsetWidth; p.style.animation = 'ocShake .35s'; } } }
function toast(msg, type = 'info'){ const h = $('#ocToast'); if(!h) return; const d = document.createElement('div'); d.className = type; d.textContent = msg; h.appendChild(d); while(h.children.length > 3) h.firstChild.remove(); setTimeout(() => d.remove(), 3000); }
function refresh(kind){
  if(!root) return; const s = S(); if(!s) return;
  if(kind === 'all' || kind === 'coin' || kind === 'tick'){ const c = $('#ocCoins'); if(c){ const v = fmtN(s.coins); if(c.textContent !== v){ c.textContent = v; if(kind !== 'all'){ const p = c.parentNode; p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); } } } }
  if(kind === 'all' || kind === 'lv' || kind === 'xp' || kind === 'tick'){ $('#ocLvN').textContent = s.lvl; $('#ocXp').style.width = Math.min(100, s.xp / OD.LEVEL_XP(s.lvl) * 100) + '%'; }
  if(kind === 'all' || kind === 'tick'){ const night = OA.skyColors(s.time).day < .35, wx = OC.wx.k, ic = { clear: '☀️', sun: '🌤️', cloud: '☁️', rain: '🌧️', heavy: '🌧️', wind: '💨', storm: '⛈️', magic: '✨' }[wx]; $('#ocWx').textContent = night && ['clear', 'sun'].includes(wx) ? '🌙' : ic; }
  if(kind === 'all' || kind === 'quest' || kind === 'tick'){ const rd = Object.keys(s.q.ready || {}).filter(id => !s.q.claimed[id]).length; const b = $('#nav_quest'); if(b){ let d = b.querySelector('.ocDot'); if(rd && !d){ d = document.createElement('i'); d.className = 'ocDot'; b.appendChild(d); } else if(!rd && d) d.remove(); } }
  if(kind === 'all' || kind === 'mode' || kind === 'food') hud();
  if(kind === 'tick' && OC.sel) renderInfo();
  if(kind === 'tick' && panel && panel.live){ liveN = (liveN + 1) % 3; if(!liveN) reRender(); }
}
function hud(){
  const h = $('#ocHud'), m = OC.mode, s = S(); $('#ocFeedB').classList.toggle('on', m === 'feed');
  if(m === 'feed'){ h.hidden = false; h.innerHTML = `<span>Chạm/kéo vào hồ để thả:</span>` + OD.FOODS.map(f => `<button class="ocFd ${s.feedType === f.id ? 'on' : ''}" data-act="foodSel" data-id="${f.id}">${f.n.replace('Thức ăn ', '')} ×${s.inv.food[f.id] || 0}</button>`).join('') + `<button class="ocBtn" data-act="mode" data-m="view">Xong</button>`; }
  else if(m === 'place'){ h.hidden = false; h.innerHTML = `<span>Chạm vào hồ để đặt vật phẩm</span><button class="ocBtn" data-act="mode" data-m="view">Xong</button>`; }
  else if(m === 'edit'){ h.hidden = false; h.innerHTML = `<span>Kéo vật phẩm trong hồ để di chuyển</span><button class="ocBtn" data-act="mode" data-m="view">Xong</button>`; }
  else h.hidden = true;
  const inf = $('#ocInfo'); if(m !== 'view') inf.hidden = true; else if(OC.sel) inf.hidden = false;
}
/* ---------- bảng chung ---------- */
function sheet(name, title, fn, live){ stopPv(); panel = { name, title, fn, live }; const sh = $('#ocSheet'); clearTimeout(shT); sh.classList.remove('out'); sh.hidden = false; sh.innerHTML = `<div class="ocSh"><div class="ocShH"><b>${title}</b><button class="ocX" data-act="close">✕</button></div><div class="ocShB"></div></div>`; fn($('.ocShB', sh)); $$('#ocNav button').forEach(b => b.classList.toggle('on', b.dataset.k === name)); }
function closeSheet(){ panel = null; stopPv(); const sh = $('#ocSheet'); $$('#ocNav button').forEach(b => b.classList.remove('on')); if(sh.hidden) return; sh.classList.add('out'); clearTimeout(shT); shT = setTimeout(() => { if(!panel) sh.hidden = true; sh.classList.remove('out'); }, 200); }
function reRender(){ if(!panel) return; const b = $('.ocShB'); if(!b) return; const st = b.scrollTop, act = document.activeElement; if(act && (act.tagName === 'INPUT' || act.tagName === 'SELECT')) return; stopPv(); panel.fn(b); b.scrollTop = st; if(fxNext){ fxNext = false; b.classList.remove('fx'); void b.offsetWidth; b.classList.add('fx'); setTimeout(() => b.classList.remove('fx'), 450); } }
function dlg(html, buttons){ const d = $('#ocDlg'); d.hidden = false; d.innerHTML = `<div class="ocDlgC">${html}<div class="ocBtns">${buttons.map((b, i) => `<button class="ocBtn ${b.c || ''}" data-act="dlgBtn" data-i="${i}">${b.t}</button>`).join('')}</div></div>`; d._b = buttons; }
function closeDlg(){ $('#ocDlg').hidden = true; }
const thumbF = f => OA.thumb({ kind: 'sp', id: f.sp, d: f.d, stg: stageOf(f), g: f.g }, 120, 84), stageOf = f => OC.stageOf(f);
const thumbSp = (d, stg = 3, sil = false) => OA.thumb({ kind: 'sp', id: d.id, d, stg, sil }, 120, 84);
const bar = (v, col, label) => `<div class="ocBar"><span>${label}</span><i><b style="width:${cl(v, 0, 100)}%;background:${col}"></b></i><em>${Math.round(v)}%</em></div>`;
const tag = d => `<span class="ocTag" style="background:${tier(d).c}">${tier(d).n}</span>`;
/* ---------- thông tin cá ---------- */
function select(f){ const el = $('#ocInfo'); if(!f){ el.hidden = true; return; } el.hidden = false; infoOpen = true; renderInfo(); }
function renderInfo(){
  const f = OC.sel, el = $('#ocInfo'); if(!f || OC.fish.indexOf(f) < 0){ el.hidden = true; OC.sel = null; return; } const s = S(), d = f.d, st = stageOf(f), t = now(), adult = st === 3, size = Math.round(d.L * f.g.size * (.42 + .58 * f.grow / 100) / 4 * 10) / 10;
  const price = OC.sellPrice(f), ready = adult && t >= f.cd, nextInc = adult ? mmss(f.inc.n - t) : '—'; const why = { sell: f.lock ? 'Cá đang khóa bảo vệ, hãy mở khóa trước' : '', harv: f.inc.acc > 0 ? '' : 'Chưa có xu để thu', breed: adult ? '' : 'Cá cần trưởng thành để lai tạo' };
  el.innerHTML = `<div class="ocIH"><img src="${thumbF(f)}" alt="" style="box-shadow:0 0 0 2px ${tier(d).c},0 0 18px ${tier(d).c}99,0 6px 14px rgba(0,0,0,.3)"><div style="flex:1;min-width:0"><b>${f.fav ? '♥ ' : ''}${f.lock ? '🔒 ' : ''}${esc(f.name || d.n)}</b>${tag(d)}<span class="ocTag" style="background:#cfe8ff">${OD.STAGES[st + 1]}</span><span class="ocTag" style="background:#ffd34d">Cấp ${OC.fishLevel(f)}</span>${f.name ? `<br><small style="color:#9fc4e8">${esc(d.n)}</small>` : ''}</div><button class="ocX" data-act="infoToggle">${infoOpen ? '▾' : '▴'}</button></div>`
    + (infoOpen ? `<div class="ocBars">${bar(f.grow, '#4dffd0', 'Tăng trưởng')}${bar(f.hp, '#ff7a8a', 'Sức khỏe')}${bar(f.hun, '#ffb04d', 'Mức no')}${bar(f.joy, '#ffd34d', 'Hạnh phúc')}${bar(f.fr, '#ff7ad1', 'Thân thiện')}</div>
    <div class="ocRows">Kích thước: <b>${size} cm</b> · Tuổi: <b>${mmss(t - f.born)}</b> · Thế hệ: <b>F${f.gen}</b><br>Giá bán: <b style="color:#ffd34d">${fmtN(price)} xu</b> · Thu nhập: <b>${adult ? fmtN(f.inc.acc) + ' xu tích lũy · kế tiếp ' + nextInc : 'khi trưởng thành'}</b><br>Sinh sản: <b>${adult ? (ready ? 'Sẵn sàng' : 'Hồi phục ' + mmss(f.cd - t)) : 'chưa trưởng thành'}</b><br>Tính cách: <b>${f.pers.map(p => OD.PERS[p]).join(', ')}</b><br>Đặc tính: <b>${traits(f) || 'Bình thường'}</b></div>
    <div class="ocAct">
      <button data-act="iFeed"><span>🍤</span>Cho ăn</button><button data-act="iHarv" class="gold ${why.harv ? 'dis' : ''}" data-why="${why.harv}"><span>🪙</span>Thu xu</button><button data-act="iPot"><span>🧪</span>Thuốc</button><button data-act="iBreed" class="${why.breed ? 'dis' : ''}" data-why="${why.breed}"><span>🧬</span>Lai tạo</button>
      <button data-act="iSell" class="warn ${why.sell ? 'dis' : ''}" data-why="${why.sell}"><span>💰</span>Bán</button><button data-act="iLock"><span>${f.lock ? '🔓' : '🔒'}</span>${f.lock ? 'Mở khóa' : 'Khóa'}</button><button data-act="iFav"><span>${f.fav ? '💔' : '♥'}</span>${f.fav ? 'Bỏ thích' : 'Yêu thích'}</button><button data-act="iPed"><span>🌳</span>Phả hệ</button>
      <button data-act="iName"><span>✏️</span>Đổi tên</button><button data-act="iClose"><span>✖</span>Đóng</button></div>` : '');
}
function traits(f){ const g = f.g, a = []; if(g.crown) a.push('👑 ' + OD.CROWNS[g.crown]); if(g.glow > .3 || f.d.fl.includes('g')) a.push('Phát sáng'); if(g.horn || f.d.fl.includes('h')) a.push('Sừng'); if(g.wings || f.d.fl.includes('w')) a.push('Cánh'); if(g.heads === 2 || f.d.fl.includes('d')) a.push('Hai đầu'); if(g.tails === 3 || f.d.fl.includes('t')) a.push('Ba đuôi'); if(g.spikes || f.d.fl.includes('k')) a.push('Gai'); if(g.layers > 1) a.push('Đuôi nhiều tầng'); if(g.foil) a.push('Ánh kim'); g.rare.forEach(r => a.push(r)); if(f.mut.length) a.push('Đột biến ×' + f.mut.length); return a.join(', '); }
/* ---------- xem trước động ---------- */
function stopPv(){ if(pvH){ cancelAnimationFrame(pvH.raf); pvH = null; } }
function startPv(cv, d, o){
  stopPv(); const c = cv.getContext('2d'), W = cv.width, H = cv.height, f = { d, g: Object.assign(OA.G0(), o.g || {}), stg: o.stg, id: 5, x: W / 2, y: H / 2, len: 0, face: 1, tf: 1, pitch: 0, ph: 0, spd: .3, bl: 1, gill: 0, mouth: 0, al: 1, mood: 'ok', lx: .3, ly: 0 }; let t = 0, last = performance.now(), ft = 0; pvH = { raf: 0, o };
  const fit = d.arch === 'fish' ? W * .5 : H * .62, base = Math.max(1, OA.lenOf(d, f.g, 3));
  const tick = ts => { const dt = Math.min(.05, (ts - last) / 1000); last = ts; t += dt; ft += dt; if(ft > 4){ ft = 0; f.tf *= -1; } f.face += (f.tf - f.face) * Math.min(1, dt * 5); f.ph += dt * 4;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fe4ff'); g.addColorStop(1, '#1b7fc6'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.25)'; for(let i = 0; i < 8; i++){ c.beginPath(); c.arc((i * 83 + t * 12) % W, H - ((t * 24 + i * 47) % H), 2 + i % 3, 0, 6.3); c.fill(); }
    f.len = OA.lenOf(d, f.g, f.stg) * (fit / base) * (pvH.o.zoom || 1); f.x = W / 2 + Math.sin(t * .8) * W * .06; f.y = H / 2 + Math.sin(t * 1.3) * 6; f.spd = .3; OA.fish(c, f, t); pvH.raf = requestAnimationFrame(tick); };
  pvH.raf = requestAnimationFrame(tick);
}
const PV = { stg: 3, zoom: 1 };
/* ---------- Cá của tôi ---------- */
function colorOf(f){ const p = OA.pal(f).body, n = parseInt(p.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510; if(l > .85) return 'white'; if(l < .22) return 'dark'; if(mx - mn < 25) return 'gray'; let h; const d = mx - mn; h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return h < 20 || h >= 330 ? 'red' : h < 70 ? 'yellow' : h < 170 ? 'green' : h < 260 ? 'blue' : 'purple'; }
function fishListHTML(){
  const F = fishF; let a = OC.fish.slice(); const t = now();
  if(F.stg >= 0) a = a.filter(f => stageOf(f) === F.stg); if(F.rar >= 0) a = a.filter(f => f.d.tier === F.rar); if(F.fav) a = a.filter(f => f.fav); if(F.mut) a = a.filter(f => f.mut.length || f.g.crown || f.g.rare.length); if(F.ready) a = a.filter(f => stageOf(f) === 3 && t >= f.cd); if(F.coin) a = a.filter(f => f.inc.acc > 0); if(F.col) a = a.filter(f => colorOf(f) === F.col); if(F.q) a = a.filter(f => (f.name + ' ' + f.d.n).toLowerCase().includes(F.q.toLowerCase()));
  const sorts = { new: (x, y) => y.id - x.id, val: (x, y) => OC.sellPrice(y) - OC.sellPrice(x), age: (x, y) => x.born - y.born, size: (x, y) => OC.baseLen(y) - OC.baseLen(x), inc: (x, y) => y.inc.acc - x.inc.acc, rar: (x, y) => y.d.tier - x.d.tier || y.d.val - x.d.val, sp: (x, y) => x.d.idx - y.d.idx };
  a.sort(sorts[F.sort] || sorts.new); const eggs = OC.eggs.length;
  const ch = (k, v, t) => `<button class="ocTab ${F[k] === v ? 'on' : ''}" data-act="ff" data-k="${k}" data-v="${v}">${t}</button>`;
  return `<div class="ocRows" style="margin-bottom:6px">Sinh vật: <b>${OC.fish.length}</b> · Trứng: <b>${eggs}</b> · Sức chứa: <b>${OC.fish.length + eggs}/${S().cap}</b> ${OC.fish.length + eggs >= S().cap * .9 ? '<b style="color:#ffd34d">⚠ hồ gần đầy</b>' : ''}</div>
  <div class="ocTabs">${ch('stg', -1, 'Tất cả')}${[0, 1, 2, 3].map(i => ch('stg', i, OD.STAGES[i + 1])).join('')}</div>
  <div class="ocTabs"><button class="ocTab ${F.fav ? 'on' : ''}" data-act="ft" data-k="fav">♥ Yêu thích</button><button class="ocTab ${F.mut ? 'on' : ''}" data-act="ft" data-k="mut">Đột biến</button><button class="ocTab ${F.ready ? 'on' : ''}" data-act="ft" data-k="ready">Sinh sản được</button><button class="ocTab ${F.coin ? 'on' : ''}" data-act="ft" data-k="coin">Có xu</button></div>
  <div class="ocFil"><input data-in="fq" placeholder="Tìm theo tên…" value="${esc(F.q)}"><select data-ch="fsort"><option value="new">Mới nhất</option><option value="val">Giá trị</option><option value="age">Tuổi</option><option value="size">Kích thước</option><option value="inc">Thu nhập</option><option value="rar">Độ hiếm</option><option value="sp">Loài</option></select><select data-ch="frar"><option value="-1">Mọi độ hiếm</option>${OD.TIERS.map((x, i) => `<option value="${i}">${x.n}</option>`).join('')}</select><select data-ch="fcol"><option value="">Mọi màu</option>${[['red', 'Đỏ/cam'], ['yellow', 'Vàng'], ['green', 'Xanh lá'], ['blue', 'Xanh dương'], ['purple', 'Tím/hồng'], ['white', 'Sáng/trắng'], ['dark', 'Tối'], ['gray', 'Xám']].map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></div>
  ${OC.eggs.length ? `<div class="ocSec">Trứng (${OC.eggs.length})</div>` + OC.eggs.map(e => { const d = OC.spec(e.sp), pg = cl((1 - (e.hatch - t) / (e.hatch - e.born)) * 100, 0, 100), P = e.anc; return `<div class="ocRow"><img src="${thumbSp(d, 0, true)}" alt=""><div><b>Trứng ${e.rare ? '✨' : ''} ${P ? esc(OC.spec(P.a.sp).n) + ' × ' + esc(OC.spec(P.b.sp).n) : 'mua/nhặt'}</b><small>Nở sau ${mmss(e.hatch - t)}${P ? ' · F' + e.gen : ''}</small><div class="ocPg"><b style="width:${pg}%"></b></div></div></div>`; }).join('') : ''}
  <div class="ocSec">Cá (${a.length})</div><div class="ocGrid">${a.slice(0, 150).map(f => `<button class="ocCard" data-act="pickFish" data-id="${f.id}" data-t="${f.d.tier}" style="--rc:${tier(f.d).c}"><img src="${thumbF(f)}" alt="" loading="lazy"><span>${f.fav ? '♥' : ''}${f.lock ? '🔒' : ''}${esc(f.name || f.d.n)}</span><small>${OD.STAGES[stageOf(f) + 1]} · ${fmtN(OC.sellPrice(f))}¢</small>${f.inc.acc > 0 ? '<span class="bd">🪙</span>' : ''}<div class="ocPg" style="width:100%"><b style="width:${f.hun}%;background:#ffb04d"></b></div></button>`).join('') || '<p style="grid-column:1/-1;text-align:center;color:#9fc4e8">Không có cá phù hợp bộ lọc</p>'}</div>`;
}
function panelFish(){ sheet('fish', '🐠 Cá của tôi', b => { b.innerHTML = fishListHTML(); const sel = b.querySelector('[data-ch=fsort]'); if(sel) sel.value = fishF.sort; const r = b.querySelector('[data-ch=frar]'); if(r) r.value = fishF.rar; const c = b.querySelector('[data-ch=fcol]'); if(c) c.value = fishF.col; }, true); }
/* ---------- Cửa hàng ---------- */
const SHOP_TABS = [['fish', 'Cá giống'], ['egg', 'Trứng'], ['pot', 'Thuốc'], ['food', 'Thức ăn'], ['pl', 'Thực vật'], ['dc', 'Trang trí'], ['sp', 'Đặc biệt'], ['ev', 'Sự kiện']];
function panelShop(){ sheet('shop', '🛒 Cửa hàng Đại Dương', shopRender); }
function shopRender(b){
  const s = S(); stopPv(); const tabs = `<div class="ocTabs">${SHOP_TABS.map(([k, n]) => `<button class="ocTab ${shopTab === k ? 'on' : ''}" data-act="shopTab" data-k="${k}">${n}</button>`).join('')}</div>`;
  if(shopSel && (shopTab === 'fish' || shopTab === 'egg')){ const d = OD.SP[shopSel], ok = s.lvl >= d.lvl, T = tier(d), price = shopTab === 'egg' ? Math.round(d.val * OD.ECON.eggMul) : d.price;
    b.innerHTML = `<button class="ocBtn" data-act="shopBack">‹ Quay lại</button><canvas class="ocPv" id="ocPv" width="480" height="270" style="margin-top:8px"></canvas>
    <div class="ocTabs">${[0, 1, 2, 3].map(i => `<button class="ocTab ${PV.stg === i ? 'on' : ''}" data-act="pvStg" data-i="${i}">${OD.STAGES[i + 1]}</button>`).join('')}<button class="ocTab" data-act="pvZoom" data-z="1.25">Phóng to</button><button class="ocTab" data-act="pvZoom" data-z=".8">Thu nhỏ</button></div>
    <div style="font-size:17px;font-weight:800">${esc(d.n)} ${tag(d)}</div><table class="ocTbl"><tr><td>Nhóm</td><td>${OD.GROUPS[d.g]}</td></tr><tr><td>Kích thước trưởng thành</td><td>~${Math.round(d.L / 4)} cm</td></tr><tr><td>Thời gian trưởng thành</td><td>~${d.growMin} phút (×1)</td></tr><tr><td>Sinh sản</td><td>${d.asex ? 'Đơn tính' : d.eggs[0] + '–' + d.eggs[1] + ' trứng / ' + d.breedMin + ' phút'}</td></tr><tr><td>Thu nhập</td><td>${T.inc[0]}–${T.inc[1]} xu / ${T.every} phút</td></tr><tr><td>Môi trường</td><td>${d.env}</td></tr><tr><td>Giá bán cơ bản</td><td>${fmtN(d.val * OD.ECON.sellBaseMul)} xu</td></tr><tr><td>Điều kiện mở khóa</td><td>${ok ? 'Đã mở khóa' : 'Cần đạt cấp ' + d.lvl}</td></tr></table>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="ocBtn pri ${ok && OC.capOk() ? '' : 'dis'}" data-act="${shopTab === 'egg' ? 'buyEgg' : 'buyFish'}" data-id="${d.id}" data-why="${!ok ? 'Cần đạt cấp ' + d.lvl : 'Hồ đã đầy'}" style="flex:1;justify-content:center">Mua ${fmtN(price)} 🪙</button></div>`;
    const cv = b.querySelector('#ocPv'); startPv(cv, d, { stg: PV.stg, zoom: PV.zoom }); return; }
  let body = '';
  if(shopTab === 'fish' || shopTab === 'egg'){ body = `<div class="ocGrid">${OD.SPECIES.filter(d => d.buy).map(d => { const ok = s.lvl >= d.lvl; return `<button class="ocCard ${ok ? '' : 'lock'}" data-act="shopSel" data-id="${d.id}" data-t="${d.tier}" style="--rc:${tier(d).c}"><img src="${thumbSp(d, shopTab === 'egg' ? 0 : 1, !ok)}" alt="" loading="lazy"><span>${esc(d.n)}</span><small>${ok ? '' : '🔒 Cấp ' + d.lvl}</small><span class="pr">${fmtN(shopTab === 'egg' ? Math.round(d.val * OD.ECON.eggMul) : d.price)}¢</span></button>`; }).join('')}</div><p style="font-size:11px;color:#9fc4e8">Loài huyền thoại và đột biến chỉ có thể khám phá qua lai tạo, đột biến hoặc sự kiện.</p>`; }
  else if(shopTab === 'pot'){ body = OD.POTIONS.map(p => `<div class="ocRow"><div style="flex:none">${bottle(p.cat)}</div><div><b>${p.n}</b><small>${p.cat} · có ${s.inv.potion[p.id] || 0}</small><br>${p.d}</div><button class="ocBtn pri" data-act="buyPot" data-id="${p.id}">${fmtN(p.price)}¢</button></div>`).join(''); }
  else if(shopTab === 'food'){ body = OD.FOODS.map(f => `<div class="ocRow"><div style="font-size:26px;flex:none;width:44px;text-align:center">🍤</div><div><b>${f.n}</b><small>×${f.pack} hạt · có ${s.inv.food[f.id] || 0}</small><br>${f.d}</div><button class="ocBtn pri" data-act="buyFood" data-id="${f.id}">${fmtN(f.price)}¢</button></div>`).join(''); }
  else if(shopTab === 'pl'){ body = OD.PLANTS.map(p => `<div class="ocRow"><img src="${OA.thumb({ kind: 'pl', id: p.id, d: p }, 120, 84)}" alt="" loading="lazy"><div><b>${p.n}</b><small>${p.shelter ? 'Nơi trú ẩn · ' : ''}${p.glow ? 'Phát sáng · ' : ''}có ${s.own.pl[p.id] || 0}</small></div><button class="ocBtn pri" data-act="buyDeco" data-k="pl" data-id="${p.id}">${fmtN(p.price)}¢</button></div>`).join(''); }
  else if(shopTab === 'dc'){ body = [1, 2, 3, 4].map(g => `<div class="ocSec">${['Địa hình & nơi trú ẩn', 'San hô & thực vật trang trí', 'Vật trang trí nhân tạo', 'Trang trí cao cấp'][g - 1]}</div>` + OD.DECOR.filter(d => d.grp === g).map(d => `<div class="ocRow"><img src="${OA.thumb({ kind: 'dc', id: d.id, d }, 120, 84)}" alt="" loading="lazy"><div><b>${d.n}</b><small>${d.glow ? 'Phát sáng · ' : ''}${d.cave ? 'Hang trú ẩn · ' : ''}có ${s.own.dc[d.id] || 0}</small></div><button class="ocBtn pri" data-act="buyDeco" data-k="dc" data-id="${d.id}">${fmtN(d.price)}¢</button></div>`).join('')).join(''); }
  else if(shopTab === 'sp'){ const up = OD.ECON.capUpgrades.find(u => u[0] > s.cap); body = `<div class="ocRow"><div style="font-size:30px;flex:none;width:44px;text-align:center">🌊</div><div><b>Mở rộng hồ</b><small>Sức chứa hiện tại: ${s.cap}</small><br>${up ? 'Nâng lên ' + up[0] + ' sinh vật' : 'Đã đạt tối đa'}</div>${up ? `<button class="ocBtn pri" data-act="buyCap">${fmtN(up[1])}¢</button>` : ''}</div>
    <div class="ocRow"><div style="font-size:30px;flex:none;width:44px;text-align:center">🏞️</div><div><b>Hồ mới (nhiều hồ)</b><small>Chưa triển khai</small><br>Đã thiết kế dữ liệu, sẽ mở ở giai đoạn sau khi hồ chính ổn định.</div><button class="ocBtn dis" data-why="Tính năng chưa triển khai">Sắp có</button></div>`; }
  else body = `<div class="ocRow"><div style="font-size:30px;flex:none;width:44px;text-align:center">🎉</div><div><b>Chưa có sự kiện nào</b><small>Khung sự kiện theo dữ liệu đã sẵn sàng</small><br>Cá độc quyền theo sự kiện sẽ xuất hiện ở đây khi được cấu hình.</div></div>`;
  b.innerHTML = tabs + body;
}
function bottle(cat){ const c = { 'Tăng trưởng': '#4dffb0', 'Sinh sản': '#ff7ad1', 'Ngoại hình': '#4dc8ff', 'Đột biến': '#b84dff' }[cat] || '#fff'; return `<svg viewBox="0 0 40 44" width="44" height="48"><path d="M16 4h8v6l8 6c4 4 4 12 0 16s-12 8-12 8-8-4-12-8-4-12 0-16l8-6z" fill="${c}" opacity=".85" stroke="#fff" stroke-width="2"/><rect x="15" y="1" width="10" height="6" rx="2" fill="#e0b070" stroke="#fff" stroke-width="1.5"/><ellipse cx="14" cy="22" rx="3" ry="5" fill="#fff" opacity=".5"/></svg>`; }
/* ---------- Bộ sưu tập ---------- */
const COLTABS = [['A', 'Cá phổ biến'], ['B', 'Đặc biệt'], ['C', 'Quý hiếm'], ['D', 'Huyền thoại'], ['E', 'Đột biến'], ['H', 'Cá lai tạo'], ['V', 'Biến thể & thưởng']];
function panelColl(){ sheet('coll', '🏛️ OCEAN COLLECTION', collRender); }
function collRender(b){
  const s = S(), tabs = `<div class="ocTabs">${COLTABS.map(([k, n]) => `<button class="ocTab ${collTab === k ? 'on' : ''}" data-act="collTab" data-k="${k}">${n}</button>`).join('')}</div>`;
  const total = OD.SPECIES.length, own = OD.SPECIES.filter(d => s.col[d.id] === 2).length, seen = OD.SPECIES.filter(d => OC.colStatus(d.id) >= 1).length;
  const head = `<div class="ocRows">Đã sở hữu <b>${own}/${total}</b> · Đã khám phá <b>${seen}/${total}</b> · Cá lai <b>${Object.keys(s.hyb).length}</b> · Biến thể <b>${Object.keys(s.phen).length}</b></div><div class="ocPg" style="margin:6px 0 10px"><b style="width:${own / total * 100}%"></b></div>`;
  if(collTab === 'V'){ const claims = s.colClaim || {}; b.innerHTML = tabs + head + `<div class="ocSec">Phần thưởng sưu tầm</div>` + 'ABCDE'.split('').map((g, i) => { const L = OD.SPECIES.filter(d => d.g === g), n = L.filter(d => s.col[d.id] === 2).length; return [[.5, 500 * (i + 1)], [1, 2000 * (i + 1)]].map(([r, xu]) => { const k = g + r, done = n >= Math.ceil(L.length * r), got = claims[k]; return `<div class="ocRow"><div style="font-size:24px;flex:none;width:40px;text-align:center">${got ? '✅' : done ? '🎁' : '🔒'}</div><div><b>${OD.GROUPS[g]} — ${r * 100}%</b><small>${n}/${Math.ceil(L.length * r)} loài</small><br>Thưởng: ${fmtN(xu)} xu${r === 1 ? ' + vật trang trí độc quyền + danh hiệu' : ''}</div><button class="ocBtn ${done && !got ? 'pri' : 'dis'}" data-act="collClaim" data-k="${k}" data-why="${got ? 'Đã nhận' : 'Chưa đủ điều kiện'}">${got ? 'Đã nhận' : 'Nhận'}</button></div>`; }).join(''); }).join(''); return; }
  let list = collTab === 'H' ? Object.values(s.hyb) : OD.SPECIES.filter(d => d.g === collTab);
  b.innerHTML = tabs + head + `<div class="ocGrid">${list.map(d => { const st = d.hybrid ? 2 : OC.colStatus(d.id), nm = st ? d.n : '???'; return `<button class="ocCard" data-act="collInfo" data-id="${d.id}" data-t="${st ? d.tier : ''}" style="--rc:${st ? tier(d).c : '#5f87a3'}"><img src="${thumbSp(d, 3, st === 0)}" alt="" class="${st === 1 ? '' : ''}" loading="lazy" style="${st === 1 ? 'opacity:.6' : ''}"><span>${esc(nm)}</span><small>${st === 2 ? '✓ Đã sở hữu' : st === 1 ? 'Đã khám phá' : 'Chưa khám phá'}</small></button>`; }).join('') || '<p style="grid-column:1/-1;text-align:center;color:#9fc4e8">Chưa có cá lai nào. Hãy lai tạo hai loài khác nhau!</p>'}</div>`;
}
function collInfo(id){
  const s = S(), d = OD.SP[id] || s.hyb[id]; if(!d) return; const st = d.hybrid ? 2 : OC.colStatus(id), T = tier(d), vars = Object.keys(s.phen).filter(k => k.split(',')[0] === id).length;
  if(st === 0){ dlg(`<h3>??? — Chưa khám phá</h3><div style="text-align:center"><img src="${thumbSp(d, 3, true)}" style="width:70%;border-radius:12px;background:#5fb8e8"></div><p>${d.g === 'D' || d.g === 'E' ? 'Loài này chỉ có thể khám phá qua lai tạo hoặc đột biến.' : 'Đạt cấp ' + d.lvl + ' để mở khóa trong cửa hàng.'}</p><p>Nhóm: ${OD.GROUPS[d.g]}</p>`, [{ t: 'Đóng', c: '', k: closeDlg }]); return; }
  dlg(`<h3>${esc(d.n)} ${tag(d)}</h3><div style="text-align:center"><img src="${thumbSp(d, 3)}" style="width:70%;border-radius:12px;background:#5fb8e8"></div><table class="ocTbl"><tr><td>Nhóm</td><td>${d.hybrid ? 'Cá lai tạo' : OD.GROUPS[d.g]}</td></tr><tr><td>Môi trường</td><td>${d.env}</td></tr><tr><td>Kích thước tối đa</td><td>~${Math.round(d.L / 4 * 1.3)} cm</td></tr><tr><td>Trưởng thành sau</td><td>~${d.growMin} phút</td></tr><tr><td>Tuổi thọ</td><td>${d.life}</td></tr><tr><td>Sinh sản</td><td>${d.asex ? 'Đơn tính' : d.eggs[0] + '–' + d.eggs[1] + ' trứng'}</td></tr><tr><td>Đặc tính di truyền</td><td>${[d.pat !== 'none' ? 'Họa tiết ' + d.pat : '', d.fl.includes('g') ? 'Phát sáng' : '', d.fl.includes('c') ? 'Pha lê' : ''].filter(Boolean).join(', ') || 'Cơ bản'}</td></tr><tr><td>Giá bán cơ bản</td><td>${fmtN(d.val * OD.ECON.sellBaseMul)} xu</td></tr><tr><td>Biến thể đã thấy</td><td>${vars}</td></tr>${d.hybrid ? `<tr><td>Công thức</td><td>${esc(OC.spec(d.parents[0]).n)} × ${esc(OC.spec(d.parents[1]).n)}</td></tr>` : ''}</table>`, [{ t: 'Đóng', c: '', k: closeDlg }]);
}
/* ---------- Lai tạo ---------- */
function panelBreed(pre){ if(pre){ breedSel.a = pre.id; breedSel.b = null; } sheet('breed', '🧬 Phòng lai tạo', breedRender, true); }
function breedRender(b){
  const A = OC.fish.find(f => f.id === breedSel.a), B = OC.fish.find(f => f.id === breedSel.b), t = now(), slot = (f, k) => `<button class="ocSlot" data-act="breedPick" data-k="${k}">${f ? `<img src="${thumbF(f)}" alt=""><span>${esc(f.name || f.d.n)}</span><small>${OD.STAGES[stageOf(f) + 1]}${t < f.cd ? ' · hồi ' + mmss(f.cd - t) : ''}</small>` : `<span style="font-size:26px">＋</span>Chọn cá ${k === 'a' ? 'bố/mẹ 1' : 'bố/mẹ 2'}`}</button>`;
  let info = '<p style="color:#9fc4e8;font-size:12px">Chọn hai cá trưởng thành để xem khả năng tương thích.</p>', can = false, why = 'Chọn đủ hai cá';
  if(A && B){ const ok = x => stageOf(x) === 3 && t >= x.cd && x.hp > 40; const cp = A !== B && OC.compat(A, B, A.boost.compat || B.boost.compat); why = A === B ? 'Chọn hai cá khác nhau' : !ok(A) || !ok(B) ? 'Cần hai cá trưởng thành, đủ sức khỏe, hết hồi phục' : !cp ? 'Hai loài không tương thích' : !OC.capOk() ? 'Hồ đã đầy' : ''; can = !why;
    const cost = 50 + Math.round((A.d.val + B.d.val) * .04), same = A.sp === B.sp, mutP = 4 + (A.g.rare.length + B.g.rare.length) * 0; info = `<table class="ocTbl"><tr><td>Tương thích</td><td>${cp ? '✔ Có' : '✖ Không'}</td></tr><tr><td>Cấp độ lai tạo</td><td>${same ? 'Cơ bản (cùng loài)' : 'Khác loài'}${(A.d.tier >= 3 && B.d.tier >= 3) ? ' · đặc tính hiếm' : ''}${Math.max(A.gen, B.gen) >= 1 ? ' · nhiều thế hệ (F' + (Math.max(A.gen, B.gen) + 1) + ')' : ''}</td></tr><tr><td>Số trứng dự kiến</td><td>${A.d.eggs[0] + (A.boost.eggs || 0) + (B.boost.eggs || 0)}–${A.d.eggs[1] + (A.boost.eggs || 0) + (B.boost.eggs || 0)}</td></tr><tr><td>Loài con</td><td>${same ? esc(A.d.n) : '45% ' + esc(A.d.n) + ' · 45% ' + esc(B.d.n) + ' · 10% lai'}</td></tr><tr><td>Xác suất đột biến</td><td>~${mutP}% / trứng</td></tr><tr><td>Chi phí</td><td>${fmtN(cost)} xu</td></tr></table>`; }
  const hy = Object.values(S().hyb);
  b.innerHTML = `<div style="display:flex;gap:8px">${slot(A, 'a')}<div style="align-self:center;font-size:22px">❤</div>${slot(B, 'b')}</div>${info}<button class="ocBtn pri ${can ? '' : 'dis'}" data-act="doBreed" data-why="${why}" style="width:100%;justify-content:center;margin-top:8px;min-height:46px">Lai tạo</button><p style="font-size:11px;color:#9fc4e8">Cá cũng tự sinh sản khi gặp bạn đời tương thích, khỏe mạnh và no đủ.</p><div class="ocSec">Công thức lai đã khám phá (${hy.length})</div>${hy.map(h => `<div class="ocRow"><img src="${thumbSp(h, 3)}" alt=""><div><b>${esc(h.n)}</b><small>${esc(OC.spec(h.parents[0]).n)} × ${esc(OC.spec(h.parents[1]).n)}</small></div></div>`).join('') || '<p style="font-size:11px;color:#9fc4e8">Chưa có.</p>'}`;
}
function pickFish(title, filter, cb){
  const list = OC.fish.filter(filter); dlg(`<h3>${title}</h3><div class="ocGrid" style="max-height:52vh;overflow:auto">${list.map(f => `<button class="ocCard" data-act="dlgFish" data-id="${f.id}"><img src="${thumbF(f)}" alt=""><span>${esc(f.name || f.d.n)}</span><small>${OD.STAGES[stageOf(f) + 1]}</small></button>`).join('') || '<p style="grid-column:1/-1;text-align:center;color:#9fc4e8">Không có cá phù hợp</p>'}</div>`, [{ t: 'Đóng', c: '', k: closeDlg }]); $('#ocDlg')._pf = cb;
}
/* ---------- Thuốc ---------- */
function panelPot(preFish){ sheet('pot', '🧪 Phòng thuốc', b => potRender(b, preFish)); }
function potRender(b, preFish){
  const s = S(), cats = ['Tăng trưởng', 'Sinh sản', 'Ngoại hình', 'Đột biến'];
  b.innerHTML = `<div class="ocTabs">${cats.map(c => `<button class="ocTab ${potCat === c ? 'on' : ''}" data-act="potCat" data-k="${c}">${c}</button>`).join('')}</div>` + OD.POTIONS.filter(p => p.cat === potCat).map(p => `<div class="ocRow"><div style="flex:none">${bottle(p.cat)}</div><div><b>${p.n}</b><small>Có ${s.inv.potion[p.id] || 0} · ${fmtN(p.price)} xu</small><br>${p.d}${p.tbl ? '<table class="ocTbl" style="margin-top:4px">' + p.tbl.map(([k, w]) => `<tr><td>${OD.MUT_LABEL[k]}</td><td>${w}%</td></tr>`).join('') + '</table>' : ''}</div><div style="display:flex;flex-direction:column;gap:5px"><button class="ocBtn pri" data-act="usePot" data-id="${p.id}">Dùng</button><button class="ocBtn" data-act="buyPot" data-id="${p.id}">Mua</button></div></div>`).join('');
  if(preFish){ preFish = null; }
}
let potFish = null;
function usePotFlow(pid, fish){
  const P = OD.PT[pid], s = S(), go = f => { const have = (s.inv.potion[pid] || 0) > 0; dlg(`<h3>${P.n}</h3><div class="ocRow"><img src="${thumbF(f)}" alt=""><div><b>${esc(f.name || f.d.n)}</b><small>${OD.STAGES[stageOf(f) + 1]}</small></div></div><p>${P.d}</p>${P.tbl ? '<table class="ocTbl">' + P.tbl.map(([k, w]) => `<tr><td>${OD.MUT_LABEL[k]}</td><td>${w}%</td></tr>`).join('') + '</table><p style="color:#ffd34d">⚠ Kết quả mang tính ngẫu nhiên, có thể không thay đổi gì.</p>' : ''}<p>${have ? 'Dùng 1 thuốc có sẵn.' : 'Sẽ trừ <b>' + fmtN(P.price) + ' xu</b>.'}</p>`, [{ t: 'Hủy', k: closeDlg }, { t: 'Xác nhận', c: 'pri', k: () => { closeDlg(); const r = OC.usePotion(pid, f); if(r){ dlg(`<h3>Kết quả</h3><div style="display:flex;gap:8px;align-items:center"><img src="${thumbF(f)}" style="width:50%;border-radius:12px;background:#5fb8e8"><p style="flex:1"><b>${esc(r)}</b></p></div>`, [{ t: 'Đóng', c: 'pri', k: () => { closeDlg(); reRender(); renderInfo(); } }]); } } }]); };
  if(fish) go(fish); else pickFish('Chọn cá để dùng thuốc', () => true, go);
}
/* ---------- Trang trí ---------- */
function panelDeco(){ sheet('deco', '🪸 Trang trí hồ', decoRender); }
function decoRender(b){
  const s = S(), tabs = `<div class="ocTabs">${[['pl', 'Thực vật'], ['dc', 'Vật trang trí'], ['placed', 'Đã đặt (' + s.placed.length + ')']].map(([k, n]) => `<button class="ocTab ${decoTab === k ? 'on' : ''}" data-act="decoTab" data-k="${k}">${n}</button>`).join('')}<button class="ocTab" data-act="editMode">✋ Chế độ kéo thả</button></div>`;
  if(decoTab === 'placed'){ b.innerHTML = tabs + (s.placed.map(p => { const d = (p.k === 'pl' ? OD.PL : OD.DC)[p.id]; return `<div class="ocRow"><img src="${OA.thumb({ kind: p.k, id: d.id, d }, 120, 84)}" alt=""><div><b>${d.n}</b><small>Vị trí ${Math.round(p.x * 100)}%</small></div><button class="ocBtn" data-act="takeDeco" data-u="${p.uid}">Gỡ</button></div>`; }).join('') || '<p style="color:#9fc4e8;font-size:12px">Chưa đặt vật nào.</p>'); return; }
  const L = (decoTab === 'pl' ? OD.PLANTS : OD.DECOR).filter(d => (s.own[decoTab][d.id] || 0) > 0);
  b.innerHTML = tabs + (L.map(d => `<div class="ocRow"><img src="${OA.thumb({ kind: decoTab, id: d.id, d }, 120, 84)}" alt=""><div><b>${d.n}</b><small>Còn ${s.own[decoTab][d.id]} trong kho</small></div><div style="display:flex;flex-direction:column;gap:5px"><button class="ocBtn pri" data-act="putDeco" data-k="${decoTab}" data-id="${d.id}">Đặt ngẫu nhiên</button><button class="ocBtn" data-act="armDeco" data-k="${decoTab}" data-id="${d.id}">Đặt thủ công</button></div></div>`).join('') || '<p style="color:#9fc4e8;font-size:12px">Kho trống. Mua vật phẩm trong Cửa hàng (Thực vật / Trang trí).</p>');
}
/* ---------- Nhiệm vụ ---------- */
function panelQuest(){ sheet('quest', '📋 Nhiệm vụ & Thành tựu', questRender, true); }
function questRender(b){
  const s = S(), tabs = `<div class="ocTabs">${[['s', 'Tân thủ'], ['d', 'Hằng ngày'], ['l', 'Dài hạn'], ['a', 'Thành tựu']].map(([k, n]) => `<button class="ocTab ${questTab === k ? 'on' : ''}" data-act="questTab" data-k="${k}">${n}</button>`).join('')}</div>`;
  if(questTab === 'a'){ b.innerHTML = tabs + OD.ACH.map(a => { const dv = OC.derived(), v = dv[a.k] !== undefined ? dv[a.k] : (s.st[a.k] || 0); return `<div class="ocRow"><div style="font-size:28px;flex:none;width:44px;text-align:center">${s.ach[a.id] ? a.i : '🔒'}</div><div><b>${a.n}</b><small>${Math.min(v, a.v)}/${a.v} · thưởng ${fmtN(a.r)} xu</small><div class="ocPg"><b style="width:${Math.min(100, v / a.v * 100)}%"></b></div></div></div>`; }).join(''); return; }
  b.innerHTML = tabs + OD.QUESTS.filter(q => q.t === questTab).map(q => { const v = OC.progOf(q), done = s.q.ready && s.q.ready[q.id], got = s.q.claimed[q.id]; return `<div class="ocRow"><div style="font-size:22px;flex:none;width:36px;text-align:center">${got ? '✅' : done ? '🎁' : '🎯'}</div><div><b>${q.n}</b><small>${Math.min(v, q.v)}/${q.v} · thưởng ${fmtN(q.r)} xu</small><div class="ocPg"><b style="width:${Math.min(100, v / q.v * 100)}%"></b></div></div><button class="ocBtn ${done && !got ? 'pri' : 'dis'}" data-act="claimQ" data-id="${q.id}" data-why="${got ? 'Đã nhận' : 'Chưa hoàn thành'}">${got ? 'Đã nhận' : 'Nhận'}</button></div>`; }).join('');
}
/* ---------- Ví / Nhật ký / Cài đặt ---------- */
function panelWallet(){ sheet('wallet', '🪙 Ví Đồng Xu Đại Dương', b => { const s = S(), st = s.st; const src = [['fish', 'Thu nhập từ cá'], ['sale', 'Bán cá'], ['item', 'Vật phẩm (kim cương, Mặt Trời…)'], ['quest', 'Nhiệm vụ'], ['ach', 'Thành tựu'], ['discover', 'Khám phá'], ['level', 'Lên cấp']], sp = [['fish', 'Mua cá'], ['egg', 'Mua trứng'], ['potion', 'Thuốc'], ['food', 'Thức ăn'], ['decor', 'Trang trí'], ['breed', 'Lai tạo'], ['cap', 'Mở rộng hồ']];
  b.innerHTML = `<div style="text-align:center;font-size:30px;font-weight:800;color:#ffd34d">🪙 ${fmtN(s.coins)}</div><div class="ocRows" style="text-align:center">Thu nhập phiên này: <b>${fmtN(OC.sessionEarn || 0)}</b> · Tổng thu: <b>${fmtN(st.earned || 0)}</b></div><div class="ocSec">Nguồn thu</div><table class="ocTbl">${src.map(([k, n]) => `<tr><td>${n}</td><td>+${fmtN(st['e_' + k] || 0)}</td></tr>`).join('')}</table><div class="ocSec">Chi tiêu</div><table class="ocTbl">${sp.map(([k, n]) => `<tr><td>${n}</td><td>−${fmtN(st['s_' + k] || 0)}</td></tr>`).join('')}</table><div class="ocSec">Lịch sử giao dịch</div>${s.ledger.slice(0, 40).map(l => `<div class="ocSw" style="font-size:11px"><span>${new Date(l.t).toLocaleTimeString('vi-VN')} · ${esc(l.src)}</span><b style="color:${l.d > 0 ? '#4dffb0' : '#ff8a9a'}">${l.d > 0 ? '+' : ''}${fmtN(l.d)}</b></div>`).join('') || '<p style="color:#9fc4e8">Chưa có giao dịch.</p>'}`; }); }
function panelLog(){ sheet('log', '📜 Nhật ký đại dương', b => { b.innerHTML = S().journal.map(j => `<div class="ocSw" style="font-size:11.5px;align-items:flex-start"><span>${esc(j.txt)}</span><small style="color:#9fc4e8;flex:none;margin-left:8px">${new Date(j.t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') || '<p style="color:#9fc4e8">Chưa có sự kiện.</p>'; }); }
function panelSet(){ sheet('set', '⚙️ Cài đặt Ocean Life', b => { const s = S().set;
  b.innerHTML = `<div class="ocSec">Âm thanh (riêng cho Ocean Life)</div><div class="ocSw"><span>Hiệu ứng âm thanh</span><input type="checkbox" data-ch="sfx" ${s.sfx ? 'checked' : ''}></div><div class="ocSw"><span>Âm thanh môi trường (nước, mưa)</span><input type="checkbox" data-ch="amb" ${s.amb ? 'checked' : ''}></div><div class="ocSw"><span>Âm lượng</span><input type="range" min="0" max="100" value="${Math.round(s.vol * 100)}" data-in="vol"></div><div class="ocSw"><span>Rung (nếu hỗ trợ)</span><input type="checkbox" data-ch="vib" ${s.vib ? 'checked' : ''}></div>
  <div class="ocSec">Đồ họa</div><div class="ocSw"><span>Chất lượng</span><select data-ch="q">${[['auto', 'Tự động'], ['low', 'Thấp'], ['high', 'Cao']].map(([k, n]) => `<option value="${k}" ${s.q === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="ocSw"><span>Hiệu ứng hạt</span><select data-ch="parts">${[[0.25, 'Ít'], [0.5, 'Vừa'], [1, 'Nhiều']].map(([k, n]) => `<option value="${k}" ${s.parts == k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div class="ocSec">Thời gian</div><div class="ocSw"><span>Tốc độ phát triển / thu nhập</span><select data-ch="tm">${[1, 2, 4, 8].map(k => `<option value="${k}" ${s.tm == k ? 'selected' : ''}>${k}×</option>`).join('')}</select></div><div class="ocSw"><span>Tốc độ chu kỳ ngày đêm</span><select data-ch="dn">${[[.5, 'Chậm'], [1, 'Vừa'], [2, 'Nhanh'], [4, 'Rất nhanh']].map(([k, n]) => `<option value="${k}" ${s.dn == k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div class="ocSec">Dữ liệu</div><p style="font-size:11px;color:#9fc4e8;line-height:1.5">Dữ liệu lưu <b>cục bộ trên thiết bị này</b> (localStorage). Xóa dữ liệu trình duyệt sẽ mất tiến trình. Hãy sao lưu thường xuyên.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ocBtn" data-act="expData">Sao lưu (sao chép)</button><button class="ocBtn" data-act="impData">Khôi phục</button><button class="ocBtn warn" data-act="resetData" style="background:rgba(255,74,106,.35)">Đặt lại</button></div>
  <div class="ocSec">Trạng thái phát triển</div>${OD.STATUS.map(([k, t]) => `<div class="ocSw" style="font-size:11px;align-items:flex-start"><span>${t}</span><b style="flex:none;margin-left:8px">${k === 'ok' ? '✅' : k === 'part' ? '🟡' : '⬜'}</b></div>`).join('')}<p style="font-size:10.5px;color:#9fc4e8">✅ hoàn thành · 🟡 một phần · ⬜ chưa triển khai</p>`; }); }
/* ---------- chụp ảnh ---------- */
function photoMode(on){
  for(const sel of ['.ocTop', '.ocSide', '.ocNav', '#ocHud', '#ocInfo']){ const e = $(sel); if(e) e.style.display = on ? 'none' : ''; }
  let bar = $('#ocPh'); if(on){ if(!bar){ bar = document.createElement('div'); bar.id = 'ocPh'; bar.className = 'ocPhoto'; bar.innerHTML = `<button class="ocBtn pri" data-act="shot">📸 Chụp</button><button class="ocBtn" data-act="zin">＋</button><button class="ocBtn" data-act="zout">－</button><button class="ocBtn" data-act="photoOff">Thoát</button>`; root.appendChild(bar); } } else if(bar) bar.remove();
}
function shot(){ const cv = $('#ocC'); cv.toBlob(b => { if(!b) return toast('Không chụp được ảnh', 'err'); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ocean-life-' + Date.now() + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Đã lưu ảnh đại dương', 'ok'); OC.log('Chụp ảnh đại dương'); }, 'image/png'); }
function pedHTML(a, dep = 0){ if(!a) return ''; const d = OC.spec(a.sp); return `<div>${esc(a.n || d.n)} <small>(${esc(d.n)} · F${a.gen})</small>${a.anc ? pedHTML(a.anc.a, dep + 1) + pedHTML(a.anc.b, dep + 1) : ''}</div>`; }
/* ---------- hành động ---------- */
const IN = {
  fq: v => { fishF.q = v; clearTimeout(IN._t); IN._t = setTimeout(() => { const b = $('.ocShB'); if(panel && panel.name === 'fish'){ const st = b.scrollTop; b.innerHTML = fishListHTML(); b.scrollTop = st; const i = b.querySelector('[data-in=fq]'); i.focus(); i.setSelectionRange(v.length, v.length); const sel = b.querySelector('[data-ch=fsort]'); sel.value = fishF.sort; b.querySelector('[data-ch=frar]').value = fishF.rar; b.querySelector('[data-ch=fcol]').value = fishF.col; } }, 250); },
  fsort: v => { fishF.sort = v; reRender(); }, frar: v => { fishF.rar = +v; reRender(); }, fcol: v => { fishF.col = v; reRender(); },
  vol: v => { S().set.vol = v / 100; OC.queueSave(); }, sfx: (v, el) => { S().set.sfx = el.checked; OC.queueSave(); }, amb: (v, el) => { S().set.amb = el.checked; OC.queueSave(); }, vib: (v, el) => { S().set.vib = el.checked; OC.queueSave(); },
  q: v => { S().set.q = v; OC.resize(); OC.queueSave(); }, parts: v => { S().set.parts = +v; OC.queueSave(); }, tm: v => { S().set.tm = +v; OC.queueSave(); toast('Tốc độ ' + v + '×', 'ok'); }, dn: v => { S().set.dn = +v; OC.queueSave(); }
};
const ACT = {
  exit(){ closeSheet(); closeDlg(); G.back(); }, close: closeSheet, nav(d){ if(panel && panel.name === d.k){ closeSheet(); return; } ({ fish: panelFish, shop: panelShop, coll: panelColl, breed: () => panelBreed(), pot: () => panelPot(), deco: panelDeco, quest: panelQuest })[d.k](); },
  wallet: panelWallet, log: panelLog, set: panelSet, photo(){ closeSheet(); photoMode(true); }, photoOff(){ photoMode(false); }, shot,
  wx(){ const night = OA.skyColors(S().time).day < .35; toast((OD.WEATHER[OC.wx.k]) + ' · ' + (night ? 'Ban đêm' : 'Ban ngày') + ' · còn ' + mmss(OC.wx.left * 1000), 'info'); },
  feed(){ OC.setMode(OC.mode === 'feed' ? 'view' : 'feed'); }, harv(){ OC.harvestAll(); }, zin(){ OC.zoom(1.25); }, zout(){ OC.zoom(.8); }, mode(d){ OC.setMode(d.m); }, foodSel(d){ S().feedType = d.id; hud(); },
  dlgBtn(d){ const b = $('#ocDlg')._b[+d.i]; if(b.k) b.k(); else closeDlg(); }, dlgFish(d){ const f = OC.fish.find(x => x.id === +d.id), cb = $('#ocDlg')._pf; closeDlg(); if(f && cb) cb(f); },
  infoToggle(){ infoOpen = !infoOpen; renderInfo(); }, iClose(){ OC.sel = null; $('#ocInfo').hidden = true; },
  iFeed(){ OC.feedFish(OC.sel); }, iHarv(){ OC.harvest(OC.sel); renderInfo(); }, iPot(){ usePotFlowPick(OC.sel); }, iBreed(){ closeDlg(); panelBreed(OC.sel); },
  iSell(){ const f = OC.sel, pr = OC.sellPrice(f), rare = f.d.tier >= 2 || f.g.crown || f.mut.length || f.fav; dlg(`<h3>Bán cá?</h3><div class="ocRow"><img src="${thumbF(f)}" alt=""><div><b>${esc(f.name || f.d.n)}</b><small>${OD.STAGES[stageOf(f) + 1]} · F${f.gen}</small></div></div><p>Bạn sẽ nhận <b style="color:#ffd34d">${fmtN(pr)} xu</b>.</p>${rare ? '<p style="color:#ffd34d">⚠ Đây là cá quý/đột biến/yêu thích. Hãy chắc chắn trước khi bán!</p>' : ''}`, [{ t: 'Hủy', k: closeDlg }, { t: 'Bán', c: 'pri', k: () => { closeDlg(); OC.sell(f); OC.sel = null; $('#ocInfo').hidden = true; reRender(); } }]); },
  iLock(){ OC.toggleLock(OC.sel); renderInfo(); }, iFav(){ OC.toggleFav(OC.sel); renderInfo(); }, iPed(){ const f = OC.sel; dlg(`<h3>🌳 Phả hệ: ${esc(f.name || f.d.n)}</h3><div class="ocPed"><div><b>${esc(f.d.n)}</b> <small>F${f.gen}${f.mut.length ? ' · đột biến' : ''}</small>${f.anc ? pedHTML(f.anc.a) + pedHTML(f.anc.b) : '<div style="border:0">Thế hệ gốc (không có bố mẹ trong hồ)</div>'}</div></div><p>Đặc tính di truyền: ${traits(f) || 'Bình thường'}</p>`, [{ t: 'Đóng', c: 'pri', k: closeDlg }]); },
  iName(){ const f = OC.sel; dlg(`<h3>Đổi tên</h3><input type="text" id="ocNm" maxlength="16" value="${esc(f.name)}" placeholder="${esc(f.d.n)}"><p>Tên riêng không làm mất tên loài gốc.</p>`, [{ t: 'Hủy', k: closeDlg }, { t: 'Lưu', c: 'pri', k: () => { OC.rename(f, $('#ocNm').value); closeDlg(); renderInfo(); } }]); },
  pickFish(d){ const f = OC.fish.find(x => x.id === +d.id); if(f){ closeSheet(); OC.select(f); OC.focus(f); } },
  ff(d){ fishF[d.k] = +d.v; reRender(); }, ft(d){ fishF[d.k] = !fishF[d.k]; reRender(); },
  shopTab(d){ shopTab = d.k; shopSel = null; reRender(); }, shopSel(d){ shopSel = d.id; reRender(); }, shopBack(){ shopSel = null; reRender(); }, pvStg(d){ PV.stg = +d.i; reRender(); }, pvZoom(d){ PV.zoom = cl(PV.zoom * +d.z, .5, 1.8); if(pvH) pvH.o.zoom = PV.zoom; },
  buyFish(d){ const f = OC.buyFish(d.id); if(f){ toast('Đã mua ' + f.d.n, 'ok'); shopSel = null; reRender(); } }, buyEgg(d){ if(OC.buyEgg(d.id)){ toast('Đã mua trứng', 'ok'); shopSel = null; reRender(); } },
  buyPot(d){ OC.buyPotion(d.id); reRender(); }, buyFood(d){ OC.buyFood(d.id); reRender(); hud(); }, buyDeco(d){ OC.buyDeco(d.k, d.id); reRender(); toast('Đã mua — vào mục Trang trí để đặt', 'ok'); }, buyCap(){ OC.buyCap(); reRender(); },
  collTab(d){ collTab = d.k; reRender(); }, collInfo(d){ collInfo(d.id); },
  collClaim(d){ const s = S(); s.colClaim = s.colClaim || {}; if(s.colClaim[d.k]) return; const g = d.k[0], r = +d.k.slice(1), i = 'ABCDE'.indexOf(g), L = OD.SPECIES.filter(x => x.g === g); if(L.filter(x => s.col[x.id] === 2).length < Math.ceil(L.length * r)) return; s.colClaim[d.k] = 1; const xu = (r === 1 ? 2000 : 500) * (i + 1); OC.earn(xu, 'quest'); if(r === 1){ const dc = OD.DECOR.filter(x => x.grp === Math.min(4, i + 1))[0]; s.own.dc[dc.id] = (s.own.dc[dc.id] || 0) + 1; toast('Nhận ' + fmtN(xu) + ' xu + ' + dc.n, 'ok'); } else toast('Nhận ' + fmtN(xu) + ' xu', 'ok'); OC.log('Nhận thưởng bộ sưu tập ' + d.k); OC.sfx('evolve'); OC.queueSave(); reRender(); },
  breedPick(d){ pickFish('Chọn cá trưởng thành', f => stageOf(f) === 3, f => { breedSel[d.k] = f.id; reRender(); }); },
  doBreed(){ const A = OC.fish.find(f => f.id === breedSel.a), B = OC.fish.find(f => f.id === breedSel.b); if(!A || !B) return; const r = OC.manualBreed(A, B); if(r){ breedSel = { a: null, b: null }; reRender(); } },
  potCat(d){ potCat = d.k; reRender(); }, usePot(d){ usePotFlowPick(null, d.id); },
  decoTab(d){ decoTab = d.k; reRender(); }, putDeco(d){ if(OC.putDeco(d.k, d.id)){ toast('Đã đặt vào hồ', 'ok'); reRender(); } }, armDeco(d){ closeSheet(); OC.armPlace(d.k, d.id); }, takeDeco(d){ OC.takeDeco(+d.u); reRender(); }, editMode(){ closeSheet(); OC.setMode('edit'); },
  questTab(d){ questTab = d.k; reRender(); }, claimQ(d){ OC.claimQuest(d.id); reRender(); },
  expData(){ const t = OC.exportData(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Đã sao chép dữ liệu sao lưu vào clipboard', 'ok')).catch(() => { dlg(`<h3>Sao lưu</h3><p>Sao chép đoạn dưới đây và lưu lại:</p><input type="text" value="${esc(t.slice(0, 200))}…" readonly><p style="font-size:11px">(Dữ liệu dài ${t.length} ký tự)</p>`, [{ t: 'Đóng', k: closeDlg }]); }); },
  impData(){ dlg(`<h3>Khôi phục dữ liệu</h3><p>Dán nội dung sao lưu vào ô dưới. Dữ liệu hiện tại sẽ bị thay thế.</p><input type="text" id="ocImp" placeholder="Dán dữ liệu sao lưu…">`, [{ t: 'Hủy', k: closeDlg }, { t: 'Khôi phục', c: 'pri', k: () => { const v = $('#ocImp').value.trim(); if(OC.importData(v)){ toast('Đã khôi phục, đang tải lại…', 'ok'); setTimeout(() => location.reload(), 800); } else toast('Dữ liệu không hợp lệ', 'err'); closeDlg(); } }]); },
  resetData(){ dlg(`<h3>Đặt lại toàn bộ?</h3><p style="color:#ffc0cc">Toàn bộ cá, xu, bộ sưu tập sẽ bị xóa vĩnh viễn.</p>`, [{ t: 'Hủy', k: closeDlg }, { t: 'Xóa hết', c: 'pri', k: () => { OC.reset(); closeDlg(); toast('Đã đặt lại, đang tải lại…', 'ok'); setTimeout(() => location.reload(), 700); } }]); }
};
function usePotFlowPick(fish, pid){ if(pid){ usePotFlow(pid, fish); return; } /* từ bảng thông tin: chọn thuốc */ const s = S(); dlg(`<h3>Chọn thuốc cho ${esc(fish.name || fish.d.n)}</h3><div style="max-height:50vh;overflow:auto">${OD.POTIONS.map(p => `<div class="ocRow" style="cursor:pointer" data-act="pickPot" data-id="${p.id}"><div style="flex:none">${bottle(p.cat)}</div><div><b>${p.n}</b><small>Có ${s.inv.potion[p.id] || 0} · ${fmtN(p.price)}¢</small></div></div>`).join('')}</div>`, [{ t: 'Đóng', k: closeDlg }]); $('#ocDlg')._fish = fish; }
ACT.pickPot = d => { const f = $('#ocDlg')._fish; closeDlg(); usePotFlow(d.id, f); };
/* ---------- báo cáo ngoại tuyến ---------- */
function offlineReport(){ const r = OC.offline; if(!r) return; OC.offline = null; dlg(`<h3>🌙 Chào mừng trở lại!</h3><p>Bạn đã vắng mặt <b>${mmss(r.el * 1000)}</b>.</p><table class="ocTbl"><tr><td>Xu tích lũy từ cá</td><td>+${fmtN(r.acc)}</td></tr><tr><td>Cá mới trưởng thành</td><td>${r.adults}</td></tr><tr><td>Trứng đã nở / sắp nở</td><td>${r.hatched}</td></tr></table><p style="font-size:11px;color:#9fc4e8">Xu hiển thị trên đầu từng cá, chạm 🪙 hoặc nút thu tất cả để nhận.</p>`, [{ t: 'Thu tất cả xu', c: 'pri', k: () => { closeDlg(); OC.harvestAll(); } }, { t: 'Đóng', k: closeDlg }]); }
/* nút Back của Android: đóng lớp trên cùng trước, trả về true nếu đã xử lý */
function back(){ if(!root || root.hidden) return false; if(!$('#ocDlg').hidden){ closeDlg(); return true; } if(panel){ closeSheet(); return true; } if($('#ocPh')){ photoMode(false); return true; } if(OC.mode !== 'view'){ OC.setMode('view'); return true; } if(OC.sel){ OC.sel = null; $('#ocInfo').hidden = true; return true; } return false; }
/* ---------- đăng ký game ---------- */
let built = false, tickI = 0;
function openOcean(){ if(!built){ build(); built = true; } root.hidden = false; OC.resize(); OC.start(); refresh('all'); if(!tickI) tickI = setInterval(() => { if(!root.hidden) refresh('tick'); }, 1000); setTimeout(offlineReport, 400); }
function closeOcean(){ if(!root) return; root.hidden = true; OC.stop(); photoMode(false); }
G.register({ id: 'ocean', name: 'Ocean Life', icon: '<svg viewBox="0 0 24 24"><path d="M3 14c3-6 8-8 14-5l4-3-1 5c1 4-3 8-9 8-4 0-7-2-8-5z"/><circle cx="14.500" cy="10" r="1" fill="currentColor"/><path d="M5 20c1-2 3-2 4 0M12 21c1-2 3-2 4 0"/></svg>',
  mount(el){ el.innerHTML = '<div class="gtip">Đang mở Ocean Life…</div>'; }, show(){ openOcean(); }, hide(){ closeOcean(); } });
})();
