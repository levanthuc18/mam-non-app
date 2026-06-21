import { useState, useRef, useMemo, useEffect } from "react";
import {
  C, font, fmt, soNgayHoc, ask, toast, uid, noDau,
  KHOAN
} from "./lib.js";
import {
  Card, NumInput, ABBtn, Badge, SearchBar, useStickyShrink, StickyBar, BottomSheet, PLBadge, LockNote, Avatar
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
   2. BOTTOM SHEET THU TIỀN
   ============================================================ */
function ThuTienSheet({ r, open, onClose, setRec }) {
  const [amount, setAmount] = useState(0);
  const [pt, setPt] = useState("tm");

  useEffect(() => {
    if (open) {
      setAmount(r?.rec?.thucThu || 0);
      setPt("tm");
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
    <BottomSheet open={true} onClose={onClose} title={`💰 THU TIỀN — ${r.hs.ten.toUpperCase()}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: C.md }}>

        {/* Thông tin HS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: C.sm, borderBottom: `1px solid ${C.line}` }}>
          <Avatar hs={r.hs} size={40} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{r.hs.ten}</div>
            <div style={{ fontSize: 13, color: C.sub }}>{r.lop?.ten}</div>
          </div>
        </div>

        {/* Phải thu */}
        <div style={{ background: C.coralSoft, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 2 }}>Phải thu</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 26, color: C.coral }}>{fmt(r.tongPhaiThu)}đ</div>
        </div>

        {/* Nút nhanh */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleThuDu} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thu đủ</button>
          <button onClick={handleThuTron} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thu tròn</button>
        </div>

        {/* Nhập thực thu */}
        <div>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>Thực thu</div>
          <input
            type="number" inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            style={{
              width: "100%", padding: "14px 12px", borderRadius: 12,
              border: `1.5px solid ${C.pine}`, fontSize: 18,
              fontFamily: font.display, fontWeight: 700, color: C.ink,
              textAlign: "right", outline: "none"
            }}
          />
        </div>

        {/* Phương thức */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "tm", label: "💵 Tiền mặt" },
            { key: "ck", label: "🏦 Chuyển khoản" }
          ].map(({ key, label }) => (
            <label key={key} onClick={() => setPt(key)} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", borderRadius: 10,
              border: `1.5px solid ${pt === key ? C.pine : C.line}`,
              background: pt === key ? C.pineSoft : C.card,
              cursor: "pointer", fontWeight: 600, fontSize: 13, color: C.ink
            }}>
              <input type="radio" checked={pt === key} onChange={() => setPt(key)} style={{ accentColor: C.pine }} />
              {label}
            </label>
          ))}
        </div>

        {/* Xác nhận */}
        <button onClick={handleConfirm} style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
          border: "none", background: C.amber, color: "#fff",
          fontWeight: 800, fontSize: 16, cursor: "pointer"
        }}>XÁC NHẬN THU</button>
      </div>
    </BottomSheet>
  );
}
/* ============================================================
   3. QUICK EDIT SHEET
   ============================================================ */
function QuickEditSheet({ sid, rows, onClose, setKhoan, resetKhoan, setRec, addPhuThuHS, delPhuThuHS }) {
  const r = rows.find(x => x.hs.id === sid);
  const [ptTen, setPtTen] = useState("");
  const [ptSo, setPtSo] = useState("");
  const [localKhoan, setLocalKhoan] = useState({});
  const [localNgayAn, setLocalNgayAn] = useState(0);
  const [localPhuThu, setLocalPhuThu] = useState([]);

  useEffect(() => {
    if (!r) return;
    const init = {};
    KHOAN.forEach(k => {
      if (k.key !== "tienAn") {
        init[k.key] = r?.rec?.khoan?.[k.key] ?? 0;
      }
    });
    setLocalKhoan(init);
    setLocalNgayAn(r?.rec?.ngayAn ?? 0);
    setLocalPhuThu(r?.rec?.phuThu ?? []);
    setPtTen("");
    setPtSo("");
  }, [sid]);

  const giaAn = r?.rec?.khoanDefault?.giaAn ?? r?.lop?.tienAn ?? 0;

  const tongTamTinh = useMemo(() => {
    if (!r) return 0;
    let tong = 0;
    KHOAN.forEach(k => {
      if (k.key === "tienAn") tong += giaAn * localNgayAn;
      else tong += localKhoan?.[k.key] ?? 0;
    });
    tong += localPhuThu.reduce((a, p) => a + (p.soTien ?? 0), 0);
    tong += r.noTruoc ?? 0;
    return tong;
  }, [localKhoan, localNgayAn, localPhuThu, r, giaAn]);

  if (!r) return null;

  const handleKhoanChange = (key, v) => {
    setLocalKhoan(prev => ({ ...prev, [key]: v }));
    setKhoan(sid, key, v);
  };
  const handleNgayAnChange = (v) => { setLocalNgayAn(v); setRec(sid, { ngayAn: v, ngayAnManual: true }); };
  const handleResetKhoan = (key) => { const def = r.rec.khoanDefault?.[key] ?? 0; setLocalKhoan(prev => ({ ...prev, [key]: def })); resetKhoan(sid, key); };
  const handleResetNgayAn = () => { setLocalNgayAn(r.rec.ngayAnDefault ?? 0); setRec(sid, { ngayAnManual: false }); };
  const addPT = () => { if (!ptTen.trim() || !ptSo) return; const newPT = { id: uid(), ten: ptTen.trim(), soTien: Number(ptSo) }; setLocalPhuThu(prev => [...prev, newPT]); addPhuThuHS(sid, ptTen.trim(), Number(ptSo)); setPtTen(""); setPtSo(""); };
  const delPT = (id) => { setLocalPhuThu(prev => prev.filter(p => p.id !== id)); delPhuThuHS(sid, id); };

  return (
    <BottomSheet open={true} onClose={onClose} title={`⚙️ SỬA KHOẢN THU — ${r.hs.ten.toUpperCase()}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: C.md }}>
        {KHOAN.map(k => {
          const isNgayAn = k.key === "tienAn";
          const val = isNgayAn ? localNgayAn : (localKhoan?.[k.key] ?? 0);
          const def = isNgayAn ? (r.rec.ngayAnDefault ?? 0) : (r.rec.khoanDefault?.[k.key] ?? 0);
          const isEdited = val !== def;

          if (def === 0 && val === 0 && !isEdited) return null;

          return (
            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: C.sm }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: isEdited ? C.amber : C.ink }}>
                  {k.label}{isEdited && <span style={{ fontSize: 11, color: C.amber, marginLeft: 4, fontWeight: 700 }}> · đã sửa</span>}
                </div>
                {isEdited && !isNgayAn && (
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Mặc định: {fmt(def)}</div>
                )}
                {isEdited && isNgayAn && (
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                    Giá: {fmt(giaAn)} đ/ngày · Tự tính: {soNgayHoc(new Date().getFullYear(), new Date().getMonth() + 1, {})} ngày
                  </div>
                )}
              </div>

              {isNgayAn ? (
                <div style={{ position: "relative", width: 120, flexShrink: 0 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={val}
                    onChange={(e) => handleNgayAnChange(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 38px 8px 10px",
                      borderRadius: 10,
                      border: `1.5px solid ${isEdited ? C.amber : C.line}`,
                      fontSize: 15,
                      fontFamily: font.display,
                      fontWeight: 700,
                      color: C.ink,
                      textAlign: "right",
                      outline: "none",
                      background: "#fff"
                    }}
                  />
                  <span style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    color: C.sub,
                    pointerEvents: "none",
                    fontWeight: 600
                  }}>ngày</span>
                </div>
              ) : (
                <NumInput value={val} onChange={(v) => handleKhoanChange(k.key, v)} w={120} />
              )}

              {isEdited && (
                <button
                  onClick={() => isNgayAn ? handleResetNgayAn() : handleResetKhoan(k.key)}
                  style={{ border: `1px solid ${C.line}`, background: C.card, borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: C.sub, fontSize: 16, flexShrink: 0 }}
                >
                  ↺
                </button>
              )}
            </div>
          );
        })}

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: C.md }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: C.sm }}>Khoản riêng</div>
          {localPhuThu.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
              <span style={{ flex: 1, color: C.ink }}>{p.ten}</span>
              <span style={{ fontWeight: 600 }}>{fmt(p.soTien)}</span>
              <button onClick={() => delPT(p.id)} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <input value={ptTen} onChange={(e) => setPtTen(e.target.value)} placeholder="Tên khoản" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
            <input type="number" value={ptSo} onChange={(e) => setPtSo(e.target.value)} placeholder="Số tiền" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
            <button onClick={addPT} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Thêm</button>
          </div>
        </div>

        <div style={{ marginTop: C.md, paddingTop: C.md, borderTop: `2px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Tổng tạm tính:</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.coral }}>{fmt(tongTamTinh)}đ</span>
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: C.sm }}>✓ LƯU THAY ĐỔI</button>
      </div>
    </BottomSheet>
  );
}

/* ============================================================
   /* ============================================================
   4. THẺ HỌC SINH V1 (Cập nhật V1.2 theo UI/UX Guide)
   ============================================================ */
function HSCardV1({ r, locked, onThuTien, onQuickEdit, onViewPhieu, setRec, expandId, setExpandId }) {
  const isExpanded = expandId === r.hs.id;
  const thucThu = r.rec.thucThu || 0;
  const tongPhaiThu = r.tongPhaiThu;

  const isChuaThu = thucThu === 0 && tongPhaiThu > 0;
  const isThieu = thucThu > 0 && r.conNo > 0;
  const isDu = r.conNo === 0 && tongPhaiThu > 0 && thucThu >= tongPhaiThu;
  const isThua = r.conNo < 0;

  let statusColor = C.coral, statusText = "CHƯA THU", statusIcon = "🔴";
  if (isThieu) { statusColor = C.amber; statusText = "THU THIẾU"; statusIcon = "🟡"; }
  else if (isDu) { statusColor = C.green; statusText = "THU ĐỦ"; statusIcon = "🟢"; }
  else if (isThua) { statusColor = "#2563EB"; statusText = "THU THỪA"; statusIcon = "🔵"; }

  const borderLeftColor = isChuaThu || isThieu ? C.coral : isThua ? "#2563EB" : C.green;

  const dong = r.ps?.dong || [];
  const hocPhi = r.rec?.khoan?.hocPhi || 0;
  const tienAn = r.rec?.khoan?.tienAn || 0;

  const currentMonth = new Date().getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const truAnLabel = `Trừ ăn T${prevMonth}`;

  const isTruAn = (d) => (d[0].includes("Trừ") || d[0].includes("trừ")) && d[1] < 0;
  const truAnItems = dong.filter(isTruAn).map(d => [truAnLabel, d[1]]);
  const displayDong = dong.map(d => isTruAn(d) ? [truAnLabel, d[1], d[2]] : d);

  const phuThu = dong.filter(d => 
    !d[0].includes("Học phí") && 
    !d[0].includes("Tiền ăn") && 
    d[1] > 0 &&
    !isTruAn(d)
  ).reduce((a, b) => a + b[1], 0);

      const noCu = r.noTruoc || 0;
  const hasEdited = useMemo(() => {
    if (!r?.rec) return false;
    for (const k of KHOAN) {
      if (k.key === "tienAn") continue; // ⬅️ BỎ QUA tiền ăn
      const val = r.rec?.khoan?.[k.key] ?? 0;
      const def = r.rec?.khoanDefault?.[k.key] ?? 0;
      if (val !== def) return true;
    }
    return false;
  }, [r]);

  // Style cho các nút bấm (có chứa chữ ở dưới)
  const btnStyle = (bg, color, isBorder) => ({
    width: 42, // Rộng hơn để chứa chữ "Phiếu"
    padding: "4px 2px", 
    borderRadius: 8,
    border: isBorder ? `1px solid ${C.line}` : "none",
    background: bg, 
    color: color, 
    cursor: "pointer", 
    flexShrink: 0,
    display: "flex", 
    flexDirection: "column", // Icon trên, chữ dưới
    alignItems: "center", 
    justifyContent: "center",
    gap: 2
  });

  // Style chung cho Chip tiền
  const chipStyle = {
    fontSize: 10, 
    fontWeight: 600, 
    background: "#F3F4F6", 
    color: C.sub, 
    padding: "4px 8px", 
    borderRadius: 6, 
    flexShrink: 0,
    display: "inline-block",
    whiteSpace: "nowrap"
  };

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderLeft: `5px solid ${borderLeftColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* HÀNG 1: HEADER (Avatar + Tên | Lớp + Tag) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1, paddingRight: 8 }}>
          <div style={{ marginRight: 8, flexShrink: 0 }}>
            <Avatar hs={r.hs} size={36} />
          </div>
          <span style={{ 
            fontSize: 15, fontWeight: 700, color: "#111827", 
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", 
            maxWidth: "75%" 
          }}>
            {r.hs.ten}
          </span>
        </div>
        
        <div style={{ 
          fontSize: 12.5, color: "#6B7280", fontWeight: 400, flexShrink: 0, 
          display: "flex", alignItems: "center", gap: 4 
        }}>
          <span>{r.lop?.ten}</span>
          <span style={{ color: "#D1D5DB" }}>•</span>
          <PLBadge pl={r.hs.pl} />
        </div>
      </div>

      {/* HÀNG CẢNH BÁO NGHIỆP VỤ (Nợ cũ lớn / Miễn giảm) */}
      {hasEdited && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ 
            fontSize: 10, fontWeight: 700, color: "#D97706", 
            background: "#FEF3C7", border: `1px solid #FDE68A`, 
            padding: "1px 6px", borderRadius: 6 
          }}>
            ⚠ Đã sửa tay
          </span>
        </div>
      )}

      {/* HÀNG 2: CHIP TIỀN (Vuốt ngang) */}
      <div style={{ 
        display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: 3, 
        marginBottom: 8, scrollbarWidth: "none", 
        "-webkit-overflow-scrolling": "touch", 
        "&::-webkit-scrollbar": { display: "none" } 
      }}>
        <span style={chipStyle}>HP {fmtK(hocPhi)}</span>
        <span style={chipStyle}>Ăn {fmtK(tienAn)}</span>
        
        {phuThu > 0 && (
          <span style={chipStyle}>PT {fmtK(phuThu)}</span>
        )}
        
        {truAnItems.map(([label, val], i) => (
          <span key={i} style={{ 
            ...chipStyle, 
            background: C.coralSoft, color: C.coral 
          }}>
            {label} {fmtK(Math.abs(val))}
          </span>
        ))}
        
        {noCu !== 0 && (
          <span style={{ 
            ...chipStyle,
            background: noCu > 0 ? C.coralSoft : C.greenSoft,
            color: noCu > 0 ? C.coral : C.green
          }}>
            {noCu > 0 ? `Nợ ${fmtK(noCu)}` : `Dư ${fmtK(-noCu)}`}
          </span>
        )}
      </div>

      {/* HÀNG 3: TRẠNG THÁI & NÚT HÀNH ĐỘNG */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  
  {/* BÊN TRÁI: Trạng thái + số tiền */}
  <div style={{ minWidth: 0, paddingRight: 8 }}>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: statusColor }}>
      {statusIcon} {statusText}
    </div>
    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", marginTop: 2 }}>
      {isChuaThu ? `• Phải thu: ${fmt(tongPhaiThu)}đ` :
       isThieu ? `• Còn thiếu: ${fmt(r.conNo)}đ` :
       isThua ? `• Dư: ${fmt(-r.conNo)}đ` : "• Đã thu đủ"}
    </div>
    {isThieu && <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Đã thu: {fmt(thucThu)}đ</div>}
  </div>

  {/* BÊN PHẢI: Cụm 4 nút bấm */}
  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
    {!locked ? (
      <button onClick={() => onThuTien(r)} style={{
        width: 36, padding: "3px 2px", borderRadius: 6, border: "none",
        background: C.amber, color: "#fff", cursor: "pointer", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>💰</span>
        <span style={{ fontSize: 9, fontWeight: 700 }}>Thu</span>
      </button>
    ) : (
      <button disabled style={{
        width: 36, padding: "3px 2px", borderRadius: 6, border: "none",
        background: C.line, color: C.sub, opacity: 0.5, cursor: "default", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>💰</span>
        <span style={{ fontSize: 9, fontWeight: 700 }}>Thu</span>
      </button>
    )}

    <button onClick={() => onViewPhieu(r)} style={{
      width: 36, padding: "3px 2px", borderRadius: 6, border: "none",
      background: "#DBEAFE", color: "#2563EB", cursor: "pointer", flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>📄</span>
      <span style={{ fontSize: 9, fontWeight: 700 }}>Phiếu</span>
    </button>

    {!locked ? (
      <button onClick={() => onQuickEdit(r)} style={{
        width: 36, padding: "3px 2px", borderRadius: 6, border: `1px solid ${C.line}`,
        background: "#FFF9EE", color: C.amber, cursor: "pointer", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>✏️</span>
        <span style={{ fontSize: 9, fontWeight: 700 }}>Sửa</span>
      </button>
    ) : (
      <button disabled style={{
        width: 36, padding: "3px 2px", borderRadius: 6, border: `1px solid ${C.line}`,
        background: C.card, color: C.sub, opacity: 0.5, cursor: "default", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>✏️</span>
        <span style={{ fontSize: 9, fontWeight: 700 }}>Sửa</span>
      </button>
    )}

    <button 
      onClick={() => setExpandId(isExpanded ? null : r.hs.id)} 
      style={{
        width: 36, padding: "3px 2px", borderRadius: 6, border: `1px solid ${C.line}`,
        background: C.card, color: C.sub, cursor: "pointer", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
        transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>▼</span>
      <span style={{ fontSize: 9, fontWeight: 700 }}>Xem</span>
    </button>
  </div>

</div>

      {/* KHỐI CHI TIẾT RỘNG RÃNG KHI BẮM XEM */}
      {isExpanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.line}` }}>
          {displayDong.map(([label, val, sua], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: val < 0 ? C.green : C.ink }}>
              <span style={{ color: C.sub }}>{label}{sua && <span style={{ color: C.amber }}> ⚠</span>}</span>
              <span>{fmt(val)}</span>
            </div>
          ))}
          {r.noTruoc !== 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: r.noTruoc > 0 ? C.coral : C.green }}>
              <span style={{ color: C.sub }}>{r.noTruoc > 0 ? "Nợ cũ" : "Dư cũ"}</span>
              <span>{r.noTruoc > 0 ? fmt(r.noTruoc) : fmt(r.noTruoc)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTop: `1.5px solid ${C.line}`, fontWeight: 800, fontSize: 14, color: C.coral }}>
            <span>TỔNG CỘNG HÓA ĐƠN</span>
            <span>{fmt(tongPhaiThu)}đ</span>
          </div>
        </div>
      )}
    </div>
  );
}
/* ============================================================
   5. THU NGOÀI & KHOẢN THU LỚP (Cải tiến: Thu đủ & Cố định)
   ============================================================ */
function ThuNgoaiItem({ k, locked, set, del }) {
  const conNo = k.soTien - k.thucThu;
  const isChuaThu = k.thucThu === 0 && k.soTien > 0;
  const isThieu = k.thucThu > 0 && conNo > 0;
  const isDu = conNo <= 0 && k.soTien > 0;

  let statusColor = C.coral, statusText = "CHƯA THU", statusIcon = "🔴";
  if (isThieu) { statusColor = C.amber; statusText = "THU THIẾU"; statusIcon = "🟡"; }
  else if (isDu) { statusColor = C.green; statusText = "ĐÃ THU ĐỦ"; statusIcon = "🟢"; }

  const borderLeftColor = isChuaThu || isThieu ? C.coral : C.green;

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: C.r,
      padding: "10px 14px",
      marginBottom: 10,
      borderLeft: `5px solid ${borderLeftColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.ten}</span>
            {k.coDinh && <span style={{ fontSize: 10, fontWeight: 700, color: C.blueA, background: C.blueASoft, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>🔁 Cố định</span>}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>Phải thu: {fmt(k.soTien)}đ</div>
        </div>
        {!locked && (
          <button onClick={() => del(k.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4, fontSize: 16, flexShrink: 0 }}>🗑</button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: statusColor }}>{statusIcon} {statusText}</div>
          {isThieu && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Còn thiếu: {fmt(conNo)}đ</div>}
        </div>
        
        {!locked ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <ABBtn val={k.nguoiThu} set={(p) => set(k.id, { nguoiThu: p })} small disabled={locked} />
            <NumInput value={k.thucThu} onChange={(v) => set(k.id, { thucThu: v })} w={100} disabled={locked} />
            <button 
              onClick={() => set(k.id, { thucThu: k.soTien })} 
              style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Thu đủ"
            >✓</button>
          </div>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fmt(k.thucThu)}đ</div>
        )}
      </div>
    </div>
  );
}

function ThuNgoai({ mData, upMData, locked }) {
  const tn = mData.thuNgoai || [];
  const [ten, setTen] = useState(""); 
  const [so, setSo] = useState("");
  const [coDinh, setCoDinh] = useState(false); // State cho khoản cố định

  const add = () => { 
    if (!ten.trim()) return; 
    upMData({ 
      ...mData, 
      thuNgoai: [...tn, { id: uid(), ten: ten.trim(), soTien: Number(so) || 0, thucThu: 0, nguoiThu: "A", coDinh }] 
    }); 
    setTen(""); 
    setSo(""); 
    setCoDinh(false);
  };
  
  const set = (id, p) => upMData({ ...mData, thuNgoai: tn.map((k) => (k.id === id ? { ...k, ...p } : k)) });
  const del = (id) => upMData({ ...mData, thuNgoai: tn.filter((k) => k.id !== id) });
  
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>💧 Thu ngoài (KV4)</span>
      </div>
      
      {tn.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: C.sub, fontSize: 13, background: C.card, border: `1.5px dashed ${C.line}`, borderRadius: C.r, marginBottom: 10 }}>
          Chưa có khoản thu ngoài nào.
        </div>
      )}

      {tn.map((k) => (
        <ThuNgoaiItem key={k.id} k={k} locked={locked} set={set} del={del} />
      ))}

      {!locked && (
        <div style={{
          background: C.card,
          border: `1.5px dashed ${C.line}`,
          borderRadius: C.r,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input 
              value={ten} 
              onChange={(e) => setTen(e.target.value)} 
              placeholder="Tên khoản (VD: Quỹ CSVC)" 
              style={{ flex: "2 1 150px", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
            <input 
              type="number" 
              value={so} 
              onChange={(e) => setSo(e.target.value)} 
              placeholder="Số tiền" 
              style={{ flex: "1 1 100px", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}` }}>
              <button onClick={() => setCoDinh(false)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: !coDinh ? C.pine : "#fff", color: !coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Không cố định</button>
              <button onClick={() => setCoDinh(true)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: coDinh ? C.pine : "#fff", color: coDinh ? "#fff" : C.sub, fontFamily: font.body }}>🔁 Cố định</button>
            </div>
            
            <button 
              onClick={add} 
              style={{ flex: "1 1 80px", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}
            >+ Thêm</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KhoanThuLop({ mData, upMData, locked, classes, rows, lopFilter }) {
  if (locked) return null;
  const [ten, setTen] = useState(""); const [so, setSo] = useState("");
  const [coDinh, setCoDinh] = useState(false);
  const [lopAp, setLopAp] = useState(lopFilter !== "all" ? lopFilter : (classes[0]?.id || ""));
  const targets = rows.filter((r) => r.lopId === lopAp);
  const apply = () => {
    if (!ten.trim() || !so || !lopAp) return;
    const ids = targets.map((r) => r.hs.id);
    if (ids.length === 0) { toast("Lớp này chưa có HS trong tháng."); return; }
    const fees = { ...mData.fees };
    ids.forEach((sid) => {
      const cur = fees[sid]; if (!cur) return;
      fees[sid] = { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten: ten.trim() + (coDinh ? " (cố định)" : ""), soTien: Number(so), lop: lopAp, coDinh }] };
    });
    upMData({ ...mData, fees });
    setTen(""); setSo("");
    toast(`Đã thêm "${ten.trim()}" cho ${ids.length} HS lớp ${classes.find((c) => c.id === lopAp)?.ten}.`);
  };
  return (
    <Card style={{ marginTop: 10, background: C.blueASoft, borderColor: "#C7DCF3" }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, color: C.blueA }}>➕ Khoản thu áp cho cả lớp</div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>Chọn lớp + nhập khoản → cộng vào mọi HS lớp đó tháng này. <b>Cố định</b> = khoản lặp hàng tháng; <b>không cố định</b> = chỉ tháng này. Sửa/xóa lẻ ở thẻ HS.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        <select value={lopAp} onChange={(e) => setLopAp(e.target.value)} style={{ flex: "1 1 120px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid #C7DCF3`, fontSize: 13, minWidth: 0, fontFamily: font.body, background: "#fff" }}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.ten} ({rows.filter((r) => r.lopId === c.id).length} HS)</option>)}
        </select>
        <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid #C7DCF3` }}>
          <button onClick={() => setCoDinh(false)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: !coDinh ? C.blueA : "#fff", color: !coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Không cố định</button>
          <button onClick={() => setCoDinh(true)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: coDinh ? C.blueA : "#fff", color: coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Cố định</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Dã ngoại / Đầu năm)" style={{ flex: "2 1 150px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid #C7DCF3`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid #C7DCF3`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <button onClick={apply} style={{ background: C.blueA, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>Áp dụng</button>
      </div>
    </Card>
  );
}

/* ============================================================
   6. THU PHI TAB V1 — MAIN
   ============================================================ */
export function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }) {
  const [quickEditId, setQuickEditId] = useState(null);
  const [thuTienId, setThuTienId] = useState(null);
  const [expandId, setExpandId] = useState(null);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [thuSheetOpen, setThuSheetOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [showNgayAn, setShowNgayAn] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [thuLimit, setThuLimit] = useState(50);
  const inputRefs = useRef({});
  const { sentinelRef, shrunk } = useStickyShrink();

  const chipCounts = useMemo(() => {
    const c = { all: rows.length, chuaThu: 0, thieu: 0, noCu: 0, thuThua: 0 };
    rows.forEach(r => {
      const thuc = r.rec.thucThu || 0;
      if (thuc === 0 && r.tongPhaiThu > 0) c.chuaThu++;
      else if (thuc > 0 && r.conNo > 0) c.thieu++;
      if (r.noTruoc > 0) c.noCu++;
      if (r.conNo < 0) c.thuThua++;
    });
    return c;
  }, [rows]);

  const pct = tk.ps > 0 ? Math.min(100, Math.round(tk.thu / tk.ps * 100)) : 0;
  const soNo = rows.filter((r) => r.conNo > 0).length;

  const batchThuDu = async (onlyNo) => {
    const pairs = rows.filter((r) => !onlyNo || r.conNo > 0).map((r) => ({ sid: r.hs.id, thucThu: r.tongPhaiThu }));
    if (pairs.length === 0) { toast("Không có HS nào đang nợ."); return; }
    if (!(await ask(`Đánh "thu đủ" cho ${pairs.length} HS đang hiển thị?`, { okText: "Thu đủ" }))) return;
    thuDuNhieu(pairs);
    toast(`Đã thu đủ ${pairs.length} HS.`);
    setBatchOpen(false);
  };

  const selStyle = { padding: "9px 10px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.card, minWidth: 0, cursor: "pointer" };

  const CHIP_CFG = [
    { key: "all", label: "Tất cả", count: chipCounts.all, bg: "#1C3530", color: "#fff", border: "#1C3530" },
    { key: "chuaThu", label: "Chưa thu", count: chipCounts.chuaThu, bg: C.coralSoft, color: C.coral, border: C.coralSoft },
    { key: "thieu", label: "Thu thiếu", count: chipCounts.thieu, bg: C.amberSoft, color: C.amber, border: C.amberSoft },
    { key: "noCu", label: "Nợ cũ", count: chipCounts.noCu, bg: C.coralSoft, color: C.coral, border: C.coralSoft },
    { key: "thuThua", label: "Thu thừa", count: chipCounts.thuThua, bg: "#DBEAFE", color: "#2563EB", border: "#DBEAFE" },
  ];

  return (
    <>
      <div ref={sentinelRef} style={{ height: 1 }} />

      <StickyBar shrunk={shrunk}>
        <div style={{ display: "flex", gap: C.sm, marginBottom: C.sm, alignItems: "center" }}>
          <div style={{ flex: 1 }}><SearchBar value={search} onChange={setSearch} /></div>
          {isWide ? (
            <select value={lopFilter} onChange={(e) => setLopFilter(e.target.value)} style={{ ...selStyle, flex: "0 0 140px" }}>
              {chipsLop.map(([id, ten]) => <option key={id} value={id}>{id === "all" ? "Tất cả lớp" : ten}</option>)}
            </select>
          ) : (
            <button onClick={() => setLopSheetOpen(true)} style={{ ...selStyle, flex: "0 0 130px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lopFilter === "all" ? "Tất cả lớp" : getLop(lopFilter)?.ten}</span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
          )}
          {isWide ? (
            <select value={thuFilter} onChange={(e) => setThuFilter(e.target.value)} style={{ ...selStyle, flex: "0 0 150px" }}>
              {[["all", "Mọi tình trạng"], ["chuaThu", "Chưa thu"], ["thieu", "Thiếu"], ["noCu", "Nợ cũ"], ["thuThua", "Thu thừa"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ) : (
            <button onClick={() => setThuSheetOpen(true)} style={{ ...selStyle, flex: "0 0 140px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {thuFilter === "all" ? "Mọi tình trạng" : thuFilter === "chuaThu" ? "Chưa thu" : thuFilter === "thieu" ? "Thiếu" : thuFilter === "noCu" ? "Nợ cũ" : thuFilter === "thuThua" ? "Thu thừa" : "Mọi tình trạng"}
              </span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: C.sm, scrollbarWidth: "none" }}>
          {CHIP_CFG.map(chip => {
            const active = thuFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setThuFilter(chip.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 99,
                  border: `1px solid ${active ? chip.border : C.line}`,
                  background: active ? chip.bg : C.card,
                  color: active ? chip.color : C.sub,
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontFamily: font.body,
                  flexShrink: 0
                }}
              >
                {chip.label} {chip.count}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
          <span style={{ color: C.green }}>🟢 Đã thu: {fmtK(tk.thu)}</span>
          <span style={{ color: C.coral }}>🔴 Còn nợ: {fmtK(tk.no)}</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: C.green, borderRadius: 99, transition: "width .3s" }} />
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: C.md }}>
          {rows.filter(r => r.conNo <= 0 && r.ps.tong > 0).length}/{rows.length} học sinh đã hoàn thành
        </div>
      </StickyBar>

      {showNgayAn && <div style={{ marginBottom: 10 }}><NgayAnBar onApply={(v, ids) => { setNgayAnAll(v, ids); setShowNgayAn(false); }} rows={rows} /></div>}

      {locked && <LockNote />}
      {rows.length === 0 && <EmptyState search={search} onClear={() => { setSearch(""); setLopFilter("all"); setThuFilter("all"); }} />}

      {fastMode ? (
        rows.slice(0, thuLimit).map((r, idx) => {
          return (
            <div key={r.hs.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, marginBottom: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.hs.ten}</div>
                <div style={{ fontSize: 11.5, color: C.sub }}>cần {fmt(r.tongPhaiThu)}{r.noTruoc > 0 ? ` · 🔴 nợ ${fmt(r.noTruoc)}` : ""}</div>
              </div>
              <input
                key={`fast-${r.hs.id}-${r.rec.thucThu || 0}`}
                ref={(el) => (inputRefs.current[r.hs.id] = el)}
                type="text" inputMode="numeric"
                defaultValue={r.rec.thucThu ? Number(r.rec.thucThu).toLocaleString("vi-VN") : ""}
                onFocus={(e) => { e.target.value = r.rec.thucThu ? String(r.rec.thucThu) : ""; e.target.select(); }}
                onBlur={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); setRec(r.hs.id, { thucThu: d === "" ? 0 : Number(d) }); e.target.value = d ? Number(d).toLocaleString("vi-VN") : ""; }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); const next = rows[idx + 1]; if (next) setTimeout(() => inputRefs.current[next.hs.id]?.focus(), 30); } }}
                placeholder="0" style={{ width: 110, padding: "9px 8px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: "#FAFCFA", textAlign: "right", outline: "none" }} />
              <button onClick={() => { setRec(r.hs.id, { thucThu: r.tongPhaiThu }); if (inputRefs.current[r.hs.id]) inputRefs.current[r.hs.id].value = Number(r.tongPhaiThu).toLocaleString("vi-VN"); }} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, width: 40, height: 40, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>✓</button>
            </div>
          );
        })
      ) : (
        rows.slice(0, thuLimit).map((r) => (
          <HSCardV1
            key={r.hs.id}
            r={r}
            locked={locked}
            onThuTien={(row) => setThuTienId(row.hs.id)}
            onQuickEdit={(row) => setQuickEditId(row.hs.id)}
            onViewPhieu={(row) => { setPhieuId(row.hs.id); setTab("phieu"); }}
            setRec={setRec}
            expandId={expandId}
            setExpandId={setExpandId}
          />
        ))
      )}

      {rows.length > thuLimit && (
        <button onClick={() => setThuLimit((l) => l + 50)} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
          Hiện thêm 50 HS ({Math.min(thuLimit, rows.length)}/{rows.length})
        </button>
      )}

      <ThuNgoai mData={mData} upMData={upMData} locked={locked} />
      <KhoanThuLop mData={mData} upMData={upMData} locked={locked} classes={chipsLop.slice(1).map(([id, ten]) => ({ id, ten }))} rows={rows} lopFilter={lopFilter} />

      <ThuTienSheet
        r={rows.find(x => x.hs.id === thuTienId)}
        open={!!thuTienId}
        onClose={() => setThuTienId(null)}
        setRec={setRec}
      />

      <QuickEditSheet
        sid={quickEditId}
        rows={rows}
        onClose={() => setQuickEditId(null)}
        setKhoan={setKhoan}
        resetKhoan={resetKhoan}
        setRec={setRec}
        addPhuThuHS={addPhuThuHS}
        delPhuThuHS={delPhuThuHS}
      />

      <LopFilterSheet open={lopSheetOpen} onClose={() => setLopSheetOpen(false)} chipsLop={chipsLop} lopFilter={lopFilter} setLopFilter={setLopFilter} allRows={allRows} />

      <BottomSheet open={thuSheetOpen} onClose={() => setThuSheetOpen(false)} title="Tình trạng thu">
        {[["all", "Mọi tình trạng"], ["chuaThu", "Chưa thu"], ["thieu", "Thiếu"], ["noCu", "Nợ cũ"], ["thuThua", "Thu thừa"]].map(([v, l]) => {
          const active = thuFilter === v;
          return (
            <div key={v} onClick={() => { setThuFilter(v); setThuSheetOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink }}>{l}</div>
            </div>
          );
        })}
      </BottomSheet>

      {!locked && rows.length > 0 && (
        <>
          <div style={{ height: 90 }} />
          <div style={{ position: "fixed", bottom: 76, left: 0, right: 0, maxWidth: 640, margin: "0 auto", padding: `0 ${C.md}`, zIndex: 15 }}>
            <div onClick={() => setBatchOpen(v => !v)} style={{ background: C.ink, color: "#fff", padding: `${C.md}px`, borderRadius: C.r, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", display: "flex", justifyContent: "center", alignItems: "center", gap: C.sm, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              ⚡ Thao tác hàng loạt <span style={{ fontSize: 12, transition: "transform .2s", transform: batchOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </div>
            {batchOpen && (
              <div style={{ background: C.card, borderRadius: C.r, marginTop: C.xs, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                <button onClick={() => { setShowNgayAn(v => !v); setBatchOpen(false); }} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.line}`, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🍽️</span> {showNgayAn ? "Ẩn áp ngày ăn" : "Áp ngày ăn hàng loạt"}
                </button>
                <button onClick={() => { setFastMode(v => !v); setBatchOpen(false); }} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.line}`, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚡</span> {fastMode ? "Tắt chế độ Tích thu nhanh" : "Bật chế độ Tích thu nhanh"}
                </button>
                <button onClick={() => batchThuDu(true)} disabled={soNo === 0} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: soNo > 0 ? "pointer" : "default", color: soNo > 0 ? C.green : C.gray, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>💵</span> Thu đủ {soNo} HS còn nợ đang hiển thị
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
