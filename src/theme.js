// ============================================================================
// theme.js — Hạ tầng giao diện tập trung (1 file duy nhất để chỉnh sửa)
// Đổi màu / bo góc / bóng / style nút - thẻ - chip ở ĐÂY là cả app đổi theo.
// Lưu ý: file này KHÔNG chứa JSX (Vite không build JSX trong .js).
//        Component Emo (có JSX) nằm trong ui.jsx.
// ============================================================================

// 1) BẢNG MÀU theo CHỦ ĐỀ (theme). Đổi theme = đổi CSS var = cả app đổi.
//    Các khoá màu dưới đây sẽ thành biến CSS (--c-...). Số đo (xs..r_kpi) giữ nguyên.
const COLOR_KEYS = [
  "bg", "card", "ink", "sub", "pine", "pineSoft", "coral", "coralSoft",
  "green", "greenSoft", "amber", "amberSoft", "gray", "graySoft", "line",
  "blueA", "blueASoft", "violetB", "violetBSoft", "gold", "goldSoft",
  "orange", "orangeSoft",
];

// Bộ màu nhấn dùng chung cho các theme SÁNG (giữ đúng giá trị đang chạy)
const ACCENTS = {
  ink: "#1C3530", sub: "#5C7068",
  pine: "#176B5B", pineSoft: "#E2F0EB",
  coral: "#D14B32", coralSoft: "#FBEAE5",
  green: "#2E8F63", greenSoft: "#E4F3EA",
  amber: "#A8731B", amberSoft: "#FBF1DC",
  gray: "#8A938E",
  blueA: "#2F6FBF", blueASoft: "#E7F0FB",
  violetB: "#8A56B8", violetBSoft: "#F2EAFA",
  gold: "#C99A2E", goldSoft: "#FBF1D8",
  orange: "#FF5722", orangeSoft: "#FFEDE6",
};

export const PALETTES = {
  // Xanh khói = giao diện đang chạy (mặc định)
  xanhkhoi: { ...ACCENTS, bg: "#F5F7F3", card: "#FFFFFF", graySoft: "#EEF1EE", line: "#E3E8E2" },
  // Trắng sữa = trắng sạch
  trangsua: { ...ACCENTS, bg: "#FAFAF8", card: "#FFFFFF", graySoft: "#F1F2F0", line: "#EBECEA" },
  // Kem ấm = be ấm
  kemam:    { ...ACCENTS, bg: "#F7F2E9", card: "#FFFDF8", graySoft: "#F0EADC", line: "#E9E1D0", pineSoft: "#E8F0E6" },
  // Xám nhẹ = trung tính
  xamnhe:   { ...ACCENTS, bg: "#F1F2F4", card: "#FFFFFF", graySoft: "#E9EBEE", line: "#E1E4E8" },
  // Đêm = tối (nền đậm, chữ sáng, màu nhấn sáng hơn cho dễ đọc)
  dem: {
    bg: "#0F1A17", card: "#18261F", ink: "#E8F0ED", sub: "#9DB2AA",
    pine: "#5FC4AC", pineSoft: "#1E3A33",
    coral: "#F2795E", coralSoft: "#3A2420",
    green: "#54B985", greenSoft: "#1C3328",
    amber: "#D9A94A", amberSoft: "#332914",
    gray: "#8A938E", graySoft: "#222E28", line: "#2B3B34",
    blueA: "#5B9BE0", blueASoft: "#1A2A3D",
    violetB: "#B584DC", violetBSoft: "#2A1F38",
    gold: "#D9B45E", goldSoft: "#332B14",
    orange: "#FF7A4D", orangeSoft: "#3A2218",
  },
};

export const THEMES = [
  { id: "trangsua", label: "Trắng sữa" },
  { id: "xanhkhoi", label: "Xanh khói" },
  { id: "kemam", label: "Kem ấm" },
  { id: "xamnhe", label: "Xám nhẹ" },
  { id: "dem", label: "Đêm" },
];
export const DEFAULT_THEME = "xanhkhoi";

// C: khoá màu trỏ tới biến CSS; số đo giữ nguyên giá trị.
export const C = {
  ...Object.fromEntries(COLOR_KEYS.map((k) => [k, `var(--c-${k})`])),
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, r: 16, r_kpi: 20,
};

