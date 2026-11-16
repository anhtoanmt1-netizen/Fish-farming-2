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
