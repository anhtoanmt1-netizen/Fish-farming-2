# OCEAN LIFE – Tài liệu thiết kế & trạng thái thực tế

Trò chơi nuôi cá nằm trong "Giao diện trò chơi" của SPX Express (mật khẩu 111291). Thuần HTML5 Canvas 2D, không ảnh tĩnh: mọi sinh vật vẽ bằng mã (phong cách hình dán kawaii: viền trắng, mắt to bóng, má hồng, màu phấn).

## 1. Vòng chơi cốt lõi
Mua cá giống/trứng → cho ăn, chăm sóc → cá lớn qua 4 giai đoạn (+ trứng) → cá trưởng thành sinh thu nhập và sinh sản → bán/lai tạo/đột biến để có cá quý → thu thập đủ 80 loài + cá lai, mở rộng hồ.
Tiền tệ duy nhất: **Đồng Xu Đại Dương** (khởi đầu 300 xu, 3 cá giống, 30 thức ăn).

## 2. Kiến trúc tệp
| Tệp | Vai trò |
|---|---|
| `ocean_data.js` | Dữ liệu: 80 loài, 20 thực vật, 40 vật trang trí, 9 thức ăn, 23 thuốc, 26 nhiệm vụ, 10 thành tựu, kinh tế, trạng thái tính năng |
| `ocean_art.js` | Bộ vẽ procedural: thân cá uốn sóng, 9 kiểu đuôi, vây, họa tiết, vương miện, sinh vật đặc biệt, trứng, thực vật, trang trí, nền ngày/đêm, ảnh thu nhỏ có cache |
| `ocean.js` | Lõi: trạng thái, lưu/khôi phục, mô phỏng, AI, di truyền, kinh tế, thời tiết, âm thanh, vẽ, điều khiển |
| `ocean_ui.js` | Giao diện: thanh trạng thái, 7 mục điều hướng, bảng thông tin cá, cửa hàng, sưu tập, lai tạo, thuốc, trang trí, nhiệm vụ, ví, nhật ký, cài đặt, chụp ảnh |

## 3. Mô hình dữ liệu (lưu `localStorage` khóa `spx_ocean_v1`)
Cá: `id, sp (mã loài), name, born, grow 0–100, hun, joy, hp, fr (thân thiện), g (gen), pers[], inc{n,acc}, cd (hồi sinh sản), anc (phả hệ 3 đời), gen (F0,F1…), mut[], boost, lock, fav`.
Gen: `hue, sat, bri, size, fin, tail, pat, patC, glow, crystal, horn, spikes, wings, heads, tails, layers, foil, crown, rare[]`.
Trứng: loài, gen, tính cách, phả hệ, thời điểm nở. Trạng thái chung: xu, cấp, XP, kho, vật đặt, bộ sưu tập, loài lai (`hyb`), biến thể (`phen`), nhiệm vụ, sổ giao dịch, nhật ký, cài đặt.

## 4. Hệ loài (80 loài, 5 nhóm)
A phổ biến (20) · B đặc biệt (15) · C quý hiếm (15) · D huyền thoại (15, không bán) · E đột biến (15, không bán). Lai tạo sinh thêm **loài lai** tự động. 
Cá thân thon dùng chung bộ khung tham số (độ cao, đuôi, họa tiết, cờ đặc tính). Các dạng riêng: sứa, bạch tuộc, cua, tôm, sao biển, hải sâm, cá đuối, ngựa vằn/rồng biển.

## 5. Vòng đời & tăng trưởng
Trứng → Cá con (0–20%) → Thiếu nhi (20–45%) → Thiếu niên (45–75%) → Trưởng thành (≥75%, tối đa 100%). Mỗi giai đoạn đổi hình thái (tỷ lệ thân, mắt to hơn khi nhỏ, vây/đuôi ngắn, màu và họa tiết đậm dần). Tốc độ = 75 / (thời gian trưởng thành) × hệ số thời gian (mặc định 4×); đói/buồn làm chậm một nửa. **Không có cái chết đột ngột**: sức khỏe chỉ giảm tới mức sàn 40%.

## 6. AI bơi lội
Trạng thái: lang thang, bơi đàn, lao nhanh, lên mặt nước, xuống đáy, quanh cây, vào hang, tò mò, khám phá, ăn, tán tỉnh, khoe dáng, né tránh. Trọng số theo 15 tính cách, ngày/đêm, thời tiết. Lực tách nhau bằng lưới không gian; sinh vật đáy bám cát; sứa trôi, bạch tuộc phun từng đợt.
Chạm: chọn, phản ứng theo tính cách (chạy trốn, tiến lại, thả tim, khoe vây, phát sáng, xoay, giận…), giữ để cá đi theo, chọc 5 lần liên tiếp cá sẽ khó chịu (giảm thân thiện). Thân thiện cao mở thêm phản ứng tình cảm.