// Ghi 1 bộ màu lên :root (đổi cả app, không cần render lại React).
export function applyTheme(id) {
  const p = PALETTES[id] || PALETTES[DEFAULT_THEME];
  const def = PALETTES[DEFAULT_THEME];
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  COLOR_KEYS.forEach((k) => root.style.setProperty(`--c-${k}`, p[k] || def[k]));
  root.style.setProperty("color-scheme", id === "dem" ? "dark" : "light");
  try { root.style.background = (p.bg || def.bg); } catch {}
}
export function setTheme(id) {
  applyTheme(id);
  try { localStorage.setItem("mn5:theme", id); } catch {}
}
export function getTheme() {
  try { return localStorage.getItem("mn5:theme") || DEFAULT_THEME; } catch { return DEFAULT_THEME; }
}

// Áp ngay khi nạp (đọc nhanh từ localStorage để tránh nháy màu lúc mở app).
applyTheme(getTheme());

// Bộ biến CSS ép nền SÁNG — dùng cho phiếu in/chia sẻ (luôn sáng dù app đang ở Đêm).
export const LIGHT_VARS = Object.fromEntries(
  COLOR_KEYS.map((k) => [`--c-${k}`, PALETTES[DEFAULT_THEME][k]])
);

// 2) FONT
export const font = {
  display: "'Baloo 2', system-ui, sans-serif",
  body: "'Be Vietnam Pro', system-ui, sans-serif",
};

// 3) BO GÓC chuẩn (dùng tên có nghĩa, để áp nhất quán mọi tab)
export const R = {
  card: 20,     // thẻ KPI / danh sách lớp / tile
  panel: 16,    // panel phụ
  button: 12,   // nút bấm / ô nhập / ô tìm kiếm
  chip: 12,     // chip lọc
  pill: 9999,   // pill toggle tròn
};

// 4) BÓNG ĐỔ chuẩn (tone xanh, cực nhẹ — phẳng nhưng có chiều sâu)
export const SH = {
  subtle: "0 2px 8px rgba(23,107,91,.05)",
  card: "0 2px 10px rgba(20,60,48,.05)",
  sheet: "0 -4px 24px rgba(0,0,0,.12)",
};

// 5) BỘ STYLE DÙNG CHUNG — triệt tiêu inline style rác, sửa 1 chỗ ăn cả app.
//    Dùng: style={{ ...S.btnPrimary }} hoặc trộn thêm: style={{ ...S.card, marginBottom: 12 }}
export const S = {
  // Thẻ phẳng (danh sách lớp, card học sinh, KPI)
  card: {
    background: C.card,
    borderRadius: R.card,
    padding: 16,
    boxShadow: SH.card,
    border: `1px solid ${C.line}`,
  },

  // Nút hành động chính (In N phiếu, Xác nhận thu, Lưu...)
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: C.pine,
    color: "#fff",
    border: "none",
    borderRadius: R.button,
    padding: "13px 20px",
    fontFamily: font.display,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "filter .15s, transform .1s",
  },

  // Nút nhấn cam (số tiền / hành động thu)
  btnAccent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: C.orange,
    color: "#fff",
    border: "none",
    borderRadius: R.button,
    padding: "13px 20px",
    fontFamily: font.display,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "filter .15s, transform .1s",
  },

  // Nút phụ viền (xem lẻ, quay lại, bộ lọc...)
  btnGhost: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: C.card,
    color: C.pine,
    border: `1.5px solid ${C.pine}`,
    borderRadius: R.button,
    padding: "9px 16px",
    fontFamily: font.body,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "filter .15s, transform .1s",
  },

  // Nút trung tính (huỷ, đóng nhẹ)
  btnNeutral: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: C.card,
    color: C.ink,
    border: `1.5px solid ${C.line}`,
    borderRadius: R.button,
    padding: "9px 16px",
    fontFamily: font.body,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "filter .15s, transform .1s",
  },

  // Chip lọc / dropdown trigger (mobile)
  chip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    background: C.card,
    color: C.ink,
    border: `1.5px solid ${C.line}`,
    borderRadius: R.chip,
    padding: "11px 12px",
    fontFamily: font.body,
    fontSize: 13,
    cursor: "pointer",
    minWidth: 0,
    userSelect: "none",
    WebkitUserSelect: "none",
  },

  // Trạng thái đang chọn của chip lọc (trộn: { ...S.chip, ...S.chipActive })
  chipActive: {
    background: C.pine,
    color: "#fff",
    border: `1.5px solid ${C.pine}`,
  },

  // Thanh hành động dính chặt dưới đáy (cụm In N phiếu, Thao tác hàng loạt...)
  stickyBottom: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: C.card,
    boxShadow: SH.sheet,
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    zIndex: 99,
  },

  // Ô vuông bo tròn chứa icon (kiểu tile ở Home)
  iconChip: (tint) => ({
    width: 44,
    height: 44,
    borderRadius: 13,
    background: tint || C.pineSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
};
