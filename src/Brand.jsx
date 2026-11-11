// Brand.jsx — Logo + nhận diện thương hiệu Tuổi Thần Tiên
// Logo nằm ở public/brand/ (KHÔNG nhúng vào mã nữa): thay logo = thay tệp, không phải build lại mã.
//   logo-full.png : bản đầy đủ (biểu tượng + chữ), nền trong suốt — Splash, đăng nhập, in phiếu
//   logo-mark.png : chỉ biểu tượng, nền trong suốt — đầu trang
// Quy ước: <Logo mark w tone /> là NƠI DUY NHẤT hiện logo. tone: "color" (mặc định) | "mono-light" (một màu trắng, cho nền tối) | "mono-dark" (một màu đen, cho in một màu).
const BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
export const LOGO_FULL = `${BASE}brand/logo-full.png`;
export const LOGO_MARK = `${BASE}brand/logo-mark.png`;

// Tỉ lệ ảnh gốc (rộng x cao) để trình duyệt giữ chỗ trước khi ảnh tải xong (tránh nhảy bố cục).
const RATIO = { full: 283 / 420, mark: 61 / 96 };
const TONE = { color: undefined, "mono-light": "brightness(0) invert(1)", "mono-dark": "brightness(0)" };

// <Logo mark w={...} tone="mono-light" /> — mark=true dùng biểu tượng, mặc định dùng bản đầy đủ
export function Logo({ mark = false, w = 160, tone = "color", style }) {
  return (
    <img
      src={mark ? LOGO_MARK : LOGO_FULL}
      alt="Tuổi Thần Tiên"
      width={w}
      height={Math.round(w * (mark ? RATIO.mark : RATIO.full))}
      decoding="async"
      style={{ width: w, height: "auto", objectFit: "contain", display: "block", filter: TONE[tone], ...style }}
    />
  );
}

// Linh vật theo tên lớp (hình tự vẽ, trang trí: luôn kèm tên lớp bằng chữ). Tệp: public/brand/animals.svg (symbol id "an-…").
// Thêm lớp mới: thêm một dòng vào ANIMAL_BY_NAME (khoá = tên lớp viết thường, bỏ dấu, bỏ khoảng trắng). Lớp chưa có hình dùng hình xoay vòng theo thứ tự.
const ANIMAL_BY_NAME = { socnhi: "soc", sonca: "sonca", hoami: "hoami", chichbong: "chich", mickey: "mickey", thobong: "tho" };
const ANIMALS = ["soc", "sonca", "hoami", "chich", "mickey", "tho"];
const keyOf = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]/g, "");
export function ClassAnimal({ name, index = 0, size = 24, style }) {
  const id = ANIMAL_BY_NAME[keyOf(name)] || ANIMALS[Math.abs(index) % ANIMALS.length];
  return (
    <svg width={size} height={size} aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      <use href={`${BASE}brand/animals.svg#an-${id}`} />
    </svg>
  );
}
