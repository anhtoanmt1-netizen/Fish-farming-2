/* OCEAN LIFE – Dữ liệu có cấu trúc: loài, thực vật, vật trang trí, thuốc, thức ăn, nhiệm vụ, thành tựu, cấu hình kinh tế */
(() => {
'use strict';
const OD = window.OD = {};

/* ---------- Cấu hình kinh tế (có thể chỉnh) ---------- */
OD.ECON = {
  timeMult: 4,                 // tốc độ thời gian game (1 = thật). Cài đặt trong game: 1×, 2×, 4×, 8×
  offlineCapH: 24,             // tối đa giờ ngoại tuyến được tính
  maxIncomeStack: 8,           // tối đa số lần thu nhập tích lũy / cá
  sellStage: [0.10, 0.22, 0.40, 0.62],   // hệ số giá bán theo giai đoạn (cá con → thiếu niên; trưởng thành dùng 1.0 × 0.62)
  sellCap: 6,                  // trần tích hệ số cộng thêm
  buyFryMul: 0.9, eggMul: 0.45, // giá mua cá giống / trứng so với giá trị cơ bản
  sellBaseMul: 0.62,           // giá bán cá trưởng thành so với giá trị cơ bản (< giá mua: không thể kiếm xu bằng mua-bán lặp)
  spawnMin: 28, spawnMax: 75, spawnMaxActive: 3, spawnPerHour: 40,
  capBase: 100, capUpgrades: [[150, 2500], [200, 9000]]
};

/* ---------- Độ hiếm & thu nhập ---------- */
OD.TIERS = [
  { k: 'common', n: 'Phổ biến', c: '#7fb8e6', every: 60, inc: [5, 15] },
  { k: 'uncommon', n: 'Không phổ biến', c: '#6fd0a0', every: 45, inc: [15, 35] },
  { k: 'rare', n: 'Hiếm', c: '#8f8cff', every: 30, inc: [35, 80] },
  { k: 'epic', n: 'Cực hiếm', c: '#ff9ad1', every: 20, inc: [80, 180] },
  { k: 'legend', n: 'Huyền thoại', c: '#ffd34d', every: 15, inc: [180, 400] },
  { k: 'mutant', n: 'Đột biến đặc biệt', c: '#ff6a3d', every: 12, inc: [200, 1000] }
];
OD.GROUPS = { A: 'Cá phổ biến', B: 'Sinh vật biển đặc biệt', C: 'Sinh vật quý hiếm', D: 'Sinh vật huyền thoại', E: 'Sinh vật sáng tạo & đột biến' };
OD.STAGES = ['Trứng', 'Cá con', 'Cá thiếu nhi', 'Cá thiếu niên', 'Cá trưởng thành'];
OD.CROWNS = [null, 'Vương miện đồng', 'Vương miện bạc', 'Vương miện vàng', 'Vương miện pha lê', 'Vương miện cầu vồng', 'Vương miện thiên hà', 'Vương miện hoàng đế', 'Vương miện cổ đại'];
OD.PERS = {
  shy: 'Nhút nhát', playful: 'Hiếu động', friendly: 'Thân thiện', curious: 'Tò mò', proud: 'Kiêu kỳ', fierce: 'Hung dữ', cuddly: 'Hay làm nũng', school: 'Thích sống theo đàn',
  loner: 'Thích sống đơn độc', explorer: 'Thích khám phá', light: 'Thích ánh sáng', dark: 'Thích hang tối', foodie: 'Thích được cho ăn', territorial: 'Có tính lãnh thổ', social: 'Thích tương tác'
};

/* ---------- 80 loài: id|tên|khung|dài|cao|đuôi|màu thân|màu bụng|màu vây|họa tiết|màu họa tiết|cờ ----------
   cờ: g phát sáng · c pha lê · s đàn · b sống đáy · n về đêm · h sừng · w cánh · k gai · t ba đuôi · d hai đầu · l đuôi nhiều tầng · r vương miện tự nhiên · x vây trong suốt · q xúc tu · a sinh sản đơn tính */
const ROWS = `
a_clown|Cá hề|fish|70|.55|fan|#ff8a1f|#ffb14d|#ff6f00|bands|#ffffff|
a_guppy|Cá bảy màu|fish|56|.42|veil|#5fd0ff|#d9f4ff|#ff6fb5|spots|#ffe14d|s
a_neon|Cá neon|fish|50|.32|fork|#6ee0ff|#e8fbff|#ff4a5c|stripe|#2a7bff|s
a_gold|Cá vàng|fish|76|.62|veil|#ffb21f|#ffe08a|#ff8c1a|scales|#ffd04d|
a_molly|Cá molly|fish|60|.45|fan|#3b4075|#c9cde8|#5a60a8|spots|#ffffff|
a_sword|Cá kiếm|fish|74|.38|sword|#ff6a4d|#ffd0b8|#ffcf33|stripe|#ffffff|
a_angel|Cá ông tiên|fish|72|.95|fork|#e8f2ff|#ffffff|#9ad0ff|bands|#34425e|
a_betta|Cá betta|fish|62|.46|veil|#d84dff|#ffd0ff|#7a5cff|scales|#ff6ad5|
a_swordt|Cá đuôi kiếm|fish|70|.4|sword|#38c6a8|#d4fff3|#ff9a3c|stripe|#ff5a5a|
a_tetra|Cá tetra|fish|52|.36|fork|#c9d6e8|#ffffff|#ff7a5a|stripe|#2b6bff|s
a_rainbow|Cá cầu vồng|fish|66|.5|fan|#4dd2ff|#fff1a8|#ff7ad1|bands|#ffd24d|s
a_zebra|Cá sọc ngựa|fish|54|.36|fork|#f2f6ff|#ffffff|#9ad0ff|stripe|#2a4a8a|s
a_platy|Cá mún|fish|50|.46|fan|#ff9a5c|#ffe3c9|#ff6a3d|spots|#2a2a2a|
a_ram|Cá bình tích|fish|52|.62|fan|#ffd36b|#fff3d0|#6aa8ff|spots|#2a4a8a|
a_discus|Cá đĩa|fish|84|.98|round|#ff7a5c|#ffd9c9|#ff4d5c|bands|#2a6fff|
a_goby|Cá bống|fish|60|.28|fan|#b99a6b|#e8d9b8|#8a6a3b|spots|#5a3b1a|b
a_cory|Cá chuột|fish|56|.36|fork|#c9a36b|#f0e0c0|#8a6a3b|spots|#4a3a2a|bs
a_horse|Cá ngựa|horse|70|1|none|#ffcf4d|#fff0b0|#ff9a1f|bands|#ff8a1f|
a_puffer|Cá nóc|fish|62|.9|round|#ffd75a|#fff4c9|#ffb21f|spots|#c9962a|k
a_butter|Cá bướm|fish|68|.9|fan|#ffe14d|#fffbd0|#2b2f55|bands|#2b2f55|
b_lion|Cá sư tử|fish|92|.62|feather|#d84a3a|#ffd9c9|#ffffff|stripe|#ffffff|k
b_moon|Cá mặt trăng|fish|100|1|round|#cfd9e8|#ffffff|#a9b9d0|spots|#8aa0c0|
b_ray|Cá đuối|ray|110|.5|none|#5da0e8|#e8f4ff|#3b6fb8|spots|#ffffff|
b_fhorse|Cá ngựa biển kỳ ảo|horse|80|1|none|#b88cff|#ffd9ff|#ff7ad1|spots|#ffffff|g
b_octo|Bạch tuộc|octo|90|1|none|#ff8fb0|#ffd0df|#ff5a8a|spots|#ffffff|
b_squid|Mực|fish|100|.4|squid|#ff9a5c|#ffe0c9|#ff6a3d|spots|#ffffff|q
b_jelly|Sứa|jelly|80|1|none|#8fe0ff|#d9f6ff|#5fb8e8|none|#ffffff|ga
b_star|Sao biển sống|star|70|1|none|#ffd14d|#fff0a8|#ff9a1f|spots|#ff8a1f|ba
b_crab|Cua|crab|70|.6|none|#ff5a4d|#ffb39c|#d83a2f|none|#ffffff|b
b_shrimp|Tôm|shrimp|74|.4|none|#ff9a8a|#ffd9d0|#ff6a5a|stripe|#ffffff|b
b_cuc|Hải sâm|cuc|70|.4|none|#a78a6b|#d9c9a8|#6b5a3a|spots|#e8d9b8|ba
b_eel|Lươn biển|fish|140|.16|fan|#4a9a6b|#cfe8c0|#2a6a4a|spots|#ffe14d|
b_glion|Cá mao tiên phát sáng|fish|92|.62|feather|#7a5cff|#d9d0ff|#4dd2ff|stripe|#4dffea|gk
b_dragon|Cá rồng biển|dragon|90|1|none|#b8e86a|#e8ffb0|#4dc28a|spots|#ffd24d|
b_angelb|Cá thiên thần|fish|84|1|fork|#4da0ff|#ffe14d|#ffe14d|stripe|#ffffff|
c_garowana|Cá rồng vàng|fish|120|.3|fan|#ffcf33|#fff0b0|#ffa31a|scales|#fff3a0|g
c_parowana|Cá rồng bạch kim|fish|120|.3|fan|#e8eef8|#ffffff|#b8c8e8|scales|#ffffff|g
c_koi|Cá koi hoàng gia|fish|110|.42|fan|#ffffff|#ffffff|#ff8a1f|spots|#ff3d2a|
c_cangel|Cá thiên thần pha lê|fish|90|1|fork|#bfe8ff|#ffffff|#d9f0ff|stripe|#ffffff|cx
c_neonr|Cá neon cầu vồng|fish|60|.34|fork|#7af0ff|#ffffff|#ff7ad1|stripe|#ffe14d|gs
c_longg|Cá đuôi dài hoàng kim|fish|80|.5|veil|#ffd03a|#fff0b0|#ffb21f|scales|#ffffff|gl
c_dscale|Cá vảy kim cương|fish|84|.56|fan|#dfe8ff|#ffffff|#b8d0ff|scales|#ffffff|cg
c_cglow|Cá san hô phát sáng|fish|74|.56|fan|#ff6a8a|#ffd0dd|#ffb04d|spots|#ffe14d|g
c_pearl|Cá ngọc trai|fish|76|.6|round|#fff4f0|#ffffff|#ffd9e8|spots|#e8d0ff|g
c_bfire|Cá lửa xanh|fish|82|.5|flame|#2a8aff|#8fd0ff|#4dd2ff|stripe|#bff0ff|g
c_night|Cá bóng đêm|fish|82|.5|veil|#1f2a5a|#4a5aa0|#7a5cff|spots|#c9d0ff|gn
c_cryst|Cá pha lê|fish|78|.5|fan|#d9f6ff|#ffffff|#bff0ff|none|#ffffff|cx
c_dusk|Cá hoàng hôn|fish|82|.52|veil|#ff7a5a|#ffd0a0|#ff4d9a|bands|#ffb04d|g
c_ice|Cá băng giá|fish|82|.5|fan|#d0f0ff|#ffffff|#8fd0ff|scales|#ffffff|cg
c_sun|Cá mặt trời|fish|86|.8|fan|#ffd03a|#fff4b0|#ff9a1a|stripe|#ff6a1a|g
d_skyd|Cá rồng thiên giới|fish|150|.32|fan|#ffd34d|#fff4b8|#ff5a3a|scales|#ffffff|glr
d_phoen|Cá phượng hoàng biển|fish|120|.5|flame|#ff6a3a|#ffd08a|#ffcf33|scales|#ffe14d|glw
d_lgod|Cá thần ánh sáng|fish|110|.6|veil|#fff4b0|#ffffff|#ffe14d|stripe|#ffffff|glr
d_spirit|Cá tinh linh|fish|100|.5|veil|#b8ffe8|#ffffff|#7af0ff|spots|#ffffff|glx
d_galaxy|Cá thiên hà|fish|110|.6|veil|#2b2f8a|#6a4cff|#ff7ad1|galaxy|#ffffff|gl
d_eclip|Cá nhật thực|fish|108|.62|fan|#1a1a2a|#ffb04d|#ffcf33|bands|#ffcf33|g
d_lunar|Cá nguyệt thực|fish|108|.62|fan|#2a2f5a|#c9d0ff|#8fa0ff|bands|#e8eaff|g
d_acryst|Cá pha lê cổ đại|fish|120|.55|fan|#bfd8ff|#ffffff|#9ad0ff|scales|#ffffff|cgxr
d_emper|Cá hoàng đế đại dương|fish|130|.6|veil|#2a6aff|#ffd34d|#ffd34d|scales|#ffe14d|glr
d_longg|Cá long thần|fish|160|.26|fan|#4dd2c9|#d9fff3|#ffd34d|scales|#ffffff|glrh
d_starsea|Cá biển sao|fish|100|.6|fan|#2a3a9a|#7a8aff|#ffe14d|galaxy|#ffe14d|gs
d_thund|Cá sấm sét|fish|110|.5|flame|#7a5cff|#d9d0ff|#ffe14d|stripe|#ffe14d|gl
d_icesp|Cá băng linh|fish|110|.54|veil|#bff0ff|#ffffff|#7ad0ff|scales|#ffffff|cgl
d_rbfor|Cá cầu vồng vĩnh cửu|fish|110|.58|veil|#ff7ad1|#ffffff|#4dd2ff|rainbow|#ffffff|gl
d_atlan|Cá hộ vệ Atlantis|fish|130|.6|fan|#3a7aff|#e8f0ff|#ffd34d|scales|#ffd34d|grh
e_tri|Cá ba đuôi|fish|76|.5|tri|#ff9ad0|#ffe3f0|#ff6aa8|spots|#ffffff|t
e_two|Cá hai đầu|fish|80|.5|fan|#6ad0b0|#d9fff0|#3aa88a|stripe|#ffffff|d
e_wing|Cá có vây hình cánh|fish|80|.5|fan|#7ab8ff|#e0f0ff|#b8d8ff|stripe|#ffffff|w
e_horn|Cá có sừng pha lê|fish|84|.5|fan|#c9a8ff|#f0e0ff|#9a7aff|spots|#ffffff|hc
e_gscale|Cá có vảy phát sáng|fish|80|.54|fan|#2a9a8a|#bff0e0|#4dffd0|scales|#4dffd0|g
e_flamet|Cá có đuôi hình lửa|fish|84|.5|flame|#ff8a3a|#ffd0a0|#ff4a1a|stripe|#ffe14d|
e_wswim|Cá có cánh bơi|fish|84|.5|fork|#ff9ab0|#ffe0e8|#ffd0dd|spots|#ffffff|w
e_ncrown|Cá có vương miện tự nhiên|fish|90|.55|fan|#6a8aff|#e0e8ff|#ffd34d|scales|#ffffff|r
e_clearf|Cá có vây trong suốt|fish|82|.5|veil|#ffb06a|#ffe8d0|#ffffff|spots|#ffffff|x
e_galpat|Cá có hoa văn thiên hà|fish|84|.56|fan|#3a2a8a|#7a5cff|#ff7ad1|galaxy|#ffffff|g
e_cbody|Cá có thân pha lê|fish|84|.5|fan|#d0f4ff|#ffffff|#a8e0ff|scales|#ffffff|cx
e_gspine|Cá có gai phát quang|fish|78|.7|round|#ffd75a|#fff4c9|#ffb21f|spots|#ff8a1f|gk
e_ltail|Cá có đuôi nhiều tầng|fish|84|.5|veil|#ff7ad1|#ffd9f0|#ffa0e0|stripe|#ffffff|l
e_multi|Cá lai tạo nhiều màu|fish|84|.54|fan|#ff7ad1|#fff1a8|#4dd2ff|rainbow|#ffffff|
e_unique|Cá biến dị độc nhất|fish|100|.56|veil|#2a1a6a|#ff7ad1|#4dffea|galaxy|#ffe14d|gtdl
`.trim().split('\n');
const GKEY = i => i < 20 ? 'A' : i < 35 ? 'B' : i < 50 ? 'C' : i < 65 ? 'D' : 'E';
OD.SPECIES = ROWS.map((r, i) => {
  const [id, n, arch, L, H, tail, c1, c2, c3, pat, patC, fl] = r.split('|'), g = GKEY(i), gi = i < 20 ? i : i < 35 ? i - 20 : i < 50 ? i - 35 : i < 65 ? i - 50 : i - 65;
  const tier = g === 'A' ? 0 : g === 'B' ? 1 : g === 'C' ? (gi < 8 ? 2 : 3) : g === 'D' ? 4 : 5;
  const val = { A: 60 + 6 * gi, B: 160 + 14 * gi, C: 700 + 60 * gi, D: 4500 + 400 * gi, E: 2200 + 150 * gi }[g];
  const lvl = g === 'A' ? 1 + (gi >= 6) + (gi >= 12) + (gi >= 16) : g === 'B' ? 4 + (gi / 3 | 0) : g === 'C' ? 9 + (gi >> 1) : 99;
  return {
    id, n, g, tier, arch, L: +L, H: +H, tail, c: [c1, c2, c3], pat, patC, fl: fl || '', val, price: Math.round(val * OD.ECON.buyFryMul), buy: g < 'D', lvl,
    growMin: [18, 26, 40, 55, 75, 60][tier],           // phút (thời gian thật ở 1×) để đạt trưởng thành
    breedMin: [5, 6, 8, 10, 12, 10][tier], eggs: [[2, 5], [2, 4], [1, 3], [1, 2], [1, 2], [1, 3]][tier],
    life: 'Không giới hạn (không chết bất ngờ)', env: (fl || '').includes('b') ? 'Đáy hồ, cát và đá' : (fl || '').includes('n') ? 'Vùng nước tối, hang' : (fl || '').includes('s') ? 'Nước mở, theo đàn' : 'Mọi tầng nước',
    school: (fl || '').includes('s'), bottom: (fl || '').includes('b'), night: (fl || '').includes('n'), asex: (fl || '').includes('a'), idx: i
  };
});
OD.SP = {}; OD.SPECIES.forEach(s => OD.SP[s.id] = s);

/* ---------- 20 thực vật: id|tên|kiểu|màu1|màu2|cờ|giá ---------- */
OD.PLANTS = `
p01|Rong đuôi chó|blade|#3fae5a|#7fdc7a||40
p02|Rong la hán|paddle|#2f9a5a|#6fd08a||55
p03|Rong mái chèo|paddle|#4aa86a|#a0e07a||55
p04|Cỏ biển|grass|#4fc06a|#a8ee8a||35
p05|Rong đỏ|kelp|#e0405a|#ff8aa0||60
p06|Rong tím|kelp|#8e5bd6|#c9a0ff||60
p07|Rong xanh phát sáng|kelp|#2fe0a0|#b0ffe0|g|180
p08|Tảo lục|blob|#5bc07a|#a8f0b0||45
p09|San hô mềm dạng cây|tree|#ff9ab0|#ffd0dd|s|120
p10|San hô nhánh|branch|#ff6a5a|#ffa090|s|110
p11|San hô quạt|fan|#ff7ac0|#ffc0e8|s|130
p12|San hô cầu vồng|branch|rainbow|rainbow|gs|260
p13|Hải quỳ|anem|#ff8a5c|#ffd0a8|s|150
p14|Cỏ biển phát sáng|grass|#4dffd0|#d0fff0|g|200
p15|Rong vàng|kelp|#e8c83a|#fff08a||70
p16|Tảo bong bóng|bubble|#7adcb0|#d0fff0||90
p17|Cây thủy sinh lá rộng|paddle|#2f8a4a|#7fd07a||100
p18|Thực vật pha lê|crystal|#9ae0ff|#ffffff|gx|320
p19|Rong thiên hà|kelp|#5a4cff|#ff7ad1|g|400
p20|Cây biển cổ đại|ancient|#6a8a6a|#ffd34d|gs|600
`.trim().split('\n').map(r => { const [id, n, kind, c1, c2, fl, price] = r.split('|'); return { id, n, kind, c: [c1, c2], fl, price: +price, shelter: fl.includes('s'), glow: fl.includes('g') }; });
OD.PL = {}; OD.PLANTS.forEach(p => OD.PL[p.id] = p);

/* ---------- 40 vật trang trí: id|tên|nhóm|mẫu|màu1|màu2|giá|cờ ---------- */
OD.DECOR = `
d01|Đá cuội|1|rock|#8a93a3|#c3cad6|30|
d02|Đá núi lửa|1|rock|#4a3a3a|#ff6a3a|60|g
d03|Hang đá nhỏ|1|cave|#7a8294|#2a2f45|90|h
d04|Hang đá lớn|1|cave|#6a7388|#1a1f33|180|hL
d05|Vòm đá|1|arch|#8a93a3|#c3cad6|140|
d06|Đường hầm san hô|1|arch|#ff7a9a|#ffc0d0|220|h
d07|Vách đá|1|cliff|#6a7388|#9aa3b8|160|
d08|Hang pha lê|1|cave|#9ad0ff|#4a5aa0|380|hg
d09|Tàn tích cổ đại|1|ruins|#a8b0a0|#e8eed8|300|
d10|Cổng Atlantis|1|gate|#9ad0e0|#ffd34d|700|g
d11|San hô đỏ|2|coral|#ff4a4a|#ff9a9a|60|
d12|San hô xanh|2|coral|#3aa0ff|#9ad0ff|60|
d13|San hô tím|2|coral|#a05cff|#d0a8ff|60|
d14|San hô vàng|2|coral|#ffc83a|#fff08a|60|
d15|San hô phát sáng|2|coral|#4dffd0|#d0fff0|220|g
d16|Cụm hải quỳ|2|anem|#ff8a5c|#ffd0a8|130|
d17|Bụi rong cầu vồng|2|tuft|rainbow|rainbow|180|g
d18|Cụm rong pha lê|2|crys|#9ae0ff|#ffffff|260|g
d19|Cây biển mini|2|tree|#6aa86a|#ffd34d|100|
d20|Rừng rong phát sáng|2|tuft|#2fe0a0|#b0ffe0|320|gW
d21|Tàu đắm|3|ship|#8a6a4a|#c9a070|450|
d22|Rương kho báu|3|chest|#b07a3a|#ffd34d|200|
d23|Mỏ neo|3|anchor|#6a7a9a|#b0c0d8|120|
d24|Tượng đá|3|statue|#a8b0b8|#e0e6ee|240|
d25|Lâu đài mini|3|castle|#ffd0a0|#ff9a7a|380|
d26|Đèn biển|3|light|#ffffff|#ff4a4a|340|g
d27|Bánh lái tàu|3|wheel|#8a6a4a|#c9a070|150|
d28|Cầu đá|3|arch|#8a93a3|#c3cad6|210|b
d29|Tượng thần biển|3|statue|#7ab8c9|#ffd34d|520|t
d30|Con tàu ma|3|ship|#6a7aa8|#c9d0ff|850|gG
d31|Cổng thiên hà|4|gate|#3a2a8a|#ff7ad1|1500|gS
d32|Tháp pha lê|4|tower|#9ad0ff|#ffffff|1200|g
d33|Cung điện dưới nước|4|castle|#bff0ff|#7ad0ff|2200|gP
d34|Đài phun bong bóng|4|fountain|#9ad0e0|#ffffff|900|g
d35|Vương miện khổng lồ|4|crown|#ffd34d|#ff4a6a|1800|g
d36|Tinh thể ánh trăng|4|moon|#c9d0ff|#ffffff|1400|g
d37|Mặt trời thu nhỏ|4|sun|#ffd34d|#ff9a1a|2000|g
d38|Cổng san hô vàng|4|gate|#ffc83a|#fff08a|1100|g
d39|Tượng rồng biển|4|dragon|#4dd2c9|#ffd34d|1700|g
d40|Trái tim đại dương|4|heart|#ff4a8a|#ffb0d0|2600|g
`.trim().split('\n').map(r => { const [id, n, grp, prim, c1, c2, price, fl] = r.split('|'); return { id, n, grp: +grp, prim, c: [c1, c2], price: +price, fl, glow: fl.includes('g'), cave: fl.includes('h') }; });
OD.DC = {}; OD.DECOR.forEach(d => OD.DC[d.id] = d);

/* ---------- Thức ăn (9) ---------- */
OD.FOODS = [
  { id: 'basic', n: 'Thức ăn cơ bản', price: 20, pack: 6, hun: 28, joy: 2, d: 'Hạt dinh dưỡng thông thường.' },
  { id: 'growth', n: 'Thức ăn tăng trưởng', price: 70, pack: 5, hun: 26, joy: 2, grow: 3, d: 'Tăng thêm 3% tăng trưởng mỗi hạt.' },
  { id: 'color', n: 'Thức ăn tăng màu sắc', price: 90, pack: 5, hun: 22, joy: 3, color: 1, d: 'Màu sắc rực rỡ hơn, tăng giá trị cá.' },
  { id: 'happy', n: 'Thức ăn tăng hạnh phúc', price: 60, pack: 5, hun: 18, joy: 22, d: 'Cá vui vẻ hơn.' },
  { id: 'fry', n: 'Thức ăn cho cá con', price: 45, pack: 6, hun: 30, joy: 3, fry: 1, grow: 5, d: 'Dành cho cá con, hiệu quả gấp đôi với cá nhỏ.' },
  { id: 'breed', n: 'Thức ăn hỗ trợ sinh sản', price: 110, pack: 4, hun: 24, joy: 5, breed: 1, d: 'Rút ngắn thời gian hồi phục sinh sản.' },
  { id: 'rare', n: 'Thức ăn cho cá quý hiếm', price: 160, pack: 4, hun: 35, joy: 10, rare: 1, grow: 2, d: 'Hiệu quả cao với cá hiếm và cực hiếm.' },
  { id: 'glow', n: 'Thức ăn phát sáng', price: 130, pack: 4, hun: 22, joy: 6, glow: 1, d: 'Cá phát sáng tạm thời.' },
  { id: 'legend', n: 'Thức ăn huyền thoại', price: 520, pack: 3, hun: 50, joy: 25, grow: 6, inc: 1, d: 'Dành cho sinh vật huyền thoại, tăng thu nhập tạm thời.' }
];
OD.FD = {}; OD.FOODS.forEach(f => OD.FD[f.id] = f);

/* ---------- Thuốc (23) ---------- */
OD.POTIONS = [
  { id: 'g1', cat: 'Tăng trưởng', n: 'Thuốc tăng trưởng cơ bản', price: 150, fx: { grow: 20 }, d: 'Tăng 20% tăng trưởng.' },
  { id: 'g2', cat: 'Tăng trưởng', n: 'Thuốc tăng trưởng cao cấp', price: 400, fx: { grow: 40 }, d: 'Tăng 40% tăng trưởng.' },
  { id: 'g3', cat: 'Tăng trưởng', n: 'Thuốc tăng trưởng vượt cấp', price: 1100, fx: { stageUp: 1 }, d: 'Lên thẳng giai đoạn kế tiếp (không bỏ qua trạng thái nào).' },
  { id: 'g4', cat: 'Tăng trưởng', n: 'Thuốc tiến hóa thần tốc', price: 3500, fx: { toAdult: 1, size: .04 }, d: 'Trưởng thành ngay, +4% kích thước.' },
  { id: 'g5', cat: 'Tăng trưởng', n: 'Thuốc tăng trưởng huyền thoại', price: 9000, fx: { toAdult: 1, size: .12, variant: .05 }, d: 'Trưởng thành ngay, +12% kích thước, 5% biến thể màu.' },
  { id: 'b1', cat: 'Sinh sản', n: 'Thuốc tăng khả năng sinh sản', price: 200, fx: { eggs: 1 }, d: 'Lần sinh sản tới thêm 1 trứng.' },
  { id: 'b2', cat: 'Sinh sản', n: 'Thuốc rút ngắn hồi phục', price: 160, fx: { clearCd: 1 }, d: 'Xóa thời gian hồi phục sinh sản.' },
  { id: 'b3', cat: 'Sinh sản', n: 'Thuốc tăng số lượng trứng', price: 450, fx: { eggs: 2 }, d: 'Lần sinh sản tới thêm 2 trứng.' },
  { id: 'b4', cat: 'Sinh sản', n: 'Thuốc tăng khả năng tương thích', price: 600, fx: { compat: 1 }, d: 'Cho phép lai khác nhóm một lần.' },
  { id: 'b5', cat: 'Sinh sản', n: 'Thuốc thừa hưởng đặc tính hiếm', price: 900, fx: { rare: .35 }, d: '+35% xác suất con thừa hưởng đặc tính hiếm.' },
  { id: 'a1', cat: 'Ngoại hình', n: 'Thuốc đổi màu', price: 250, fx: { hue: 1 }, d: 'Đổi màu thân ngẫu nhiên.' },
  { id: 'a2', cat: 'Ngoại hình', n: 'Thuốc đổi hoa văn', price: 300, fx: { pat: 1 }, d: 'Đổi hoa văn ngẫu nhiên.' },
  { id: 'a3', cat: 'Ngoại hình', n: 'Thuốc tăng độ sáng', price: 280, fx: { glow: .35 }, d: '+35% độ phát sáng.' },
  { id: 'a4', cat: 'Ngoại hình', n: 'Thuốc vảy ánh kim', price: 520, fx: { foil: 1 }, d: 'Vảy ánh kim lấp lánh.' },
  { id: 'a5', cat: 'Ngoại hình', n: 'Thuốc biến đổi vây', price: 450, fx: { fin: 1 }, d: 'Vây lớn hơn và đổi kiểu.' },
  { id: 'a6', cat: 'Ngoại hình', n: 'Thuốc biến đổi đuôi', price: 450, fx: { tail: 1 }, d: 'Đuôi dài hơn, có thêm tầng.' },
  { id: 'a7', cat: 'Ngoại hình', n: 'Thuốc kích hoạt đặc tính tiềm ẩn', price: 800, fx: { hidden: 1 }, d: 'Kích hoạt một đặc tính tiềm ẩn của cá.' },
  { id: 'm1', cat: 'Đột biến', n: 'Thuốc đột biến cơ bản', price: 600, tbl: [['color', 60], ['pattern', 25], ['morph', 10], ['rare', 4], ['crown', 1]], d: 'Đột biến ngẫu nhiên cơ bản.' },
  { id: 'm2', cat: 'Đột biến', n: 'Thuốc đột biến màu sắc', price: 700, tbl: [['color', 80], ['pattern', 20]], d: 'Chỉ biến đổi màu và hoa văn.' },
  { id: 'm3', cat: 'Đột biến', n: 'Thuốc đột biến hình thái', price: 1200, tbl: [['morph', 70], ['fin', 20], ['rare', 10]], d: 'Có thể mọc sừng, cánh, thêm đuôi…' },
  { id: 'm4', cat: 'Đột biến', n: 'Thuốc đột biến phát sáng', price: 1000, tbl: [['glow', 75], ['rare', 20], ['crown', 5]], d: 'Tăng phát sáng, có thể kèm đặc tính hiếm.' },
  { id: 'm5', cat: 'Đột biến', n: 'Thuốc đột biến vương miện', price: 4000, tbl: [['crown', 22], ['rare', 33], ['none', 45]], d: 'Cơ hội nhận vương miện (45% không có kết quả).' },
  { id: 'm6', cat: 'Đột biến', n: 'Thuốc đột biến huyền thoại', price: 9000, tbl: [['species', 15], ['crown', 20], ['rare', 35], ['morph', 30]], d: 'Có thể biến thành loài đột biến đặc biệt.' }
];
OD.PT = {}; OD.POTIONS.forEach(p => OD.PT[p.id] = p);
OD.MUT_LABEL = { color: 'Đột biến màu sắc', pattern: 'Đột biến hoa văn', morph: 'Đột biến hình thái', rare: 'Đặc tính hiếm', crown: 'Vương miện', glow: 'Đột biến phát sáng', fin: 'Đột biến vây', species: 'Biến thành loài đột biến', none: 'Không có kết quả' };
OD.RARE_TRAITS = ['Ánh kim', 'Cực quang', 'Pha lê hóa', 'Vảy sao', 'Ánh trăng', 'Lửa lạnh'];

/* ---------- Nhiệm vụ & thành tựu ---------- */
OD.QUESTS = [
  { id: 's1', t: 's', n: 'Cho cá ăn', k: 'fed', v: 1, r: 30 }, { id: 's2', t: 's', n: 'Thu Đồng Xu Đại Dương', k: 'harvests', v: 1, r: 40 },
  { id: 's3', t: 's', n: 'Mua một vật trang trí hoặc thực vật', k: 'decorBought', v: 1, r: 60 }, { id: 's4', t: 's', n: 'Mua một loài cá mới', k: 'speciesBought', v: 1, r: 80 },
  { id: 's5', t: 's', n: 'Nuôi một cá trưởng thành', k: 'adults', v: 1, r: 100 }, { id: 's6', t: 's', n: 'Thu hoạch thu nhập 3 lần', k: 'harvests', v: 3, r: 100 },
  { id: 's7', t: 's', n: 'Cho cá sinh sản', k: 'bred', v: 1, r: 150 }, { id: 's8', t: 's', n: 'Nở một quả trứng', k: 'hatched', v: 1, r: 150 },
  { id: 's9', t: 's', n: 'Khám phá một loài mới', k: 'discovered', v: 1, r: 200 }, { id: 's10', t: 's', n: 'Sử dụng một loại thuốc', k: 'potions', v: 1, r: 120 },
  { id: 'd1', t: 'd', n: 'Cho cá ăn 5 lần', k: 'fed', v: 5, r: 40 }, { id: 'd2', t: 'd', n: 'Thu thập 3 vật phẩm trong hồ', k: 'items', v: 3, r: 60 },
  { id: 'd3', t: 'd', n: 'Tương tác với cá 10 lần', k: 'touch', v: 10, r: 50 }, { id: 'd4', t: 'd', n: 'Mua 1 vật phẩm bất kỳ', k: 'buys', v: 1, r: 40 },
  { id: 'd5', t: 'd', n: 'Thu hoạch thu nhập 5 lần', k: 'harvests', v: 5, r: 70 }, { id: 'd6', t: 'd', n: 'Có thêm 1 trứng hoặc 1 lần lai tạo', k: 'bred', v: 1, r: 80 },
  { id: 'l1', t: 'l', n: 'Sưu tầm 20 loài', k: 'owned', v: 20, r: 800, abs: 1 }, { id: 'l2', t: 'l', n: 'Sưu tầm 50 loài', k: 'owned', v: 50, r: 3000, abs: 1 },
  { id: 'l3', t: 'l', n: 'Mở khóa đủ 80 loài ban đầu', k: 'owned80', v: 80, r: 20000, abs: 1 }, { id: 'l4', t: 'l', n: 'Sở hữu một cá huyền thoại', k: 'legend', v: 1, r: 2500 },
  { id: 'l5', t: 'l', n: 'Lai tạo cá có 3 đặc tính hiếm', k: 'rare3', v: 1, r: 3500 }, { id: 'l6', t: 'l', n: 'Tạo cá đột biến vương miện', k: 'crowns', v: 1, r: 4000 },
  { id: 'l7', t: 'l', n: 'Nuôi cá đạt kích thước đặc biệt', k: 'bigfish', v: 1, r: 1500 }, { id: 'l8', t: 'l', n: 'Đặt 10 vật trang trí/thực vật trong hồ', k: 'placed', v: 10, r: 1200, abs: 1 },
  { id: 'l9', t: 'l', n: 'Đạt tổng thu nhập 10.000 xu', k: 'earned', v: 10000, r: 3000, abs: 1 }, { id: 'l10', t: 'l', n: 'Hoàn thành một bộ sưu tập nhóm', k: 'groupDone', v: 1, r: 5000 }
];
OD.ACH = [
  { id: 'a1', n: 'Người nuôi cá mới', k: 'placedFish', v: 5, r: 100, i: '🐟' }, { id: 'a2', n: 'Bậc thầy chăm sóc', k: 'fed', v: 200, r: 600, i: '🍤' },
  { id: 'a3', n: 'Nhà lai tạo', k: 'bred', v: 15, r: 800, i: '🧬' }, { id: 'a4', n: 'Nhà di truyền học đại dương', k: 'discovered', v: 10, r: 1500, i: '🔬' },
  { id: 'a5', n: 'Thợ săn kho báu', k: 'items', v: 60, r: 1000, i: '💎' }, { id: 'a6', n: 'Nhà sưu tầm', k: 'owned', v: 40, r: 2500, i: '📚', abs: 1 },
  { id: 'a7', n: 'Hoàng đế san hô', k: 'placed', v: 25, r: 2000, i: '🪸', abs: 1 }, { id: 'a8', n: 'Chúa tể cá rồng', k: 'dragons', v: 2, r: 3000, i: '🐉' },
  { id: 'a9', n: 'Chủ nhân cá vương miện', k: 'crowns', v: 3, r: 5000, i: '👑' }, { id: 'a10', n: 'Huyền thoại đại dương', k: 'legend', v: 5, r: 10000, i: '🌊' }
];
OD.LEVEL_XP = l => Math.round(60 * Math.pow(l, 1.5));
OD.WEATHER = { clear: 'Trời quang', sun: 'Nắng nhẹ', cloud: 'Mây phủ', rain: 'Mưa', heavy: 'Mưa lớn', wind: 'Gió mạnh', storm: 'Bão', magic: 'Phát sáng kỳ ảo' };
OD.STATUS = [
  ['ok', 'Hồ cá sống động, 80 loài / 20 thực vật / 40 vật trang trí (dữ liệu + hình vẽ tham số)'], ['ok', 'Vòng đời 5 giai đoạn với hình thái thay đổi, thuốc tăng trưởng'],
  ['ok', 'Bơi lội có AI & tính cách, tương tác chạm, cho ăn, tranh mồi'], ['ok', 'Sinh sản tự nhiên, lai tạo thủ công, di truyền, đột biến, vương miện, phả hệ'],
  ['ok', 'Kinh tế một đơn vị tiền, thu nhập định kỳ, bán/mua, ngoại tuyến, sổ giao dịch'], ['ok', 'Cửa hàng, thuốc (23), thức ăn (9), bộ sưu tập, nhiệm vụ, thành tựu, nhật ký'],
  ['ok', 'Ngày đêm, thời tiết, âm thanh tổng hợp, vật phẩm ngẫu nhiên, chụp ảnh'], ['part', 'Đồ họa là 2D nhiều lớp (giả chiều sâu), chưa phải 3D thật; các loài chia sẻ khung hình thái và khác nhau ở tham số/hoa văn'],
  ['part', '40 vật trang trí dùng ~16 mẫu hình + biến thể màu, chưa có mô hình riêng cho từng vật'], ['part', 'Ngôn ngữ giao diện Ocean Life: tiếng Việt'], ['no', 'Nhiều hồ (đã thiết kế dữ liệu, chưa triển khai)'],
  ['no', 'Đồng bộ đám mây / chống gian lận phía máy chủ (dữ liệu chỉ lưu trên thiết bị này)'], ['no', 'Bản đồ khám phá riêng (hiện là vật phẩm xuất hiện trong hồ)']
];
})();
