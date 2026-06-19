import { useState, useRef, useMemo } from "react";
import {
  C, font, fmt, soNgayHoc, ask, toast, logAction, uid, noDau,
  KHOAN, tinhPSFromRec, trangThaiThu
} from "./lib.js";
import {
  Card, NumInput, ABBtn, Badge, SearchBar, useStickyShrink, StickyBar, BottomSheet, PLBadge
} from "./ui.jsx";

// Helper format ngắn gọn cho KPI
const fmtK = (n) => {
  if (!n) return "0";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "tr";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "k";
  return n;
};

export function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, openId, setOpenId, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide, onSelectStudent }) {
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
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelectStudent && onSelectStudent(r.hs.id)}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, cursor: "pointer" }}>{r.hs.ten}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    <span>{r.lop?.ten}</span><PLBadge pl={r.hs.pl} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: isNo ? C.coral : C.ink }}>{fmt(r.tongPhaiThu)}đ</div>
                  {isDone && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ Đã đóng đủ</span>}
                  {isDu && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Dư {fmt(Math.abs(r.conNo))}đ</span>}
                  {isNo && <span style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>Còn nợ</span>}
                </div>
              </div>

              <div style={{ marginTop: C.sm, fontSize: 13, color: C.sub, display: "flex", flexDirection: "column", gap: 2 }}>
                <div>Học phí: {fmtK(hocPhi)} • Tiền ăn ({r.rec.ngayAn}n): {fmtK(tienAn)}</div>
                <div>Phụ thu: {fmtK(phuThu)} • Nợ cũ: {fmtK(r.noTruoc)}</div>
              </div>

              <div style={{ marginTop: C.md, display: "flex", alignItems: "center", gap: C.sm, borderTop: `1px dashed ${C.line}`, paddingTop: C.md }}>
                <span style={{ fontSize: 12, color: C.sub, marginRight: "auto" }}>Thực thu:</span>
                <NumInput value={r.rec.thucThu} onChange={(v) => setRec(r.hs.id, { thucThu: v })} w={100} disabled={locked} />
                {!locked && isNo && (
                  <button onClick={() => setRec(r.hs.id, { thucThu: r.tongPhaiThu })} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💰 Thu nhanh</button>
                )}
                {!locked && (
                  <button onClick={() => setQuickEditId(r.hs.id)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.amberSoft}`, background: C.amberSoft, color: C.amber, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✏️ Sửa nhanh</button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. MENU LỆNH HÀNH LOẠT (Sticky Bottom Action Bar) */}
      {!locked && (
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
        />
      )}
    </>
  );
}

// COMPONENT BOTTOM SHEET SỬA NHANH
function QuickEditSheet({ sid, rows, onClose, setKhoan, resetKhoan, setRec }) {
  const r = rows.find(x => x.hs.id === sid);
  if (!r) return null;
  
  // Các khoản cố định (Khóa)
  const lockedKeys = ["hocPhi", "banTru", "veSinh"];
  const total = r.ps.tong + r.noTruoc;

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
        
        <div style={{ marginTop: C.md, paddingTop: C.md, borderTop: `2px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Tổng tiền mới:</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.coral }}>{fmt(total)}đ</span>
        </div>
        
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: C.sm }}>✓ LƯU THAY ĐỔI</button>
      </div>
    </BottomSheet>
  );
}
