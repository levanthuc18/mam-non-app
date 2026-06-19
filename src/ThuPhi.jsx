import { useState, useRef, useMemo } from "react";
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
   2. QUICK EDIT SHEET — TẤT CẢ KHOẢN ĐỀU MỞ KHÓA
   ============================================================ */
function QuickEditSheet({ sid, rows, onClose, setKhoan, resetKhoan, setRec, addPhuThuHS, delPhuThuHS }) {
  const r = rows.find(x => x.hs.id === sid);
  const [ptTen, setPtTen] = useState("");
  const [ptSo, setPtSo] = useState("");
  const [localKhoan, setLocalKhoan] = useState(() => ({ ...r?.rec?.khoan }));
  const [localNgayAn, setLocalNgayAn] = useState(() => r?.rec?.ngayAn ?? 0);
  const [localPhuThu, setLocalPhuThu] = useState(() => r?.rec?.phuThu ?? []);

  if (!r) return null;

  const tongTamTinh = (() => {
    let tong = 0;
    KHOAN.forEach(k => {
      if (k.key === "tienAn") {
        const giaAn = r.rec.khoanDefault?.giaAn ?? 0;
        tong += giaAn * localNgayAn;
      } else {
        tong += localKhoan?.[k.key] ?? 0;
      }
    });
    tong += localPhuThu.reduce((a, p) => a + (p.soTien ?? 0), 0);
    tong += r.noTruoc ?? 0;
    return tong;
  })();

  const handleKhoanChange = (key, v) => {
    setLocalKhoan(prev => ({ ...prev, [key]: v }));
    setKhoan(sid, key, v);
  };

  const handleNgayAnChange = (v) => {
    setLocalNgayAn(v);
    setRec(sid, { ngayAn: v, ngayAnManual: true });
  };

  const handleResetKhoan = (key) => {
    const def = r.rec.khoanDefault?.[key] ?? 0;
    setLocalKhoan(prev => ({ ...prev, [key]: def }));
    resetKhoan(sid, key);
  };

  const handleResetNgayAn = () => {
    setLocalNgayAn(r.rec.ngayAnDefault ?? 0);
    setRec(sid, { ngayAnManual: false });
  };

  const addPT = () => {
    if (!ptTen.trim() || !ptSo) return;
    const newPT = { id: uid(), ten: ptTen.trim(), soTien: Number(ptSo) };
    setLocalPhuThu(prev => [...prev, newPT]);
    addPhuThuHS(sid, ptTen.trim(), Number(ptSo));
    setPtTen(""); setPtSo("");
  };

  const delPT = (id) => {
    setLocalPhuThu(prev => prev.filter(p => p.id !== id));
    delPhuThuHS(sid, id);
  };

  return (
    <BottomSheet open={true} onClose={onClose} title={`⚙️ SỬA KHOẢN THU — ${r.hs.ten.toUpperCase()}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: C.md }}>
        {KHOAN.map(k => {
          const val = k.key === "tienAn" ? localNgayAn : (localKhoan?.[k.key] ?? 0);
          return (
            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: C.sm }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{k.label}</div>
              </div>
              <NumInput value={val} onChange={(v) => { if (k.key === "tienAn") handleNgayAnChange(v); else handleKhoanChange(k.key, v); }} w={120} />
              <button onClick={() => k.key === "tienAn" ? handleResetNgayAn() : handleResetKhoan(k.key)} style={{ border: `1px solid ${C.line}`, background: C.card, borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: C.sub, fontSize: 16 }}>↺</button>
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
   3. THẺ HỌC SINH (ĐÃ NÉN)
   ============================================================ */
function HSCard({ r, locked, onQuickEdit, onThuDu, onViewPhieu, setRec }) {
  const isNo = r.conNo > 0;
  const isDu = r.conNo < 0;
  const isDone = !isNo && !isDu && r.ps.tong > 0;

  const cardStyle = {
    backgroundColor: C.card,
    borderRadius: C.r,
    padding: "12px 14px",
    marginBottom: 12,
    borderLeft: `4px solid ${isNo ? C.coral : C.green}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column"
  };
  if (isDu) {
    cardStyle.background = C.pineSoft;
    cardStyle.borderLeft = `4px solid ${C.pine}`;
  }

  const tienAn = r.rec.khoan?.tienAn ?? 0;
  const hocPhi = r.rec.khoan?.hocPhi ?? 0;
  const phuThu = r.ps.dong.filter(d =>
    !d[0].includes("Ăn") && !d[0].includes("Học phí") && !d[0].includes("Bán trú") &&
    !d[0].includes("Vệ sinh") && !d[0].includes("Tiếng Anh") && !d[0].includes("Ngoại khóa")
  ).reduce((a, b) => a + b[1], 0);

  return (
    <div style={cardStyle}>
      {/* Hàng 1: Tên + Trạng thái */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div onClick={() => onQuickEdit(r)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.pine, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3, display: "inline" }}>
            {r.hs.ten}
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
            {r.lop?.ten} <PLBadge pl={r.hs.pl} />
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
          {isDu && (
            <div style={{ backgroundColor: C.greenSoft, color: C.green, padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 650 }}>
              Dư {fmt(Math.abs(r.conNo))}đ
            </div>
          )}
          {isDone && (
            <div style={{ backgroundColor: C.greenSoft, color: C.green, padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 650 }}>
              ✓ Đã đóng đủ
            </div>
          )}
        </div>
      </div>

      {/* Hàng 2: Grid 2 cột chi tiết */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 8px",
        fontSize: 13,
        color: C.sub,
        marginBottom: 10,
        paddingBottom: 10,
        borderBottom: `1px dashed ${C.line}`
      }}>
        <div>• Học phí: {fmtK(hocPhi)}</div>
        <div>• Tiền ăn ({r.rec.ngayAn}n): {fmtK(tienAn)}</div>
        <div>• Phụ thu: {fmtK(phuThu)}</div>
        <div>• Nợ cũ: {fmtK(r.noTruoc)}</div>
      </div>

      {/* Hàng 3: Phải thu → Input → Sửa nhanh */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 750, color: C.ink }}>{fmt(r.tongPhaiThu)}đ</div>
          <span style={{ color: C.gray, fontSize: 12, fontWeight: "bold" }}>➔</span>
          <input
            type="number"
            value={r.rec.thucThu ?? ""}
            onChange={(e) => setRec(r.hs.id, { thucThu: Number(e.target.value) || 0 })}
            disabled={locked}
            style={{
              width: 105, height: 34, padding: "0 8px", borderRadius: 8,
              border: `1px solid ${C.graySoft}`, fontSize: 13.5, fontWeight: 700,
              color: C.green, backgroundColor: "#FAFAFA", textAlign: "center", outline: "none"
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!locked && isNo && (
            <button onClick={() => onThuDu(r)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💰 Thu nhanh</button>
          )}
          {!locked && (
            <button onClick={() => onQuickEdit(r)} style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "#FFF9EE", border: `1px solid ${C.amberSoft}`, padding: "6px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 650, color: C.amber, cursor: "pointer" }}>
              ✏️ Sửa nhanh
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onViewPhieu(r); }} title="In phiếu thu" style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 14, cursor: "pointer" }}>🧾</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   4. THU NGOÀI & KHOẢN THU LỚP
   ============================================================ */
function ThuNgoai({ mData, upMData, locked }) {
  const tn = mData.thuNgoai || [];
  const [ten, setTen] = useState(""); const [so, setSo] = useState("");
  const add = () => { if (!ten.trim()) return; upMData({ ...mData, thuNgoai: [...tn, { id: uid(), ten: ten.trim(), soTien: Number(so) || 0, thucThu: 0, nguoiThu: "A" }] }); setTen(""); setSo(""); };
  const set = (id, p) => upMData({ ...mData, thuNgoai: tn.map((k) => (k.id === id ? { ...k, ...p } : k)) });
  const del = (id) => upMData({ ...mData, thuNgoai: tn.filter((k) => k.id !== id) });
  return (
    <Card style={{ marginTop: 4 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>💧 Thu ngoài (KV4)</div>
      {tn.map((k) => (
        <div key={k.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ flex: "1 1 120px", fontSize: 13.5, fontWeight: 600, minWidth: 0 }}>{k.ten} <span style={{ color: C.sub, fontWeight: 400 }}>({fmt(k.soTien)})</span></div>
          <NumInput value={k.thucThu} onChange={(v) => set(k.id, { thucThu: v })} w={100} disabled={locked} />
          <ABBtn val={k.nguoiThu} set={(p) => set(k.id, { nguoiThu: p })} small disabled={locked} />
          {!locked && <button onClick={() => del(k.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}>🗑</button>}
        </div>
      ))}
      {!locked && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Quỹ CSVC)" style={{ flex: "2 1 140px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
          <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
          <button onClick={add} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Thêm</button>
        </div>
      )}
    </Card>
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
   5. THU PHI TAB V5 (MAIN — FULL FEATURE)
   ============================================================ */
export function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }) {
  const [quickEditId, setQuickEditId] = useState(null);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [thuSheetOpen, setThuSheetOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [showNgayAn, setShowNgayAn] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [thuLimit, setThuLimit] = useState(50);
  const inputRefs = useRef({});
  const { sentinelRef, shrunk } = useStickyShrink();

  const pct = tk.ps > 0 ? Math.min(100, Math.round(tk.thu / tk.ps * 100)) : 0;
  const daThuCount = rows.filter(r => r.conNo <= 0 && r.ps.tong > 0).length;
  const tongHS = rows.length;

  const batchThuDu = async (onlyNo) => {
    const pairs = rows.filter((r) => !onlyNo || r.conNo > 0).map((r) => ({ sid: r.hs.id, thucThu: r.tongPhaiThu }));
    if (pairs.length === 0) { toast("Không có HS nào đang nợ."); return; }
    if (!(await ask(`Đánh "thu đủ" cho ${pairs.length} HS đang hiển thị?`, { okText: "Thu đủ" }))) return;
    thuDuNhieu(pairs);
    toast(`Đã thu đủ ${pairs.length} HS.`);
    setCfgOpen(false);
  };

  const selStyle = { padding: "9px 10px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.card, minWidth: 0, cursor: "pointer" };
  const cfgItem = { width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 12, border: "none", background: "none", color: C.ink, fontWeight: 700, fontSize: 13.5, fontFamily: font.body, cursor: "pointer" };

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
          {!locked && (
            <button onClick={() => setCfgOpen((v) => !v)} style={{ padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${C.pine}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: cfgOpen ? C.pine : C.pineSoft, color: cfgOpen ? "#fff" : C.pine }}>
              ⚙️ Cấu hình
            </button>
          )}
        </div>

        {/* KPI + Progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
          <span style={{ color: C.green }}>🟢 Đã thu: {fmtK(tk.thu)}</span>
          <span style={{ color: C.coral }}>🔴 Còn nợ: {fmtK(tk.no)}</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: C.green, borderRadius: 99, transition: "width .3s" }} />
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: C.md }}>
          {daThuCount}/{tongHS} học sinh đã hoàn thành
        </div>
      </StickyBar>

      {/* ====== CARD CẤU HÌNH (đúng như ảnh 2) ====== */}
      {!locked && fastMode && (
        <button onClick={() => setFastMode(false)} style={{ width: "100%", marginBottom: 10, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: font.body, background: C.pine, color: "#fff" }}>
          ⛔ Tắt chế độ Tích thu nhanh
        </button>
      )}
      {!locked && !fastMode && cfgOpen && (
        <Card style={{ marginBottom: 10, padding: 6, borderRadius: C.r }}>
          <button onClick={() => setShowNgayAn((v) => !v)} style={{ ...cfgItem, color: showNgayAn ? C.pine : C.ink }}>🍽️ Áp ngày ăn hàng loạt {showNgayAn ? "▲" : "▼"}</button>
          {showNgayAn && <div style={{ padding: "2px 2px 6px" }}><NgayAnBar onApply={setNgayAnAll} rows={rows} /></div>}
          <button onClick={() => { setFastMode(true); setCfgOpen(false); }} style={cfgItem}>⚡ Bật chế độ Tích thu nhanh</button>
          {(() => { const soNo = rows.filter((r) => r.conNo > 0).length; return (
            <button onClick={() => { if (soNo > 0) { batchThuDu(true); } }} disabled={soNo === 0} style={{ ...cfgItem, color: soNo > 0 ? C.green : C.gray, cursor: soNo > 0 ? "pointer" : "default" }}>💵 Thu đủ {soNo} HS còn nợ đang hiển thị</button>
          ); })()}
        </Card>
      )}

      {locked && <LockNote />}
      {rows.length === 0 && <EmptyState search={search} onClear={() => { setSearch(""); setLopFilter("all"); setThuFilter("all"); }} />}

      {/* ====== DANH SÁCH HS ====== */}
      {fastMode ? (
        rows.slice(0, thuLimit).map((r) => {
          const idx = rows.findIndex((x) => x.hs.id === r.hs.id);
          return (
            <div key={r.hs.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, marginBottom: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.hs.ten}</div>
                <div style={{ fontSize: 11.5, color: C.sub }}>cần {fmt(r.tongPhaiThu)}{r.noTruoc > 0 ? ` · 🔴 nợ ${fmt(r.noTruoc)}` : ""}</div>
              </div>
              <input ref={(el) => (inputRefs.current[r.hs.id] = el)} type="text" inputMode="numeric"
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
          <HSCard
            key={r.hs.id}
            r={r}
            locked={locked}
            onQuickEdit={(row) => setQuickEditId(row.hs.id)}
            onThuDu={(row) => setRec(row.hs.id, { thucThu: row.tongPhaiThu })}
            onViewPhieu={(row) => { setPhieuId(row.hs.id); setTab("phieu"); }}
            setRec={setRec}
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

      {/* ====== BOTTOM SHEETS ====== */}
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
    </>
  );
}
