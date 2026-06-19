import { useState, useRef, useMemo } from "react";
import {
  C, font, fmt, soNgayHoc, ask, toast, logAction, uid, noDau,
  KHOAN, tinhPSFromRec, trangThaiThu
} from "./lib.js";
import {
  Card, NumInput, ABBtn, Badge, SearchBar, useStickyShrink, StickyBar, BottomSheet, PLBadge
} from "./ui.jsx";

export function PhuThuHS({ r, locked, addPhuThuHS, delPhuThuHS }) {
  const [ten, setTen] = useState(""); const [so, setSo] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const list = r.rec.phuThu || [];
  const add = () => { if (!ten.trim() || !so) return; addPhuThuHS(r.hs.id, ten.trim(), Number(so)); setTen(""); setSo(""); };
  return (
    <div style={{ marginBottom: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 4 }}>Khoản riêng (đầu năm, đồng phục…)</div>
      {list.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 13 }}>
          <span style={{ flex: 1, color: C.ink }}>{p.ten}{p.lop && <span style={{ color: C.blueA, fontSize: 10.5 }}> (cả lớp)</span>}</span>
          <span style={{ fontWeight: 600 }}>{fmt(p.soTien)}</span>
          {!locked && (confirmId === p.id
            ? <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><button onClick={() => { delPhuThuHS(r.hs.id, p.id); setConfirmId(null); }} style={{ border: "none", background: C.coral, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Xóa</button><button onClick={() => setConfirmId(null)} style={{ border: "none", background: "none", color: C.sub, fontSize: 11, cursor: "pointer" }}>Hủy</button></span>
            : <button onClick={() => setConfirmId(p.id)} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>)}
        </div>
      ))}
      {!locked && (
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Đầu năm)" style={{ flex: "2 1 130px", padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 12.5, minWidth: 0, fontFamily: font.body }} />
          <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 80px", padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 12.5, minWidth: 0, fontFamily: font.body }} />
          <button onClick={add} style={{ background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}>+ Thêm</button>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ search, onClear }) {
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

export function HSCardDetail({ r, locked, setRec, setKhoan, resetKhoan, resetAllKhoan, addPhuThuHS, delPhuThuHS, setPhieuId, setTab }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKhoan, setSheetKhoan] = useState(null);
  const [sheetVal, setSheetVal] = useState("");
  const [sheetLabel, setSheetLabel] = useState("");
  const [ptTen, setPtTen] = useState("");
  const [ptSo, setPtSo] = useState("");
  const [showPtInput, setShowPtInput] = useState(false);
  const [showChiTiet, setShowChiTiet] = useState(false);

  const openSheet = (k, label) => {
    setSheetKhoan(k);
    setSheetLabel(label || (k ? k.label : ""));
    setSheetVal(String(k ? (r.rec.khoan?.[k.key] ?? 0) : (r.rec.ngayAn || 0)));
    setSheetOpen(true);
  };

  const saveSheet = () => {
    if (sheetKhoan) {
      setKhoan(r.hs.id, sheetKhoan.key, Number(sheetVal) || 0);
    } else {
      setRec(r.hs.id, { ngayAn: Number(sheetVal) || 0, ngayAnManual: true });
    }
    setSheetOpen(false);
  };

  const addPT = () => {
    if (!ptTen.trim() || !ptSo) return;
    addPhuThuHS(r.hs.id, ptTen.trim(), Number(ptSo));
    setPtTen(""); setPtSo(""); setShowPtInput(false);
  };

  const tienAn = r.rec.khoan?.tienAn ?? 0;
  const giaAn = r.rec.ngayAn > 0 ? Math.round(tienAn / r.rec.ngayAn) : (r.lop?.tienAn || 0);

  return (
    <div className="fade-in" style={{ borderTop: `1px dashed ${C.line}`, background: "#FBFDFB", animation: "fadeIn .2s ease" }}>
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>Thực thu:</span>
          <NumInput value={r.rec.thucThu} onChange={(v) => setRec(r.hs.id, { thucThu: v })} w={140} disabled={locked} />
          {!locked && (r.rec.thucThu || 0) < r.tongPhaiThu && (
            <button onClick={() => setRec(r.hs.id, { thucThu: r.tongPhaiThu })} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Thu đủ</button>
          )}
          {!locked && (r.rec.thucThu || 0) >= r.tongPhaiThu && r.tongPhaiThu > 0 && (
            <span style={{ padding: "10px 14px", borderRadius: 10, background: C.greenSoft, color: C.green, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>✓ Đã thu đủ</span>
          )}
        </div>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
        <div onClick={() => !locked && openSheet(null, "Ngày ăn")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.line}`, cursor: locked ? "default" : "pointer" }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.ink, minWidth: 36, textAlign: "center" }}>{r.rec.ngayAn}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Ngày ăn</div>
            <div style={{ fontSize: 12, color: C.sub }}>{fmt(tienAn)} đ{r.rec.ngayAnManual && <span style={{ color: C.amber, marginLeft: 4 }}>· tay</span>}</div>
          </div>
          {!locked && <span style={{ fontSize: 16, color: C.sub }}>✏️</span>}
        </div>

        {r.hs.pl !== "GV" && r.hs.pl !== "T7" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Khoản phí</div>
              {!locked && r.ps.suaCount > 0 && (
                <button onClick={() => resetAllKhoan(r.hs.id)} style={{ fontSize: 11, color: C.pine, border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>↺ Khôi phục</button>
              )}
            </div>
            {KHOAN.filter((k) => k.key !== "tienAn").map((k) => {
              const val = r.rec.khoan?.[k.key] ?? 0;
              const def = r.rec.khoanDefault?.[k.key] ?? 0;
              const sua = val !== def;
              if (val === 0 && def === 0 && k.key !== "hocPhi") return null;
              return (
                <div key={k.key} onClick={() => !locked && openSheet(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.line}`, cursor: locked ? "default" : "pointer" }}>
                  <span style={{ flex: 1, fontSize: 14, color: sua ? C.amber : C.ink }}>{k.label}{sua && <span style={{ fontSize: 11, color: C.amber, marginLeft: 4 }}>· đã sửa</span>}</span>
                  <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink }}>{fmt(val)}</span>
                  {!locked && <span style={{ fontSize: 14, color: C.sub }}>✏️</span>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, whiteSpace: "nowrap" }}>Khoản riêng</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            {!locked && !showPtInput && (
              <button onClick={() => setShowPtInput(true)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>➕ Thêm</button>
            )}
          </div>
          {(r.rec.phuThu || []).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{p.ten}{p.lop && <span style={{ color: C.blueA, fontSize: 10 }}> (cả lớp)</span>}</span>
              <span style={{ fontWeight: 700 }}>{fmt(p.soTien)}</span>
              {!locked && (
                <button onClick={(e) => { e.stopPropagation(); delPhuThuHS(r.hs.id, p.id); }} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
              )}
            </div>
          ))}
          {(r.rec.phuThu || []).length === 0 && !showPtInput && <div style={{ fontSize: 12, color: C.gray, padding: "2px 0 4px" }}>Chưa có khoản riêng.</div>}
          {!locked && showPtInput && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <input value={ptTen} onChange={(e) => setPtTen(e.target.value)} placeholder="Tên khoản" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body }} />
              <input type="number" value={ptSo} onChange={(e) => setPtSo(e.target.value)} placeholder="Số tiền" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body }} />
              <button onClick={addPT} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Thêm</button>
              <button onClick={() => { setShowPtInput(false); setPtTen(""); setPtSo(""); }} style={{ background: "none", color: C.sub, fontWeight: 700, fontSize: 12, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.line}`, cursor: "pointer" }}>Hủy</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: C.card, border: `1px solid ${C.line}` }}>
          <div onClick={() => setShowChiTiet((v) => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Chi tiết</div>
            <span style={{ fontSize: 12, color: C.sub, transition: "transform .2s", transform: showChiTiet ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>
          {showChiTiet && (
            <div style={{ marginTop: 8 }}>
              {r.ps.dong.map(([l, v, sua], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: v < 0 ? C.green : C.ink }}>
                  <span style={{ color: C.sub }}>{l}{sua && <span style={{ color: C.amber }}> ⚠</span>}</span>
                  <span>{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: C.sub, marginTop: 4, borderTop: `1px dashed ${C.line}` }}>
                <span>Phát sinh tháng này</span><span>{fmt(r.ps.tong)}</span>
              </div>
              {r.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: r.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{r.noTruoc > 0 ? "+ Nợ tháng trước" : "− Dư tháng trước"}</span>
                  <span>{r.noTruoc > 0 ? fmt(r.noTruoc) : "−" + fmt(-r.noTruoc)}</span>
                </div>
              )}
            </div>
          )}
          {!showChiTiet && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: C.sub }}>
                <span>Phát sinh tháng này</span><span>{fmt(r.ps.tong)}</span>
              </div>
              {r.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: r.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{r.noTruoc > 0 ? "+ Nợ tháng trước" : "− Dư tháng trước"}</span>
                  <span>{r.noTruoc > 0 ? fmt(r.noTruoc) : "−" + fmt(-r.noTruoc)}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTop: `1.5px solid ${C.line}`, fontWeight: 800, fontSize: 16, fontFamily: font.display }}>
            <span>TỔNG PHẢI THU</span>
            <span>{fmt(r.tongPhaiThu)} đ</span>
          </div>
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: `1.5px solid ${C.line}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 5 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.sub }}>Phát sinh {fmt(r.ps.tong)} · Nợ cũ {fmt(r.noTruoc)}</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink }}>Tổng {fmt(r.tongPhaiThu)} đ</div>
        </div>
        <button onClick={() => { setPhieuId(r.hs.id); setTab("phieu"); }} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đến thu tiền →</button>
      </div>

      {sheetOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSheetOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,.4)" }} />
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 24px", boxShadow: "0 -4px 20px rgba(0,0,0,.15)" }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink, marginBottom: 14 }}>Sửa {sheetLabel}</div>
            {sheetKhoan && (<div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Mặc định: {fmt(r.rec.khoanDefault?.[sheetKhoan.key] ?? 0)}</div>)}
            {!sheetKhoan && (<div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Giá: {fmt(giaAn)} đ/ngày · Tự tính: {soNgayHoc(new Date().getFullYear(), new Date().getMonth()+1, {})} ngày</div>)}
            <input type="number" inputMode="numeric" autoFocus value={sheetVal} onChange={(e) => setSheetVal(e.target.value)} placeholder="0" style={{ width: "100%", padding: "14px 12px", borderRadius: 12, border: `1.5px solid ${C.pine}`, fontSize: 18, fontFamily: font.display, fontWeight: 700, color: C.ink, textAlign: "right", marginBottom: 14, outline: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSheetOpen(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>
              <button onClick={saveSheet} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Lưu</button>
            </div>
            {sheetKhoan && (<button onClick={() => { resetKhoan(r.hs.id, sheetKhoan.key); setSheetOpen(false); }} style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10, border: "none", background: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>↺ Khôi phục mặc định</button>)}
            {!sheetKhoan && (<button onClick={() => { setRec(r.hs.id, { ngayAnManual: false }); setSheetOpen(false); }} style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10, border: "none", background: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>↺ Trả về tự tính</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function LopFilterSheet({ open, onClose, chipsLop, lopFilter, setLopFilter, allRows }) {
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

export function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, openId, setOpenId, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide, onSelectStudent }) {
const [fastMode, setFastMode] = useState(false);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [thuSheetOpen, setThuSheetOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [showNgayAn, setShowNgayAn] = useState(false);
  const [thuLimit, setThuLimit] = useState(50);
  const inputRefs = useRef({});
  const { sentinelRef, shrunk } = useStickyShrink();

  const cnt = { chuaThu: 0, thieu: 0, xong: 0 };
  rows.forEach((r) => {
    if (r.ps.tong > 0 && (r.rec.thucThu || 0) === 0) cnt.chuaThu++;
    else if (r.conNo > 0) cnt.thieu++;
    else if ((r.rec.thucThu || 0) > 0 && r.conNo <= 0) cnt.xong++;
  });
  
  const batchThuDu = async (onlyNo) => {
    const pairs = rows.filter((r) => !onlyNo || r.conNo > 0).map((r) => ({ sid: r.hs.id, thucThu: r.tongPhaiThu }));
    if (pairs.length === 0) return;
    if (!(await ask(`Đánh "thu đủ" cho ${pairs.length} HS đang hiển thị?\nThao tác này ghi đè số đã thu của từng em.`, { okText: "Thu đủ" }))) return;
    thuDuNhieu(pairs);
    toast(onlyNo ? `Đã thu đủ ${pairs.length} HS còn nợ.` : `Đã thu đủ ${pairs.length} HS đang hiển thị.`);
  };
  
  const cfgItem = { width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 9, border: "none", background: "none", color: C.ink, fontWeight: 700, fontSize: 13.5, fontFamily: font.body, cursor: "pointer" };
  const selStyle = { padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.card, minWidth: 0, cursor: "pointer" };
  
  return (
    <>
      {(() => {
        const pct = tk.ps > 0 ? Math.min(100, Math.round(tk.thu / tk.ps * 100)) : 0;
        const soChuaThu = (tk.noList || []).filter((x) => x.chua).length;
        return (
          <Card style={{ marginBottom: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: C.sub }}>Phải thu (toàn trường)</span>
              <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.ink }}>{fmt(tk.ps)} đ</span>
            </div>
            <div style={{ height: 9, borderRadius: 99, background: C.line, overflow: "hidden", margin: "9px 0 5px" }}>
              <div style={{ width: pct + "%", height: "100%", background: pct >= 100 ? C.green : C.pine, borderRadius: 99, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 12.5, color: C.green, fontWeight: 700 }}>Đã thu {pct}% · {fmt(tk.thu)} đ</div>
            <div style={{ display: "flex", gap: 16, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.line}`, fontSize: 12.5 }}>
              <span style={{ color: tk.no > 0 ? C.coral : C.green, fontWeight: 700 }}>● Còn nợ: {fmt(tk.no)} đ</span>
              <button onClick={() => setThuFilter(thuFilter === "chuaThu" ? "all" : "chuaThu")} style={{ border: "none", background: "none", color: thuFilter === "chuaThu" ? C.pine : C.coral, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: thuFilter === "chuaThu" ? "underline" : "none" }}>● {soChuaThu} chưa thu</button>
            </div>
          </Card>
        );
      })()}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
      <SearchBar value={search} onChange={setSearch} />
      {isWide ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <select value={lopFilter} onChange={(e) => setLopFilter(e.target.value)} style={{ ...selStyle, flex: "1 1 110px" }}>
            {chipsLop.map(([id, ten]) => <option key={id} value={id}>{id === "all" ? "Tất cả lớp" : ten}</option>)}
          </select>
          <select value={thuFilter} onChange={(e) => setThuFilter(e.target.value)} style={{ ...selStyle, flex: "1 1 110px" }}>
            {[["all", "Mọi tình trạng"], ["chuaThu", "Chưa thu"], ["thieu", "Thiếu"], ["noCu", "Nợ cũ"], ["thuThua", "Thu thừa"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {!locked && !fastMode && (<button onClick={() => setCfgOpen((v) => !v)} style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: cfgOpen ? C.pine : C.pineSoft, color: cfgOpen ? "#fff" : C.pine }}>⚙️ Cấu hình</button>)}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => setLopSheetOpen(true)} style={{ ...selStyle, flex: "1 1 110px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lopFilter === "all" ? "Tất cả lớp" : getLop(lopFilter)?.ten}</span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
            <button onClick={() => setThuSheetOpen(true)} style={{ ...selStyle, flex: "1 1 110px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thuFilter === "all" ? "Mọi tình trạng" : thuFilter === "chuaThu" ? "Chưa thu" : thuFilter === "thieu" ? "Thiếu" : thuFilter === "noCu" ? "Nợ cũ" : thuFilter === "thuThua" ? "Thu thừa" : "Mọi tình trạng"}</span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
            {!locked && !fastMode && (<button onClick={() => setCfgOpen((v) => !v)} style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: cfgOpen ? C.pine : C.pineSoft, color: cfgOpen ? "#fff" : C.pine }}>⚙️ Cấu hình</button>)}
          </div>
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
      )}
      </StickyBar>
      {!locked && fastMode && (<button onClick={() => { setFastMode(false); }} style={{ width: "100%", marginBottom: 10, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: font.body, background: C.pine, color: "#fff" }}>⛔ Tắt chế độ Tích thu nhanh</button>)}
      {!locked && !fastMode && cfgOpen && (
        <Card style={{ marginBottom: 10, padding: 6 }}>
          <button onClick={() => setShowNgayAn((v) => !v)} style={{ ...cfgItem, color: showNgayAn ? C.pine : C.ink }}>🍽️ Áp ngày ăn hàng loạt {showNgayAn ? "▲" : "▼"}</button>
          {showNgayAn && <div style={{ padding: "2px 2px 6px" }}><NgayAnBar onApply={setNgayAnAll} rows={rows} /></div>}
          <button onClick={() => { setFastMode(true); setCfgOpen(false); }} style={cfgItem}>⚡ Bật chế độ Tích thu nhanh</button>
          {(() => { const soNo = rows.filter((r) => r.conNo > 0).length; return (
            <button onClick={() => { if (soNo > 0) { batchThuDu(true); setCfgOpen(false); } }} disabled={soNo === 0} style={{ ...cfgItem, color: soNo > 0 ? C.green : C.gray, cursor: soNo > 0 ? "pointer" : "default" }}>💵 Thu đủ {soNo} HS còn nợ đang hiển thị</button>
          ); })()}
        </Card>
      )}
      {locked && <LockNote />}
      {rows.length === 0 && <EmptyState search={search} onClear={() => { setSearch(""); setLopFilter("all"); setThuFilter("all"); }} />}
      {rows.slice(0, thuLimit).map((r) => {
        const open = openId === r.hs.id;
        if (fastMode) {
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
        }
        return (
          <div key={r.hs.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${open ? C.pine : C.line}`, marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => setOpenId(open ? null : r.hs.id)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: r.hs.nguoiThu === "B" ? C.violetBSoft : C.blueASoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 13, color: r.hs.nguoiThu === "B" ? C.violetB : C.blueA }}>{r.hs.nguoiThu}</div>
                {r.noTruoc > 0 && <div title="có nợ tháng trước" style={{ position: "absolute", top: -3, right: -3, width: 11, height: 11, borderRadius: 99, background: C.coral, border: "2px solid #fff" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{r.hs.ten}{r.ps.suaCount > 0 && <span title="có khoản đã sửa" style={{ color: C.amber, fontSize: 12 }}> ⚠</span>}</div>
                <div style={{ fontSize: 11.5, color: C.sub, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 1 }}><span>{r.lop?.ten}</span><PLBadge pl={r.hs.pl} />{r.nghi > 0 ? <span>· nghỉ {r.nghi}</span> : null}</div>
                {r.noTruoc !== 0 && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 1, color: r.noTruoc > 0 ? C.coral : C.green }}>{r.noTruoc > 0 ? `🔴 Nợ cũ ${fmt(r.noTruoc)}` : `🟢 Dư cũ ${fmt(-r.noTruoc)}`}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{fmt(r.tongPhaiThu)}</div><Badge s={r.st} /></div>
                <button onClick={(e) => { e.stopPropagation(); setPhieuId(r.hs.id); setTab("phieu"); }} title="Xem phiếu thu" style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", padding: 2 }}>🧾</button>
              </div>
            </div>
            {open && (<HSCardDetail r={r} locked={locked} setRec={setRec} setKhoan={setKhoan} resetKhoan={resetKhoan} resetAllKhoan={resetAllKhoan} addPhuThuHS={addPhuThuHS} delPhuThuHS={delPhuThuHS} setPhieuId={setPhieuId} setTab={setTab} />)}
          </div>
        );
      })}
      {rows.length > thuLimit && (<button onClick={() => setThuLimit((l) => l + 50)} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Hiện thêm 50 HS ({Math.min(thuLimit, rows.length)}/{rows.length})</button>)}
      <ThuNgoai mData={mData} upMData={upMData} locked={locked} />
      <KhoanThuLop mData={mData} upMData={upMData} locked={locked} classes={chipsLop.slice(1).map(([id, ten]) => ({ id, ten }))} rows={rows} lopFilter={lopFilter} />
    </>
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
