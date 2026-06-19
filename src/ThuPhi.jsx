import { useState, useRef, useMemo, useEffect } from "react";
import {
  C, font, fmt, soNgayHoc, ask, toast, uid, noDau,
  KHOAN
} from "./lib.js";
import {
  Card, NumInput, ABBtn, Badge, SearchBar, useStickyShrink, StickyBar, BottomSheet, PLBadge, LockNote
} from "./ui.jsx";

/* ============================================================
   TIỆN ÍCH
   ============================================================ */
const fmtK = (n) => {
  if (!n) return "0";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "tr";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "k";
  return n;
};

/* ============================================================
   1. PHỤ TRỢ
   ============================================================ */
function EmptyState({ search, onClear }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: C.sub }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{search ? "Không tìm thấy học sinh phù hợp" : "Không có học sinh trong bộ lọc này"}</div>
      <button onClick={onClear} style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Xóa bộ lọc</button>
    </div>
  );
}

export function NgayAnBar({ onApply, rows }) {
  const [v, setV] = useState(24);
  return (
    <Card style={{ marginBottom: 10, background: C.pineSoft, borderColor: "#BFE0D4", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.pine }}>🍽️ Số ngày ăn trong tháng:</span>
        <NumInput value={v} onChange={setV} w={62} />
        <span style={{ fontSize: 12.5, color: C.pine }}>ngày</span>
        <button onClick={() => onApply(v, rows.map((r) => r.hs.id))} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>Áp dụng cho {rows.length} HS đang hiển thị</button>
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>Tiền ăn = số ngày ăn × đơn giá. Chỉ áp cho HS đang lọc; HS đã sửa tay vẫn giữ riêng.</div>
    </Card>
  );
}

function LopFilterSheet({ open, onClose, chipsLop, lopFilter, setLopFilter, allRows }) {
  const [q, setQ] = useState("");
  const stats = useMemo(() => {
    const s = {};
    allRows.forEach((r) => {
      if (!r.coRec) return;
      const id = r.lopId || "none";
      if (!s[id]) s[id] = { count: 0, no: 0 };
      s[id].count++;
      s[id].no += Math.max(0, r.conNo);
    });
    return s;
  }, [allRows]);

  const totalNo = allRows.reduce((a, r) => a + (r.coRec ? Math.max(0, r.conNo) : 0), 0);
  const totalHS = allRows.filter((r) => r.coRec).length;
  const filtered = chipsLop.filter(([id, ten]) => { if (!q.trim()) return true; return noDau(ten).includes(noDau(q)); });

  return (
    <BottomSheet open={open} onClose={onClose} title="Chọn lớp học">
      <div>
        {filtered.map(([id, ten]) => {
          const active = lopFilter === id;
          const count = id === "all" ? totalHS : (stats[id]?.count || 0);
          const no = id === "all" ? totalNo : (stats[id]?.no || 0);
          return (
            <div key={id} onClick={() => { setLopFilter(id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color .2s" }}>
                {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink, transition: "color .2s" }}>{id === "all" ? "Tất cả lớp" : ten}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{count} học sinh · Nợ: {fmt(no)} đ</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (<div style={{ textAlign: "center", padding: 20, color: C.sub, fontSize: 13 }}>Không tìm thấy lớp</div>)}
      </div>
    </BottomSheet>
  );
}

/* ============================================================
   2. BOTTOM SHEET THU TIỀN — PHƯƠNG ÁN B (TĨNH, DISMISSIBLE)
   ============================================================ */
function ThuTienSheet({ r, open, onClose, setRec }) {
  const [amount, setAmount] = useState(() => r?.rec?.thucThu || 0);
  const [pt, setPt] = useState("tm");

  // ĐÃ SỬA: Đổi useMemo thành useEffect để tránh lỗi infinite re-render
  useEffect(() => {
    if (open && r) {
      setAmount(r.rec?.thucThu || 0);
    }
  }, [open, r?.hs?.id]);

  if (!open || !r) return null;

  const handleThuDu = () => setAmount(r.tongPhaiThu);
  const handleThuTron = () => setAmount(Math.floor(r.tongPhaiThu / 1000) * 1000);
  const handleConfirm = () => {
    setRec(r.hs.id, { thucThu: Number(amount) || 0 });
    onClose();
    toast("Đã xác nhận thu");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,.45)" }} />
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 28px", boxShadow: "0 -4px 24px rgba(0,0,0,.18)" }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink, marginBottom: 2 }}>{r.hs.ten}</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>{r.lop?.ten}</div>

        <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>Phải thu:</div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 28, color: C.coral, marginBottom: 16 }}>{fmt(r.tongPhaiThu)}đ</div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={handleThuDu} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thu đủ</button>
          <button onClick={handleThuTron} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thu tròn</button>
        </div>

        <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>Thực thu:</div>
        <input
          type="number" inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          style={{ width: "100%", padding: "14px 12px", borderRadius: 12, border: `1.5px solid
