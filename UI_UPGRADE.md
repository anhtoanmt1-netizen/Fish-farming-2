# Nâng cấp giao diện Ocean Life (UI/UX v2)

Chỉ thay đổi lớp giao diện/hình ảnh. Không đổi dữ liệu, công thức, khóa lưu `spx_ocean_v1`, mã định danh hay cơ chế gameplay (đã thử: tải bản lưu của phiên bản cũ vào bản mới, mua/cho ăn/thu xu/Back đều đúng).

## Hệ thiết kế (`ocean_ui.js`)
- Bảng màu: xanh đại dương/ngọc, trắng ngọc trai, vàng ánh kim (nút chính, tab chọn), san hô hồng (cảnh báo/bán), tím nhạt (huy hiệu cấp).
- Thanh trên dạng kính mờ: ví xu (đồng xu SVG), huy hiệu cấp + thanh kinh nghiệm, cụm công cụ (thời tiết, chụp ảnh, nhật ký, cài đặt). Cột nhanh bên phải: cho ăn, thu xu, phóng/thu.
- Bộ biểu tượng SVG đồng bộ cho thanh điều hướng và nút chức năng; thanh điều hướng dạng dock nổi, mục đang chọn phát sáng, vẫn truy cập được khi bảng đang mở (đổi mục không cần đóng bảng).
- Bảng chức năng: bo góc lớn, kính mờ, tay nắm kéo, hiệu ứng mở/đóng, chạm vùng tối phía trên để đóng; thẻ có viền màu theo độ hiếm, thẻ Cực hiếm/Huyền thoại/Đột biến ánh sáng lướt; loài khóa/chưa khám phá có trạng thái riêng.
- Nút: bình thường, nhấn (co + gợn sóng), chọn, khóa/không khả dụng (giữ lý do trong thông báo như cũ).
- Công tắc cài đặt dạng gạt; toast dạng viên thuốc; hộp thoại có hiệu ứng nảy.
- Hiệu ứng: xu nhảy khi nhận, pháo sáng nhỏ khi mua, và pháo sáng lớn khi nở trứng/tiến hóa/nhận thưởng/kim cương; chuyển tab mờ dần.
- Ngang/dọc: thanh điều hướng chuyển dọc bên phải ở chế độ ngang; bảng trượt từ trái. Tôn trọng `prefers-reduced-motion`.

## Đồ họa hồ (`ocean_art.js`, `ocean.js`)
- Nền nước nhiều lớp: quầng sáng mặt trời/trăng, tia sáng xuyên nước mềm, 2 lớp đá xa + san hô mờ, sương độ sâu, cát đáy có gợn sóng và ánh caustics.
- Mặt nước hai lớp sóng. Vignette nhẹ (đã cache), dòng bong bóng từ đáy cát, hạt sáng lấp lánh (ban đêm chuyển sang phát quang xanh).
- Quầng sáng cho cá Cực hiếm/Huyền thoại/Đột biến, cá có vương miện hoặc đột biến (tối đa 24/khung, tắt khi chất lượng thấp hoặc máy chậm).
- Vòng chọn cá phát sáng, nét đứt chuyển động. Ảnh thu nhỏ: nền ngọc trai–xanh, cá không còn bị cắt đuôi.
- Sửa lỗi có sẵn: bóng đen "chưa khám phá" bị phóng 2× nên không ra hình cá.

## Khác
- `sw.js`: tăng `CACHE` lên `ocean-life-v2` để PWA nhận giao diện mới.
- `index.html`: màn hình khởi động mới; phông Nunito (hỗ trợ tiếng Việt) tải không chặn, ngoại tuyến tự dùng phông hệ thống.
- `ocean.js`: thêm một dòng gọi `OC.fx` trong `sfx()` để phát hiệu ứng thị giác (không ảnh hưởng logic).

## Giảm nóng máy (v2.1)
- Giới hạn khung hình: mặc định 30 khung/giây (trước đây không giới hạn, thường 60), 15 khi đang mở bảng chức năng (hồ bị che), 60 khi chụp ảnh. Mô phỏng vẫn chạy đủ tốc độ (tiến trình, thu nhập, sinh sản không đổi).
- Cài đặt → Đồ họa → "Khung hình": Tiết kiệm (20) / Cân bằng (30) / Mượt (60).
- Nền hồ vẽ ở độ phân giải thấp hơn và làm mới thưa hơn; độ phân giải canvas tự động tối đa 1,5×.
- Bỏ làm mờ kính (backdrop-filter) trên các thành phần luôn hiện — rất tốn GPU khi nằm trên canvas chuyển động; bỏ hiệu ứng đập sáng lặp vô hạn trên nút.
- Giảm số quầng sáng cá hiếm và dòng bong bóng.

