# Kiểm tra mã Ocean Life – những gì đã rà soát và sửa

## Lỗi đã tìm thấy và sửa
1. **Trùng tên trường `sp`**: mã loài và tốc độ bơi cùng dùng `sp`, làm cá mất loài sau khi lưu/tải và hỏng phả hệ. Đã đổi tốc độ bơi thành `spd`.
2. **Nhiệm vụ hằng ngày nhận lại được vào ngày hôm sau**: cờ "hoàn thành" không bị xóa khi sang ngày. Đã thêm `rollDay()` (chạy khi tải, khi có sự kiện và mỗi 5 giây).
3. **Nhập dữ liệu sao lưu bị ghi đè**: khi tải lại trang, hàm lưu tự động ghi đè dữ liệu vừa nhập. Đã thêm cờ `noSave` cho nhập/đặt lại.
4. **Không có tiến trình khi ẩn app hoặc rời game**: chỉ tính khi mở lại từ đầu. Nay tính bù khi quay lại app (hoặc vào lại game) sau hơn 45 giây, tối đa 24 giờ, và hiện báo cáo.
5. **Bóng đen loài chưa khám phá phụ thuộc `ctx.filter`** (iOS Safari không hỗ trợ, sẽ lộ màu). Đổi sang ghép `source-in`.
6. **Bộ nhớ ảnh thu nhỏ tăng vô hạn** khi gen thay đổi. Đã giới hạn 500 mục.
7. **Danh sách cá vẽ lại mỗi giây làm đóng hộp chọn (select)**. Nay vẽ lại mỗi 3 giây và bỏ qua khi đang chọn.
8. **"Thu nhập phiên này" bị lưu lâu dài**. Nay chỉ tính trong phiên hiện tại.
9. **Tọa độ chạm phụ thuộc app SPX**. Nay có phương án dự phòng khi chạy độc lập.
10. Dọn các đoạn mã thừa (khám phá loài mới dùng điều kiện tạm, mở thừa bảng thuốc, biến không dùng).

## Đã kiểm thử tự động (trình duyệt Chromium giả lập điện thoại)
Chạy độc lập không lỗi JavaScript; chạm chọn cá; nút Back đóng từng lớp; đổi ngày đặt lại nhiệm vụ; tính bù khi quay lại app (3 giờ); nhập sao lưu không bị ghi đè; manifest và icon hợp lệ; script thay icon Android chạy đúng trên cấu trúc giả lập. Trước đó: mua/bán, sinh sản, nở trứng, lai khác loài, thuốc, đột biến, lưu/tải, ngoại tuyến 5 giờ, bố cục dọc/ngang, 120 cá đạt 33 fps trên trình duyệt không GPU.

## Chưa kiểm thử được (cần bạn xác nhận)
- **Quá trình build APK trên GitHub Actions**: môi trường của tôi không có mạng nên không chạy được Capacitor/Gradle. Cấu hình theo mẫu chuẩn của Capacitor 6 (Node 20, Java 17); nếu lần build đầu báo lỗi, gửi tôi đoạn log đỏ để sửa.
- Chạy thực tế trên điện thoại Android (hiệu năng, âm thanh, nút Back).

## Hạn chế đã biết
- APK là bản **debug** (cài trực tiếp được; chưa ký phát hành nên chưa dùng để lên Google Play).
- Giao diện chỉ có tiếng Việt; phông chữ dùng phông hệ thống của máy.
- Dữ liệu lưu trong bộ nhớ ứng dụng; gỡ ứng dụng sẽ mất, nên dùng Cài đặt → Sao lưu.
- Chưa có: nhiều hồ, đồng bộ đám mây, 3D thật (xem OCEAN_LIFE_DESIGN.md).
