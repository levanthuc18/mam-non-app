import { useState, useRef, useMemo } from "react";
import {
  C, font, fmt, soNgayHoc, ask, toast, logAction, uid, noDau,
  KHOAN, tinhPSFromRec, trangThaiThu
} from "./lib.js";
import {
  Card, NumInput, ABBtn, Badge, SearchBar, useStickyShrink, StickyBar, BottomSheet, PLBadge, LockNote
} from "./ui.jsx";

// Helper format ngắn gọn cho KPI
const fmtK = (n) => {
  if (!n) return "0";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "tr";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "k";
  return n;
};

// Component Empty State
function EmptyState({ search, onClear }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: C.sub }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{search ? "Không tìm thấy học sinh phù hợp" : "Không có học sinh trong bộ lọc này"}</div>
      <button onClick={onClear} style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Xóa bộ lọc</button>
    </div>
  );
}

export function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }) {
  const [quickEditId, setQuickEditId] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const { sentinelRef, shrunk } = useStickyShrink();
  
  // Logic tính KPI Sticky Header
  const pct = tk.ps > 0 ? Math.min(100, Math.round(tk.thu / tk.ps * 100)) : 0;
  const daThuCount = rows.filter(r => r.conNo <= 0 && r.ps.tong > 0).length;
  const tongHS = rows.length;

  const batchThuDu = async () => {
    const pairs = rows.filter((r) => r.conNo > 0).map((r) => ({ sid: r.hs.id, thucThu: r.tongPhaiThu }));
    if (pairs.length === 0) { toast("Không có HS nào đang nợ."); return; }
    if (!(await ask(`Đánh "thu đủ" cho ${pairs.length} HS đang nợ?`, { okText: "Thu đủ" }))) return;
    thuDuNhieu(pairs);
    toast(`Đã thu đủ ${pairs.length} HS.`);
    setBatchOpen(false);
  };

  return (
    <>
      <div ref={sentinelRef} style={{ height: 1 }} />
      
      {/* 1. STICKY HEADER ĐỈNH TAB */}
      <StickyBar shrunk={shrunk}>
        <div style={{ display: "flex", gap: C.sm, marginBottom: C.sm }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <button onClick={() => setLopFilter("all")} style={{ padding: `0 ${C.md}`, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", cursor: "pointer", height: 40 }}>
            {lopFilter === "all" ? "Tất cả lớp ▾" : `${getLop(lopFilter)?.ten} ▾`}
          </button>
        </div>
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

      {locked && <LockNote />}
      {rows.length === 0 && <EmptyState search={search} onClear={() => { setSearch(""); setLopFilter("all"); setThuFilter("all"); }} />}

      {/* 2. DANH SÁCH THẺ HỌC PHÍ CHUYÊN SÂU */}
      {rows.map((r) => {
        const isNo = r.conNo > 0;
        const isDu = r.conNo < 0;
        const isDone = !isNo && !isDu && r.ps.tong > 0;
        
        // Style theo trạng thái tài chính
        let cardStyle = { background: C.card, borderRadius: C.r, marginBottom: C.md, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" };
        if (isNo) cardStyle.borderLeft = `4px solid ${C.coral}`;
        if (isDone) cardStyle.borderLeft = `4px solid ${C.green}`;
        if (isDu) cardStyle.background = C.pineSoft;

        // Tính chi tiết hiển thị
        const tienAn = r.rec.khoan?.tienAn ?? 0;
        const hocPhi = r.rec.khoan?.hocPhi ?? 0;
        const phuThu = r.ps.dong.filter(d => !d[0].includes("Ăn") && !d[0].includes("Học phí") && !d[0].includes("Bán trú") && !d[0].includes("Vệ sinh") && !d[0].includes("Tiếng Anh") && !d[0].includes("Ngoại khóa")).reduce((a,b)=>a+b[1],0);

        return (
          <div key={r.hs.id} style={cardStyle}>
            <div style={{ padding: C.md }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{r.hs.ten}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    <span>{r.lop?.ten}</span><PLBadge pl={r.hs.pl} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {!locked && isNo && (
                    <button onClick={() => setRec(r.hs.id, { thucThu: r.tongPhaiThu })} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💰 Thu nhanh</button>
                  )}
                  {isDone && <span style={{ fontSize: 11, color: C.green, fontWeight: 600, background: C.greenSoft, padding: "4px 8px", borderRadius: 6 }}>✓ Đã đóng đủ</span>}
                  {isDu && <span style={{ fontSize: 11, color: C.pine, fontWeight: 600, background: "#fff", padding: "4px 8px", borderRadius: 6 }}>Dư {fmt(Math.abs(r.conNo))}đ</span>}
                </div>
              </div>

              <div style={{ marginTop: C.xs, fontSize: 13, color: C.sub, display: "flex", flexDirection: "column", gap: 2 }}>
                <div>Học phí: {fmtK(hocPhi)} • Tiền ăn ({r.rec.ngayAn}n): {fmtK(tienAn)}</div>
                <div>Phụ thu: {fmtK(phuThu)} • Nợ cũ: {fmtK(r.noTruoc)}</div>
              </div>

              <div style={{ marginTop: C.md, display: "flex", alignItems: "center", gap: C.sm, borderTop: `1px dashed ${C.line}`, paddingTop: C.md }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: isNo ? C.coral : C.ink }}>{fmt(r.tongPhaiThu)}đ</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: C.sub }}>Thực thu:</span>
                    <NumInput value={r.rec.thucThu} onChange={(v) => setRec(r.hs.id, { thucThu: v })} w={100} disabled={locked} />
                  </div>
                </div>
                {!locked && (
                  <button onClick={() => setQuickEditId(r.hs.id)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.amberSoft}`, background: C.amberSoft, color: C.amber, fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "flex-end" }}>✏️ Sửa nhanh</button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setPhieuId(r.hs.id); setTab("phieu"); }} title="In phiếu thu" style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 14, cursor: "pointer", alignSelf: "flex-end" }}>🧾</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. MENU LỆNH HÀNH LOẠT (Sticky Bottom Action Bar) */}
      {!locked && rows.length > 0 && (
        <div style={{ position: "fixed", bottom: 76, left: 0, right: 0, maxWidth: 640, margin: "0 auto", padding: `0 ${C.md}`, zIndex: 15 }}>
          <div onClick={() => setBatchOpen(v => !v)} style={{ background: C.ink, color: "#fff", padding: `${C.md}px`, borderRadius: C.r, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", display: "flex", justifyContent: "center", alignItems: "center", gap: C.sm, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            ⚡ Lệnh hành động hàng loạt ▾
          </div>
          {batchOpen && (
            <div style={{ background: C.card, borderRadius: C.r, marginTop: C.xs, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden" }}>
              <button onClick={batchThuDu} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.line}`, color: C.ink }}>💵 Thu đủ hàng loạt (HS đang nợ)</button>
              <button onClick={() => { toast("Tính năng đang phát triển"); setBatchOpen(false); }} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.line}`, color: C.ink }}>✉️ Nhắc nợ Zalo/SMS</button>
              <button onClick={() => setTab("dash")} style={{ width: "100%", padding: C.md, border: "none", background: "none", textAlign: "left", fontSize: 14, cursor: "pointer", color: C.ink }}>🔒 Chốt tháng</button>
            </div>
          )}
        </div>
      )}

      {/* 4. BOTTOM SHEET SỬA NHANH KHOẢN LINH HOẠT */}
      {quickEditId && (
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
      )}

      <ThuNgoai mData={mData} upMData={upMData} locked={locked} />
      <KhoanThuLop mData={mData} upMData={upMData} locked={locked} classes={chipsLop.slice(1).map(([id, ten]) => ({ id, ten }))} rows={rows} lopFilter={lopFilter} />
    </>
  );
}

// COMPONENT BOTTOM SHEET SỬA NHANH
function QuickEditSheet({ sid, rows, onClose, setKhoan, resetKhoan, setRec, addPhuThuHS, delPhuThuHS }) {
  const r = rows.find(x => x.hs.id === sid);
  const [ptTen, setPtTen] = useState("");
  const [ptSo, setPtSo] = useState("");
  
  if (!r) return null;
  
  // Các khoản cố định (Khóa)
  const lockedKeys = ["hocPhi", "banTru", "veSinh"];
  const total = r.ps.tong + r.noTruoc;

  const addPT = () => {
    if (!ptTen.trim() || !ptSo) return;
    addPhuThuHS(sid, ptTen.trim(), Number(ptSo));
    setPtTen(""); setPtSo("");
  };

  return (
    <BottomSheet open={true} onClose={onClose} title={`⚙️ SỬA KHOẢN THU - ${r.hs.ten.toUpperCase()}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: C.md }}>
        {KHOAN.map(k => {
          const val = r.rec.khoan?.[k.key] ?? 0;
          const def = r.rec.khoanDefault?.[k.key] ?? 0;
          const isLocked = lockedKeys.includes(k.key);
          
          return (
            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: C.sm }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: isLocked ? C.gray : C.ink }}>{k.label}</div>
                {isLocked && <div style={{ fontSize: 11, color: C.gray }}>(Khóa)</div>}
              </div>
              {!isLocked ? (
                <>
                  <NumInput 
                    value={k.key === "tienAn" ? r.rec.ngayAn : val} 
                    onChange={(v) => {
                      if (k.key === "tienAn") setRec(sid, { ngayAn: v, ngayAnManual: true });
                      else setKhoan(sid, k.key, v);
                    }} 
                    w={120} 
                  />
                  <button 
                    onClick={() => k.key === "tienAn" ? setRec(sid, { ngayAnManual: false }) : resetKhoan(sid, k.key)} 
                    style={{ border: `1px solid ${C.line}`, background: C.card, borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: C.sub, fontSize: 16 }}
                  >↺</button>
                </>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: C.gray, width: 120, textAlign: "right" }}>{fmt(val)}đ</div>
              )}
            </div>
          );
        })}

        {/* Khoản riêng */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: C.md }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: C.sm }}>Khoản riêng</div>
          {(r.rec.phuThu || []).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
              <span style={{ flex: 1, color: C.ink }}>{p.ten}</span>
              <span style={{ fontWeight: 600 }}>{fmt(p.soTien)}</span>
              <button onClick={() => delPhuThuHS(sid, p.id)} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <input value={ptTen} onChange={(e) => setPtTen(e.target.value)} placeholder="Tên khoản" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
            <input type="number" value={ptSo} onChange={(e) => setPtSo(e.target.value)} placeholder="Số tiền" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
            <button onClick={addPT} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Thêm</button>
          </div>
        </div>
        
        <div style={{ marginTop: C.md, paddingTop: C.md, borderTop: `2px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Tổng tiền mới:</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.coral }}>{fmt(total)}đ</span>
        </div>
        
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: C.sm }}>✓ LƯU THAY ĐỔI</button>
      </div>
    </BottomSheet>
  );
}

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
