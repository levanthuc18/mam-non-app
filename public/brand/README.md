# Thư mục thương hiệu

| Tệp | Dùng ở | Ghi chú |
|---|---|---|
| `logo-full.png` | màn chào, đăng nhập, in phiếu | 420×283, nền trong suốt |
| `logo-mark.png` | đầu trang | 96×61, nền trong suốt |

- Thay logo: ghi đè tệp cùng tên (giữ tỉ lệ), không cần sửa mã. Nếu đổi tỉ lệ, sửa `RATIO` trong `src/Brand.jsx`.
- Màu thương hiệu (đo từ logo): xanh dương `#158FD4`, cam `#F7630F`, xanh lá `#8BBA30`. Chủ đề "Tuổi Thần Tiên" trong `src/theme.js` dùng bản đậm hơn của ba màu này cho chữ/nút để đạt tương phản 4,5:1.
- Bản một màu: dùng `<Logo tone="mono-light" />` (trắng, nền tối) hoặc `tone="mono-dark"` (đen).