## Bộ icon hình ảnh (v2.2)
12 icon tách nền từ ảnh được cung cấp, nhúng sẵn ngay đầu `ocean_ui.js` (WebP 128px, dùng ngoại tuyến): Cá đang sở hữu, Cửa hàng, Bộ sưu tập, Lai tạo, Thuốc, Trang trí, Nhiệm vụ (thanh điều hướng), Thu xu (rương vàng), Thức ăn, Cài đặt, Nhật ký, Chụp ảnh. Nếu tệp icon không tải được, game tự dùng icon SVG cũ. Không cần thêm tệp mới nên workflow build APK cũ vẫn dùng được; `sw.js` cache v5.

## Icon thức ăn (v2.4)
9 icon thức ăn (cơ bản, tăng trưởng, màu sắc, hạnh phúc, cá con, sinh sản, quý hiếm, phát sáng, huyền thoại) nhúng trong `ocean_ui.js` (khóa `food_<id>`), dùng ở Cửa hàng → Thức ăn và thanh chọn thức ăn khi cho ăn. `sw.js` cache v6.

## Icon thuốc (v2.5)
23 icon thuốc (`pot_<mã>` trong `ocean_ui.js`) dùng ở Cửa hàng → Thuốc, Kho thuốc và hộp chọn thuốc cho cá. Thuốc đột biến hình thái (m3) lấy từ bộ ảnh thứ hai; còn lại từ bộ ảnh thứ nhất. `sw.js` cache v7.

## v2.6
- Cửa hàng → Thức ăn: cùng bố cục với bảng thuốc (icon tách nền, canh lề giống nhau).
- Giữ nút giá (Thức ăn, Thuốc) để mua liên tục, nhanh dần, tự dừng khi hết xu hoặc khi nhả tay/kéo cuộn. Chạm đơn vẫn mua 1 lần như cũ.
- Chạm nhanh 5 lần vào ô xu (góc trên bên trái) để mở bảng nhập số xu tùy ý (0 đến 1.000.000.000.000, có nút điền nhanh). Chạm 1 lần vẫn mở Ví (sau khoảng 0,4 giây). Hoạt động cả khi đang mở cửa hàng ở chế độ dọc.
- `sw.js` cache v8.

## v3.0 — Nhiều hồ, chọn nhiều cá, âm thanh
- **Cá của tôi**: nút "☑ Chọn nhiều" → tick từng cá / "Chọn tất cả" (theo bộ lọc) / "Bỏ chọn"; thanh hiển thị số cá đã chọn và tổng giá bán thực tế; "Bán đã chọn" (cá khóa được giữ lại) và "Chuyển hồ".
- **4 hồ** (nút 🏝️ trên thanh trên): Hồ Đại Dương (hồ gốc), Rạn San Hô, Rừng Tảo Biển, Vực Huỳnh Quang — mỗi hồ có nền, trang trí, cá, trứng riêng. Dữ liệu cũ tự nạp vào hồ 1. Hồ 2–4 đầy đủ cho ăn/thu xu/thuốc/lai tạo thủ công nhưng KHÔNG tự đẻ trứng.
- **Chuyển cá**: nút "Chuyển hồ" trong bảng thông tin cá và trong chế độ chọn nhiều; kiểm tra sức chứa (S.cap mỗi hồ), không mất/nhân đôi cá.
- **Công tắc sinh sản theo từng hồ** (Hồ cá → BẬT/TẮT). Hồ 2–4 khóa ở TẮT theo yêu cầu.
- **Âm thanh**: tự tạm dừng toàn bộ khi ẩn tab/khóa máy/thoát về màn hình chính (web + Capacitor `pause/appStateChange`), khôi phục theo cài đặt khi quay lại.
- Save vẫn là `spx_ocean_v1`, thêm trường `tk`, `tanks`, và `tk` trên từng cá/trứng (tương thích ngược). Service worker: `ocean-life-v9`.
