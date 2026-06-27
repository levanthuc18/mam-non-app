// ============================================================================
// theme.js — Hạ tầng giao diện tập trung (1 file duy nhất để chỉnh sửa)
// Đổi màu / bo góc / bóng / style nút - thẻ - chip ở ĐÂY là cả app đổi theo.
// Lưu ý: file này KHÔNG chứa JSX (Vite không build JSX trong .js).
//        Component Emo (có JSX) nằm trong ui.jsx.
// ============================================================================

// 1) BẢNG MÀU — giữ đúng giá trị đang chạy, chỉ gom lại 1 chỗ.
export const C = {
  bg: "#F5F7F3",            // nền app (xanh kem nhạt, dịu mắt)
  card: "#FFFFFF",          // nền thẻ / vùng nhập liệu
  ink: "#1C3530",           // chữ chính
  sub: "#5C7068",           // chữ phụ
  pine: "#176B5B", pineSoft: "#E2F0EB",      // xanh thông chủ đạo
  coral: "#D14B32", coralSoft: "#FBEAE5",    // đỏ (chưa thu / cảnh báo)
  green: "#2E8F63", greenSoft: "#E4F3EA",    // xanh lá (đủ / ok)
  amber: "#A8731B", amberSoft: "#FBF1DC",    // hổ phách (thu thừa / chú ý)
  gray: "#8A938E", graySoft: "#EEF1EE", line: "#E3E8E2",
  blueA: "#2F6FBF", blueASoft: "#E7F0FB",    // AE / học thử
  violetB: "#8A56B8", violetBSoft: "#F2EAFA",// GV / ra trường
  gold: "#C99A2E", goldSoft: "#FBF1D8",
  orange: "#FF5722", orangeSoft: "#FFEDE6",  // cam nhấn (số tiền, tổng thu)
  // Hệ thống Grid 8px + bo góc
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, r: 16, r_kpi: 20,
};

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