## 7. Sinh sản – di truyền – đột biến
Tự nhiên: hai cá trưởng thành, no, vui, khỏe, hết hồi phục, tương thích, ở gần nhau → tán tỉnh 7 giây → đẻ 1–6 trứng. Loài đơn tính đẻ một mình. Thủ công: Phòng lai tạo (tốn xu).
Tương thích: cùng loài, hoặc cá thân thon chênh ≤ 2 bậc hiếm (thuốc "cho phép lai" mở rộng). Loài con: 45% bố / 45% mẹ / 10% loài lai. Gen trung bình hai bên + nhiễu; đặc tính nhị phân kế thừa ~55%; đặc tính hiếm giữ ~40%.
Đột biến nền 4%/trứng (màu 45, hoa văn 20, hình thái 15, phát sáng 8, vây 7, hiếm 4, vương miện 1). Lai hai cá ≥ bậc 2 có ~1,5% ra loài huyền thoại; đột biến hình thái ~10% ra loài đột biến E. Vương miện 8 bậc (đồng → bạc → vàng → pha lê → cầu vồng → thiên hà → hoàng đế → cổ đại). Mỗi tổ hợp kiểu hình mới được ghi nhận và thưởng.
Thuốc (23): tăng trưởng, sinh sản, ngoại hình, đột biến; có bảng xác suất công khai, xác nhận trước khi dùng, chống bấm đúp trừ tiền hai lần.

## 8. Kinh tế (cân bằng để bán không thể lời vô hạn)
Mua cá con = 0,9 × giá trị; bán trưởng thành ≈ 0,62 × giá trị × hệ số (kích thước, hiếm, đột biến, vương miện, thế hệ, tối đa ×6) → luôn thấp hơn chi phí mua + nuôi cho cá thường. Trứng = 0,45 × giá trị.
Thu nhập: chỉ cá trưởng thành; 6 bậc, ví dụ phổ biến 5–15 xu/60 phút, huyền thoại 180–400 xu/15 phút, đột biến 200–1000 xu/12 phút (chia cho hệ số thời gian). Tích lũy tối đa 8 lần/cá, nhận bằng chạm biểu tượng xu hoặc "Thu tất cả".
Ngoại tuyến: tối đa 24 giờ; tính tăng trưởng, thu nhập, trứng nở; chặn đồng hồ lùi. Sự kiện rơi ngẫu nhiên: 28–75 giây/lần, tối đa 3 vật cùng lúc, 40 vật/giờ (kim cương, Mặt Trời ban ngày, rương, bong bóng, trứng bí ẩn, di vật).
Sổ giao dịch ghi nguồn thu/chi. Mở rộng hồ: 100 → 150 (2.500 xu) → 200 (9.000 xu).

## 9. Giao diện & trải nghiệm
Thanh trên (xu, cấp, thời tiết, chụp ảnh, nhật ký, cài đặt), nút nhanh (cho ăn, thu xu, phóng/thu), thanh dưới 7 mục. Hồ tự co giãn theo màn hình (dọc/ngang/ép ngang), kéo để di chuyển, chụm/cuộn để phóng to. Bảng thông tin cá có lý do khi nút bị khóa. Cửa hàng có xem trước động xoay chiều, đổi giai đoạn, phóng to. Bộ sưu tập có bóng đen cho loài chưa gặp, thưởng mốc 50%/100%. Âm thanh tổng hợp (không tệp ngoài), bật/tắt và âm lượng riêng.

## 10. Hiệu năng, lưu trữ, kiểm thử
LOD 3 mức theo kích thước trên màn hình, cache nền, lưới không gian, giới hạn hạt, tự giảm chất lượng khi chậm. Đo trong trình duyệt không GPU: 30 cá 60 fps, 60 cá 50 fps, 100 cá 36 fps, 120 cá 33 fps (điện thoại thật có GPU sẽ cao hơn). Tự lưu mỗi 20 giây và khi ẩn trang; có xuất/nhập sao lưu.
Đã kiểm thử tự động: khóa mật khẩu, mua/bán, sinh sản, nở trứng, lai khác loài, thuốc/đột biến, nhiệm vụ, lưu–tải, ngoại tuyến 5 giờ, bố cục dọc/ngang.

## Trạng thái tính năng (trung thực)
**Hoàn thành:** 80 loài procedural; vòng đời 4 giai đoạn có biến đổi hình thái; AI & phản ứng chạm; cho ăn; sinh sản tự nhiên và thủ công; di truyền, đột biến, loài lai, vương miện, phả hệ; thuốc; kinh tế một loại tiền; thu nhập & ngoại tuyến; cửa hàng, sưu tập, nhiệm vụ, thành tựu, ví, nhật ký; thời tiết, ngày đêm, âm thanh; vật phẩm rơi; chụp ảnh; lưu/xuất/nhập.
**Một phần:** "3D" là 2D nhiều lớp độ sâu (không phải 3D thật); nhiều loài dùng chung khung cá và khác nhau bằng tham số; 20 thực vật/40 trang trí dùng chung một số mẫu vẽ; giao diện Ocean Life chỉ có tiếng Việt; hệ thống sự kiện có khung nhưng chưa có nội dung.
**Chưa làm:** nhiều hồ; đồng bộ đám mây; thông báo đẩy; chợ giữa người chơi.
