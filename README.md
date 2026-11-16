# Ocean Life – trò chơi nuôi cá đại dương (Android APK + web)

Bản độc lập của Ocean Life. Build APK hoàn toàn trên GitHub (Actions), không cần cài Android Studio.

## Các tệp cần có (đặt TẤT CẢ ở thư mục gốc của repo, không bỏ vào thư mục con)
```
index.html  main.js  manifest.json  sw.js
ocean_data.js  ocean_art.js  ocean.js  ocean_ui.js
icon-192.png  icon-512.png  icon-maskable-512.png  icon-1024.png
package.json  capacitor.config.json  make_icons.py  .gitignore
.github/workflows/build-apk.yml      <- tệp duy nhất nằm trong thư mục con
```

## Các bước (làm được trên điện thoại)
1. Tạo repo mới trên GitHub (ví dụ `ocean-life`).
2. **Add file → Upload files**: chọn các tệp ở danh sách trên (trừ `.github/...`), rồi **Commit changes**.
3. Tạo tệp build: **Add file → Create new file**, ô tên gõ đúng `.github/workflows/build-apk.yml` (gõ dấu `/` thì GitHub tự tạo thư mục), dán nội dung tệp `build-apk.yml`, rồi **Commit changes**.
4. Vào tab **Actions**, chọn lần chạy "Build Ocean Life APK" (nếu chưa tự chạy: chọn workflow → **Run workflow**). Chờ khoảng 5–10 phút tới khi có dấu ✅.
5. Tải APK: ở trang chính của repo, mục **Releases** bên phải → bản mới nhất → tải `OceanLife.apk`. (Hoặc trong lần chạy Actions, mục Artifacts.)
6. Cài lên điện thoại: mở tệp APK, cho phép "Cài ứng dụng từ nguồn không xác định" khi được hỏi.

## Cập nhật game
Sửa tệp rồi Commit → Actions tự build APK mới và đăng lên Releases với số phiên bản tăng dần. Cài đè lên bản cũ, dữ liệu chơi vẫn được giữ.

## Chạy như web (tùy chọn)
Repo → **Settings → Pages** → Source: Deploy from a branch → `main` / root. Mở địa chỉ Pages, có thể "Thêm vào màn hình chính" như app.

## Nếu build lỗi
Vào Actions → bấm lần chạy đỏ → bước bị lỗi → sao chép đoạn log đỏ gửi lại để sửa.

## Ghi chú
- APK là bản debug để cài thử/chơi; muốn đăng Google Play cần tạo khóa ký phát hành.
- Dữ liệu chơi lưu trong ứng dụng; hãy dùng Cài đặt (⚙️) → Sao lưu định kỳ.
- Chi tiết thiết kế: `OCEAN_LIFE_DESIGN.md`; kiểm tra mã: `CODE_REVIEW.md`.
