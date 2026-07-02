import { Logo } from "./Brand.jsx";
import { Icon } from "./Icon.jsx";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  C, font, fmt, ask, toast, logAction, uid,
  LOAI_CHI, ymKey, lopOfMonth, tinhPSFromRec,
  sGet, sList
} from "./lib.js";
import {
  Card, BottomSheet, NumInput, ABBtn, Badge
} from "./ui.jsx";
import { tinhThangFull, GD_META } from "./taichinh.js";
import { SoGiaoDichSheet } from "./SoGiaoDich.jsx";
import { BaoCaoSheet } from "./BaoCao.jsx";

function BlurNum({ value, onCommit, placeholder, style }) {
  const [v, setV] = useState(value == null ? "" : String(value));
  useEffect(() => { setV(value == null ? "" : String(value)); }, [value]);
  const commit = () => { const t = String(v).trim(); onCommit(t === "" ? null : Number(t) || 0); };
  return <input type="number" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} placeholder={placeholder} style={style} />;
}

export function Donut({ pct, color, size = 76 }) {
  const r = (size - 10) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const dash = circ * Math.min(100, pct) / 100;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={C.graySoft} strokeWidth={8} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill={C.ink} fontFamily={font.display}>{pct}%</text>
    </svg>
  );
}

export function DashTab({ tk, mData, upMData, month, year, locked, meta, allRows, delThang, students, ym, upMeta, setTab }) {
  const [openCards, setOpenCards] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("dashOpenCards") : null;
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { vanHanh: true, kd: true, tienMat: false, loiNhuan: false, lichSu: false, chiPhi: true };
  });
  const toggleCard = (key) => {
    setOpenCards((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("dashOpenCards", JSON.stringify(next));
      return next;
    });
  };
  const [showDelConfirm, setShowDelConfirm] = useState(false);
  const [delConfirmText, setDelConfirmText] = useState("");
  const [topNoLimit, setTopNoLimit] = useState(3);
  const [luyKe, setLuyKe] = useState(null);
  const [lichSu, setLichSu] = useState(null);
  const [sheetCB, setSheetCB] = useState(false);
  const [sheetCP, setSheetCP] = useState(false);
  const [sheetLN, setSheetLN] = useState(false);
  const [sheetLS, setSheetLS] = useState(false);
  const [openBrk, setOpenBrk] = useState(false);
  const [sheetGD, setSheetGD] = useState(false);
  const [sheetBC, setSheetBC] = useState(false);

  useEffect(() => {
    let huy = false;
    (async () => {
      const dk = meta?.soDuDauKy || {};
      const openA = dk.tienMatA || 0, openB = dk.tienMatB || 0;
      let giuA = openA, giuB = openB;
      let noNCC = 0;
      const bA = { open: openA, thu: 0, cIn: 0, cOut: 0, tra: 0, rut: 0 };
      const bB = { open: openB, thu: 0, cIn: 0, cOut: 0, tra: 0, rut: 0 };
      let tongLKT = 0, rutNhanA = 0, rutNhanB = 0, duocChiaCumA = 0, duocChiaCumB = 0;
      const tyA0 = meta?.tyLeLaiA ?? 50;
      const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).map((k) => k.replace("mn5:thang:", "")).filter((m) => m <= ym).sort();
      const ls = [];
      for (const m of keys) {
        const td = await sGet(`mn5:thang:${m}`); if (!td) continue;
        let t;
        if (td.daChot && td.snapTK) { t = td.snapTK; }
        else {
          const my = Number(m.slice(0, 4)), mmo = Number(m.slice(5));
          const pmo = mmo === 1 ? 12 : mmo - 1, pyy = mmo === 1 ? my - 1 : my;
          const ddPrevM = (await sGet(`mn5:dd:${ymKey(pyy, pmo)}`)) || {};
          t = tinhThangFull(td, m, students, meta, ddPrevM, tyA0);
        }
        rutNhanA += t.rutNhanA; rutNhanB += t.rutNhanB;
        noNCC += t.noNCCThang;
        const deltaA = t.thuA + t.cInA - t.cOutA - t.traA - t.rutA;
        const deltaB = t.thuB + t.cInB - t.cOutB - t.traB - t.rutB;
        giuA += deltaA; giuB += deltaB;
        bA.thu += t.thuA; bA.cIn += t.cInA; bA.cOut += t.cOutA; bA.tra += t.traA; bA.rut += t.rutA;
        bB.thu += t.thuB; bB.cIn += t.cInB; bB.cOut += t.cOutB; bB.tra += t.traB; bB.rut += t.rutB;
        const [yy, mm] = m.split("-");
        const thuNetA = t.thuA + t.cInA - t.cOutA, thuNetB = t.thuB + t.cInB - t.cOutB;
        const psThang = t.psA + t.psB, chiThang = t.chiA + t.chiB, thuThang = thuNetA + thuNetB, traThang = t.traA + t.traB;
        tongLKT += t.lkt;
        duocChiaCumA += t.dcA; duocChiaCumB += t.dcB;
        ls.push({ thang: `T${Number(mm)}/${yy}`, mm: Number(mm), yy: Number(yy), laiKeToan: t.lkt, laiA: t.dcA, laiB: t.dcB, laiTay: t.laiTay, laiTienMat: thuThang - traThang, psThang, chiThang, thuThang, traThang, noNCC, thuA: thuNetA, thuB: thuNetB, traA: t.traA, traB: t.traB, chiA: t.chiA, chiB: t.chiB, giuACum: giuA, giuBCum: giuB, deltaA, deltaB, tnPhai: t.tnPhai, tnThu: t.tnThu, noNCCThang: t.noNCCThang, daChot: !!td.daChot });
      }
      if (!huy) { setLuyKe({ giuA, giuB, noNCC, brkA: bA, brkB: bB, tongLKT, rutNhanA, rutNhanB, duocChiaCumA, duocChiaCumB }); setLichSu(ls); }
    })();
    return () => { huy = true; };
  }, [meta, students, ym, mData]);


  const cp = mData.chiPhi || [];
  const [nd, setNd] = useState(""); const [so, setSo] = useState(""); const [ng, setNg] = useState("A"); const [loai, setLoai] = useState("PHAT_SINH"); const [huong, setHuong] = useState("A->B"); const [truQuy, setTruQuy] = useState("A");
  const [showCoDinh, setShowCoDinh] = useState(true);
  const add = () => {
    if (loai === "TRA_NO") {
      if (!nd.trim()) return;
      if (!so || (Number(so) || 0) <= 0) { toast("Nhập số tiền trả"); return; }
      upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim(), soTien: 0, nguoiChi: ng, daTra: Number(so) || 0, loai: "TRA_NO", ts: Date.now() }] });
      logAction(`${ng} trả nợ NCC "${nd.trim()}" ${fmt(Number(so) || 0)}đ (T${ym})`);
      setNd(""); setSo(""); return;
    }
    if (loai === "RUT_LOI") {
      if (!so || (Number(so) || 0) <= 0) { toast("Nhập số tiền rút"); return; }
      upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim() || "Rút chia lãi", soTien: 0, nhan: ng, tuQuy: truQuy, daTra: Number(so) || 0, loai: "RUT_LOI", ts: Date.now() }] });
      logAction(`${ng} rút tiền chia lãi ${fmt(Number(so) || 0)}đ — trừ quỹ ${truQuy} (T${ym})`);
      setNd(""); setSo(""); return;
    }
    if (!so) return;
    if (loai === "CHUYEN") { upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim() || "Chuyển tiền", soTien: Number(so), loai: "CHUYEN", huong, daTra: 0, ts: Date.now() }] }); setNd(""); setSo(""); return; }
    if (loai === "HOAN_UNG") { const nhanLai = huong === "A->B" ? "B" : "A"; upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim() || "Hoàn ứng", soTien: Number(so), loai: "HOAN_UNG", huong, daTra: 0, ts: Date.now() }] }); logAction(`Hoàn ứng cho ${nhanLai} ${fmt(Number(so))}đ (T${ym})`); setNd(""); setSo(""); return; }
    if (!nd.trim()) return;
    const item = { id: uid(), noiDung: nd.trim(), soTien: Number(so), nguoiChi: ng, daTra: 0, loai, ts: Date.now() }; if (loai === "NO_AB") item.huong = huong;
    upMData({ ...mData, chiPhi: [...cp, item] }); setNd(""); setSo("");
  };
  const set = (id, p) => upMData({ ...mData, chiPhi: cp.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const del = (id) => upMData({ ...mData, chiPhi: cp.filter((c) => c.id !== id) });
  
  const traDuTatCa = async () => {
    const targets = cp.filter((c) => (c.loai === "CO_DINH" || c.loai === "PHAT_SINH") && (Number(c.soTien) || 0) > 0 && (Number(c.daTra) || 0) < (Number(c.soTien) || 0));
    if (targets.length === 0) { toast("Không còn khoản nào cần trả đủ."); return; }
    if (!(await ask(`Đánh "đã trả đủ" cho ${targets.length} khoản đang còn thiếu?\n(chỉ áp khoản Cố định + Phát sinh đã nhập số tiền)`, { okText: "Trả đủ hết" }))) return;
    const ids = new Set(targets.map((c) => c.id));
    upMData({ ...mData, chiPhi: cp.map((c) => ids.has(c.id) ? { ...c, daTra: Number(c.soTien) || 0 } : c) });
    logAction(`Trả đủ hàng loạt ${targets.length} khoản chi (T${ym})`);
    toast(`Đã đánh trả đủ ${targets.length} khoản.`);
  };
  const themCoDinhMau = () => {
    const co = ["Lương giáo viên", "Thực phẩm 1", "Thực phẩm 2", "Tiền điện", "Tiền nước"].filter((t) => !cp.some((c) => c.noiDung === t && c.loai === "CO_DINH"));
    if (!co.length) { setShowCoDinh((v) => !v); return; }
    upMData({ ...mData, chiPhi: [...cp, ...co.map((t) => ({ id: uid(), noiDung: t, soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 }))] });
    toast(`Đã thêm ${co.length} khoản cố định.`);
    setShowCoDinh(true);
  };
  const tongChi = tk.chiA + tk.chiB, tongTra = tk.traA + tk.traB;
  const lnKeToan = tk.ps - tongChi;
  const lnTienMat = tk.thu - tongTra;
  const tyLeA = meta?.tyLeLaiA ?? 50;
  const noAB = tk.noAB_AtoB - tk.noAB_BtoA;
  const noNCC = tongChi - tongTra;
  const tongTienMat = (luyKe ? luyKe.giuA + luyKe.giuB : (tk.A - tk.traA - (tk.rutA || 0)) + (tk.B - tk.traB - (tk.rutB || 0)));
  const tongLKTcum = luyKe?.tongLKT ?? lnKeToan;
  const laiTay = mData?.laiTay || null;
  const laiChiaA = laiTay ? (Number(laiTay.A) || 0) : Math.round(lnKeToan * tyLeA / 100);
  const laiChiaB = laiTay ? (Number(laiTay.B) || 0) : (lnKeToan - Math.round(lnKeToan * tyLeA / 100));
  const duocChiaA = luyKe?.duocChiaCumA ?? laiChiaA, duocChiaB = luyKe?.duocChiaCumB ?? laiChiaB;
  const _cpAll = mData?.chiPhi || [];
  const rutThangA = _cpAll.filter((c) => c.loai === "RUT_LOI" && (c.nhan || c.nguoiChi || "A") === "A").reduce((a, c) => a + (Number(c.daTra) || 0), 0);
  const rutThangB = _cpAll.filter((c) => c.loai === "RUT_LOI" && (c.nhan || c.nguoiChi || "A") === "B").reduce((a, c) => a + (Number(c.daTra) || 0), 0);
  const goiYRut = (p) => Math.max(0, (p === "A" ? laiChiaA : laiChiaB) - (p === "A" ? rutThangA : rutThangB));
  const daRutA = luyKe?.rutNhanA ?? 0, daRutB = luyKe?.rutNhanB ?? 0;
  const conNhanA = duocChiaA - daRutA, conNhanB = duocChiaB - daRutB;
  const noNCCcum = luyKe?.noNCC ?? noNCC;
  const coTheChia = tongTienMat - noNCCcum;
  const guiQuyA = luyKe?.giuA ?? (tk.A - tk.traA - (tk.rutA || 0));
  const guiQuyB = luyKe?.giuB ?? (tk.B - tk.traB - (tk.rutB || 0));


  const chotThang = async () => {
    const chuaThu = allRows.filter((r) => r.coRec && r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
    const ngayAn0 = allRows.filter((r) => r.coRec && r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;
    let cb = [];
    if (ngayAn0) cb.push(`• ${ngayAn0} HS có ngày ăn = 0`);
    if (chuaThu) cb.push(`• ${chuaThu} HS chưa thu`);
    const msg = `Chốt tháng ${month}/${year}?\n` + (cb.length ? "\nLưu ý:\n" + cb.join("\n") + "\n" : "") + "\nSau khi chốt sẽ khóa (mở lại được).";
    if (await ask(msg, { okText: "Chốt tháng" })) {
      const noLuyKe = {};
      allRows.forEach((r) => { if (r.coRec) noLuyKe[r.hs.id] = r.conNo; });
      const snapThuNgoai = (mData.thuNgoai || []).reduce((a, k) => a + ((Number(k.soTien) || 0) - (Number(k.thucThu) || 0)), 0);
      const snapNCC = (mData.chiPhi || []).reduce((a, c) => (c.loai === "CHUYEN" || c.loai === "NO_AB" || c.loai === "RUT_LOI" || c.loai === "HOAN_UNG") ? a : a + ((Number(c.soTien) || 0) - (Number(c.daTra) || 0)), 0);
      const [cy, cm] = ym.split("-").map(Number);
      const pmo = cm === 1 ? 12 : cm - 1, pyy = cm === 1 ? cy - 1 : cy;
      const ddPrevM = (await sGet(`mn5:dd:${ymKey(pyy, pmo)}`)) || {};
      const snapTK = tinhThangFull(mData, ym, students, meta, ddPrevM, meta?.tyLeLaiA ?? 50);
      await upMData({ ...mData, daChot: true, noLuyKe, snapThuNgoai, snapNCC, snapTK });
      logAction(`Chốt tháng ${month}/${year}`);
      toast("Đã chốt tháng.");
    }
  };
  const moChot = async () => { if (await ask("Mở khóa tháng đã chốt để chỉnh sửa lại?", { okText: "Mở khóa" })) { const { noLuyKe, snapThuNgoai, snapNCC, snapTK, ...rest } = mData; await upMData({ ...rest, daChot: false }); logAction(`Mở khóa tháng ${month}/${year}`); toast("Đã mở khóa."); } };

  const giuThangA = tk.A - tk.traA - (tk.rutA || 0), giuThangB = tk.B - tk.traB - (tk.rutB || 0);

  const CardHeader = ({ icon, title, cardKey, children }) => (
    <div onClick={() => toggleCard(cardKey)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 14px", borderBottom: openCards[cardKey] ? `1px solid ${C.line}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {children}
        <span style={{ fontSize: 14, color: C.sub, transition: "transform .2s", transform: openCards[cardKey] ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </div>
    </div>
  );

  const recRows0 = allRows.filter((r) => r.coRec);
  const dashTong = students.length;
  const dashDangHoc = students.filter((s) => s.trangThai === "Đang học").length;
  const canThuAll = recRows0.reduce((a, r) => a + r.tongPhaiThu, 0);
  const daThuAll = recRows0.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
  const tyLeThu = canThuAll > 0 ? Math.round(daThuAll / canThuAll * 100) : 100;
  const noRows = recRows0.filter((r) => r.conNo > 0);
  const conNoAll = noRows.reduce((a, r) => a + r.conNo, 0);
  const cpKhoan = cp.filter((c) => c.loai === "CO_DINH" || c.loai === "PHAT_SINH");
  const cpXong = (c) => (Number(c.soTien) || 0) > 0 && (Number(c.daTra) || 0) >= (Number(c.soTien) || 0);
  const cpDone = cpKhoan.filter(cpXong);
  const cpChua = cpKhoan.filter((c) => !cpXong(c));
  const cpPct = cpKhoan.length > 0 ? Math.round(cpDone.length / cpKhoan.length * 100) : 0;
  const cbGroups = [
    ["Học phí/khoản sửa tay", recRows0.filter((r) => r.ps.suaCount > 0), C.amber],
    ["Thu thừa", recRows0.filter((r) => r.conNo < 0), C.blueA],
    ["Ngày ăn = 0", recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0), C.coral],
  ].filter((g) => g[1].length > 0);
  const sheetTitle = { fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: C.ink, margin: "14px 0 8px" };
  const drillBtn = { background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer" };
  const brkRow = (label, va, vb, neg, hideZero) => (hideZero && !va && !vb) ? null : (
    <div style={{ display: "flex", fontSize: 12, padding: "5px 10px", borderTop: `1px solid ${C.line}` }}>
      <span style={{ flex: 1.5, color: C.sub }}>{label}</span>
      <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>{neg ? "−" : "+"}{fmt(va)}</span>
      <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>{neg ? "−" : "+"}{fmt(vb)}</span>
    </div>
  );

  return (
    <>
      <Card style={{ marginBottom: 12, boxShadow: "0 3px 12px -8px rgba(23,107,91,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon name="barChart" size={16} color={C.pine} />
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink }}>Tổng quan vận hành — T{month}/{year}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Donut pct={tyLeThu} color={tyLeThu >= 80 ? C.green : tyLeThu >= 50 ? C.amber : C.coral} size={66} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 18, marginBottom: 8 }}>
              <div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: C.ink }}>{dashTong}</div><div style={{ fontSize: 10.5, color: C.sub }}>Tổng HS</div></div>
              <div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: C.green }}>{dashDangHoc}</div><div style={{ fontSize: 10.5, color: C.sub }}>Đang học</div></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "1px 0" }}><span style={{ color: C.sub }}>Cần thu</span><b>{fmt(canThuAll)}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "1px 0" }}><span style={{ color: C.sub }}>Đã thu ({tyLeThu}%)</span><b style={{ color: C.green }}>{fmt(daThuAll)}</b></div>
          </div>
        </div>
        {noRows.length > 0 && (
          <button onClick={() => setTab && setTab("no")} style={{ width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 9, border: `1px solid ${C.line}`, background: C.coralSoft, color: C.coral, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{width:7,height:7,borderRadius:99,background:C.coral,flexShrink:0}} /> {noRows.length} HS còn nợ — {fmt(conNoAll)} đ ❯</span></button>
        )}
      </Card>

      {cbGroups.length > 0 && (
        <button onClick={() => setSheetCB(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.amberSoft, color: C.amber, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="alertTriangle" size={14} color={C.coral} /> Cảnh báo: {cbGroups.map((g) => `${g[0]} (${g[1].length})`).join(" · ")}</span>
          <span style={{ flexShrink: 0, fontWeight: 700 }}>❯</span>
        </button>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="banknote" size={16} color={C.coral} /><span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>Chi phí tháng {month}</span></div>
          <span style={{ fontSize: 12, color: C.sub }}>Tổng chi: <b style={{ color: C.ink }}>{fmt(tongChi)}</b></span>
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="barChart" size={13} color={C.sub} /> {cpDone.length}/{cpKhoan.length} khoản đã xử lý</div>
        <div style={{ height: 8, borderRadius: 99, background: C.line, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ width: cpPct + "%", height: "100%", background: cpPct >= 100 ? C.green : C.pine, borderRadius: 99, transition: "width .3s" }} />
        </div>
        {cpChua.slice(0, 2).map((c) => (
          <div key={c.id} style={{ fontSize: 13, color: C.ink, padding: "3px 0", display:"inline-flex", alignItems:"center", gap:6 }}><span style={{width:7,height:7,borderRadius:99,background:C.coral,flexShrink:0}} /> {c.noiDung}: <span style={{ color: C.coral, fontWeight: 600 }}>{(Number(c.daTra) || 0) > 0 ? "Trả 1 phần" : "Chưa trả"}</span></div>
        ))}
        {cpKhoan.length > 0 && cpChua.length === 0 && <div style={{ fontSize: 13, color: C.green, fontWeight: 600, padding: "3px 0" }}>✓ Đã xử lý hết các khoản chi</div>}
        {cpKhoan.length === 0 && <div style={{ fontSize: 13, color: C.sub, padding: "3px 0" }}>Chưa có khoản chi nào — bấm Quản lý để thêm.</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => setSheetCP(true)} style={drillBtn}>Quản lý ❯</button>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, background: C.greenSoft, borderColor: C.line }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Icon name="trendingUp" size={16} color={C.pine} /><span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>Lợi nhuận & chia quỹ</span></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.green, fontWeight: 600 }}>LN kế toán</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: lnKeToan < 0 ? C.coral : C.green }}>{fmt(lnKeToan)}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.blueA, fontWeight: 600 }}>LN tiền mặt</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: lnTienMat < 0 ? C.coral : C.blueA }}>{fmt(lnTienMat)}</div></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.blueA, fontWeight: 600 }}>Quỹ A giữ</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: (luyKe?.giuA ?? 0) < 0 ? C.coral : C.blueA }}>{luyKe ? fmt(luyKe.giuA) : "…"}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.violetB, fontWeight: 600 }}>Quỹ B giữ</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: (luyKe?.giuB ?? 0) < 0 ? C.coral : C.violetB }}>{luyKe ? fmt(luyKe.giuB) : "…"}</div></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>Tiền mặt</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: tongTienMat < 0 ? C.coral : C.ink }}>{luyKe ? fmt(tongTienMat) : "…"}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10, color: C.amber, fontWeight: 600 }}>Nợ NCC</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: noNCCcum > 0 ? C.amber : C.ink }}>{luyKe ? fmt(noNCCcum) : "…"}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.pineSoft, borderRadius: 10 }}><div style={{ fontSize: 10, color: C.pine, fontWeight: 600 }}>Có thể chia</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: coTheChia < 0 ? C.coral : C.pine }}>{luyKe ? fmt(coTheChia) : "…"}</div></div>
        </div>
        {luyKe && (guiQuyA < 0 || guiQuyB < 0) && (
          <div style={{ marginTop: 8, fontSize: 11.5, color: C.coral, background: C.coralSoft, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <Icon name="alertTriangle" size={13} color={C.coral} />
            {guiQuyA < 0 && <span>Trường đang nợ <b>A</b> (ứng/chi hộ): <b>{fmt(-guiQuyA)}</b>đ</span>}
            {guiQuyA < 0 && guiQuyB < 0 && <span>·</span>}
            {guiQuyB < 0 && <span>Trường đang nợ <b>B</b>: <b>{fmt(-guiQuyB)}</b>đ</span>}
          </div>
        )}
        {luyKe && (conNhanA !== 0 || conNhanB !== 0 || daRutA !== 0 || daRutB !== 0) && (
          <div style={{ marginTop: 8, fontSize: 11.5, color: C.sub, textAlign: "center" }}>Lãi còn được nhận — A: <b style={{ color: conNhanA < 0 ? C.coral : C.blueA }}>{fmt(conNhanA)}</b> · B: <b style={{ color: conNhanB < 0 ? C.coral : C.violetB }}>{fmt(conNhanB)}</b></div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => setSheetLN(true)} style={drillBtn}>Chi tiết ❯</button>
        </div>
      </Card>

      <button onClick={() => setSheetLS(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="trendingUp" size={15} color={C.pine} /> Lịch sử các tháng trước</span><span style={{ color: C.sub, fontWeight: 700 }}>❯</span>
      </button>

      <button onClick={() => setSheetGD(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="receipt" size={15} color={C.pine} /> Sổ giao dịch tiền</span><span style={{ color: C.sub, fontWeight: 700 }}>❯</span>
      </button>

      <button onClick={() => setSheetBC(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="barChart" size={15} color={C.pine} /> Báo cáo & biểu đồ</span><span style={{ color: C.sub, fontWeight: 700 }}>❯</span>
      </button>

      {!locked
        ? <button onClick={chotThang} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.gold}`, background: C.goldSoft, color: C.amber, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="lock" size={15} color="#7A5E12" /> Chốt tháng {month}/{year}</span></button>
        : <button onClick={moChot} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="unlock" size={15} color={C.sub} /> Mở khóa tháng {month}/{year}</span></button>}
      {!locked && (
        <div style={{ marginTop: 8 }}>
          {!showDelConfirm ? (
            <button onClick={() => setShowDelConfirm(true)} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.coralSoft}`, background: C.card, color: C.coral, fontFamily: font.body, fontWeight: 600, fontSize: 13, cursor: "pointer" }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="trash" size={14} color={C.coral} /> Xóa bảng thu tháng này (tạo lại)</span></button>
          ) : (
            <div style={{ background: C.coralSoft, borderRadius: 12, padding: 12, border: `1.5px solid ${C.coral}` }}>
              <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, marginBottom: 8, display:"flex", alignItems:"center", gap:6 }}><Icon name="alertTriangle" size={14} color={C.coral} /> Nhập "XOA" để xác nhận xóa bảng thu tháng {month}/{year}</div>
              <input value={delConfirmText} onChange={(e) => setDelConfirmText(e.target.value)} placeholder="Nhập XOA" style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 14, marginBottom: 8, textAlign: "center", fontWeight: 700, textTransform: "uppercase" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowDelConfirm(false); setDelConfirmText(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Hủy</button>
                <button onClick={() => { if (delConfirmText.trim().toUpperCase() === "XOA") { delThang(); setShowDelConfirm(false); setDelConfirmText(""); } else { toast("Nhập sai — gõ XOA để xác nhận"); } }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: delConfirmText.trim().toUpperCase() === "XOA" ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 13, cursor: delConfirmText.trim().toUpperCase() === "XOA" ? "pointer" : "default" }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="trash" size={14} color={delConfirmText.trim().toUpperCase() === "XOA" ? "#fff" : C.sub} /> Xóa</span></button>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomSheet open={sheetCB} onClose={() => setSheetCB(false)} title={`Cảnh báo bất thường — T${month}/${year}`}>
        {cbGroups.length === 0 ? <div style={{ color: C.green, fontSize: 14, padding: 10 }}>✓ Không có bất thường.</div> : cbGroups.map((g) => (
          <div key={g[0]} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: g[2], marginBottom: 4 }}>{g[0]} ({g[1].length})</div>
            {g[1].map((r) => (
              <div key={r.hs.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
                <span>{r.hs.ten} <span style={{ color: C.sub, fontSize: 11 }}>· {r.lop?.ten}</span></span>
              </div>
            ))}
          </div>
        ))}
      </BottomSheet>

      <BottomSheet open={sheetCP} onClose={() => setSheetCP(false)} title={`Chi tiết chi phí — T${month}/${year}`}>
        <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: C.sub, marginBottom: 10, flexWrap: "wrap" }}>
          <span>Tổng chi <b style={{ color: C.ink }}>{fmt(tongChi)}</b></span>
          <span>Đã trả <b style={{ color: C.green }}>{fmt(tongTra)}</b></span>
          <span>Nợ NCC <b style={{ color: noNCC > 0 ? C.coral : C.green }}>{fmt(noNCC)}</b></span>
          {!locked && <button onClick={themCoDinhMau} style={{ marginLeft: "auto", background: C.pineSoft, color: C.pine, border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{cp.filter((c) => c.loai === "CO_DINH").length === 5 ? (showCoDinh ? "Ẩn" : "Hiện") + " 5 cố định" : "+ 5 khoản cố định"}</button>}
        </div>
        {!locked && (
          <button onClick={traDuTatCa} style={{ width: "100%", marginBottom: 10, padding: "9px 0", borderRadius: 9, border: `1.5px solid ${C.green}`, background: C.greenSoft, color: C.green, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>✓ Trả đủ tất cả khoản còn thiếu</button>
        )}
        {cp.map((c) => {
          const e = Number(c.soTien) || 0, k = Number(c.daTra) || 0; const isNoAB = c.loai === "NO_AB"; const isCT = c.loai === "CHUYEN";
          if (c.loai === "CO_DINH" && !showCoDinh) return null;
          if (c.loai === "TRA_NO") return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="coins" size={15} color={C.amber} /> Trả nợ NCC · <b style={{ color: c.nguoiChi === "A" ? C.blueA : C.violetB }}>[{c.nguoiChi}]</b> {c.noiDung} · {fmt(k)} đ</div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={15} color={C.coral} /></button>}
            </div>
          );
          if (c.loai === "RUT_LOI") { const ben = c.nhan || c.nguoiChi || "A"; const src = c.tuQuy || "A"; return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, display:"inline-flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><Icon name="banknote" size={15} color={C.violetB} /> Rút lãi <b style={{ color: ben === "A" ? C.blueA : C.violetB }}>[{ben}]</b> {c.noiDung} · <span style={{ fontSize: 11.5, color: C.sub }}>trừ quỹ {src}</span> · <b style={{ color: C.coral }}>−{fmt(k)} đ</b></div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={15} color={C.coral} /></button>}
            </div>
          ); }
          if (isCT) return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="arrowRightLeft" size={15} color={C.blueA} /> Chuyển tiền <b style={{ color: c.huong === "A->B" ? C.blueA : C.violetB }}>{c.huong === "A->B" ? "A → B" : "B → A"}</b> · {fmt(e)} đ</div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={15} color={C.coral} /></button>}
            </div>
          );
          if (c.loai === "HOAN_UNG") { const nhanLai = c.huong === "A->B" ? "B" : "A"; return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="refresh" size={15} color={C.green} /> Hoàn ứng cho <b style={{ color: nhanLai === "A" ? C.blueA : C.violetB }}>[{nhanLai}]</b> {c.noiDung && c.noiDung !== "Hoàn ứng" ? `· ${c.noiDung}` : ""} · <b style={{ color: C.green }}>{fmt(e)} đ</b></div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={15} color={C.coral} /></button>}
            </div>
          ); }
          const st = k === 0 ? { t: "Chưa trả", c: C.coral, bg: C.coralSoft } : k < e ? { t: "Trả 1 phần", c: C.amber, bg: C.amberSoft } : { t: "Đã trả", c: C.green, bg: C.greenSoft };
          return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{!isNoAB && <span style={{ color: c.nguoiChi === "A" ? C.blueA : C.violetB, fontWeight: 800 }}>[{c.nguoiChi}]</span>} {c.noiDung}{isNoAB && <span style={{ color: C.gold, fontSize: 11, fontWeight: 700 }}> · NỢ {c.huong}</span>}{c.loai === "CO_DINH" && <span style={{ color: C.sub, fontSize: 11 }}> · cố định</span>}</div>
                <Badge s={st} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: C.sub }}>
                  <span style={{ minWidth: 52 }}>Phải trả</span>
                  {c.loai === "CO_DINH" && !locked
                    ? (<><NumInput value={c.soTien} onChange={(v) => set(c.id, { soTien: v })} w={120} /><ABBtn val={c.nguoiChi} set={(p) => set(c.id, { nguoiChi: p })} small disabled={locked} /></>)
                    : (<b style={{ color: C.ink }}>{fmt(e)}</b>)}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: C.sub }}>
                  <span style={{ minWidth: 52 }}>Đã trả</span>
                  <NumInput value={c.daTra} onChange={(v) => set(c.id, { daTra: v })} w={120} disabled={locked} />
                  {!locked && <button onClick={() => set(c.id, { daTra: e })} style={{ background: C.greenSoft, color: C.green, fontWeight: 700, fontSize: 12, padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer" }}>Trả đủ</button>}
                  {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", marginLeft: "auto", padding: 4 }}><Icon name="trash" size={15} color={C.coral} /></button>}
                </div>
                {k > e && <div style={{ fontSize: 11.5, color: C.amber, background: C.amberSoft, borderRadius: 7, padding: "4px 8px", display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="alertTriangle" size={12} color={C.amber} /> Đã trả nhiều hơn phải trả {fmt(k - e)} đ</div>}
              </div>
            </div>
          );
        })}
        {!locked && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              <input value={nd} onChange={(e) => setNd(e.target.value)} placeholder={loai === "TRA_NO" ? "Tên nợ (VD: Thực phẩm T4)" : loai === "RUT_LOI" ? "Ghi chú (VD: rút đợt 1)" : loai === "HOAN_UNG" ? "Ghi chú (tuỳ chọn)" : "Khoản chi"} style={{ flex: "2 1 150px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
              <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <select value={loai} onChange={(e) => { setLoai(e.target.value); if (e.target.value === "RUT_LOI") setSo(String(goiYRut(ng))); }} style={{ padding: "8px 8px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 12.5, fontFamily: font.body, background: C.card }}>{LOAI_CHI.map((l) => <option key={l} value={l}>{GD_META[l]?.label || l}</option>)}</select>
              {(loai === "NO_AB" || loai === "CHUYEN" || loai === "HOAN_UNG")
                ? <select value={huong} onChange={(e) => setHuong(e.target.value)} style={{ padding: "8px 8px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 12.5, fontFamily: font.body, background: C.card }}><option value="A->B">{loai === "HOAN_UNG" ? "Trả cho B" : "A → B"}</option><option value="B->A">{loai === "HOAN_UNG" ? "Trả cho A" : "B → A"}</option></select>
                : loai === "RUT_LOI"
                  ? (<><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>Lãi của</span><ABBtn val={ng} set={(v) => { setNg(v); setSo(String(goiYRut(v))); }} small /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>Trừ quỹ</span><ABBtn val={truQuy} set={setTruQuy} small /></>)
                  : <ABBtn val={ng} set={setNg} small />}
              <button onClick={() => { if (loai === "TRA_NO" && !nd.trim()) { toast("Nhập tên nợ cần trả"); return; } add(); }} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", marginLeft: "auto" }}>+ Thêm</button>
            </div>
            {loai === "RUT_LOI" && (
              <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>💡 Lãi tháng này còn rút được — A: <b style={{ color: C.blueA }}>{fmt(goiYRut("A"))}</b> · B: <b style={{ color: C.violetB }}>{fmt(goiYRut("B"))}</b> (số đã điền sẵn, sửa được)</div>
            )}
          </div>
        )}
        {locked && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 10, textAlign: "center", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><Icon name="lock" size={13} color={C.sub} /> Tháng đã chốt — chỉ xem.</div>}
        <button onClick={() => setSheetCP(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Hoàn thành</button>
      </BottomSheet>

      <BottomSheet open={sheetLN} onClose={() => setSheetLN(false)} title={`Lợi nhuận & chia quỹ — T${month}/${year}`}>
        <div style={{ background: C.graySoft, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="receipt" size={13} color={C.sub} /> Doanh thu (thực thu)</span>
            <b style={{ fontFamily: font.display, fontSize: 17, color: C.ink }}>{fmt(tk.thu)} đ</b>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12.5 }}>
            <span style={{ flex: 1 }}>A thu: <b style={{ color: C.blueA }}>{fmt(tk.A)}</b></span>
            <span style={{ flex: 1 }}>B thu: <b style={{ color: C.violetB }}>{fmt(tk.B)}</b></span>
          </div>
        </div>
        <div style={{ background: C.graySoft, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="banknote" size={13} color={C.coral} /> Đã chi (tiền mặt ra)</span>
            <b style={{ fontFamily: font.display, fontSize: 17, color: C.ink }}>{fmt(tongTra)} đ</b>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12.5 }}>
            <span style={{ flex: 1 }}>A chi: <b style={{ color: C.blueA }}>{fmt(tk.traA)}</b></span>
            <span style={{ flex: 1 }}>B chi: <b style={{ color: C.violetB }}>{fmt(tk.traB)}</b></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "9px 4px", background: C.greenSoft, borderRadius: 10 }}><div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>LN kế toán</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: lnKeToan < 0 ? C.coral : C.green }}>{fmt(lnKeToan)}</div><div style={{ fontSize: 9.5, color: C.sub }}>Phải thu − Chi phí</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "9px 4px", background: C.blueASoft, borderRadius: 10 }}><div style={{ fontSize: 11, color: C.blueA, fontWeight: 600 }}>LN tiền mặt</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: lnTienMat < 0 ? C.coral : C.blueA }}>{fmt(lnTienMat)}</div><div style={{ fontSize: 9.5, color: C.sub }}>Đã thu − Đã trả</div></div>
        </div>

        <div style={{...sheetTitle, display:"flex", alignItems:"center", gap:8}}><Icon name="pieChart" size={17} color={C.pine} /> Phân chia tài chính T{month}</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Tổng LN kế toán toàn trường: <b style={{ color: lnKeToan < 0 ? C.coral : C.green, fontSize: 14 }}>{fmt(lnKeToan)} đ</b></div>
        {!locked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: C.goldSoft, borderRadius: 10, padding: "8px 10px" }}>
            <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>Tỷ lệ chia</span>
            <button onClick={() => upMeta({ ...meta, tyLeLaiA: Math.max(0, tyLeA - 5) })} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 800, fontSize: 17, cursor: "pointer", lineHeight: 1 }}>−</button>
            <span style={{ minWidth: 92, textAlign: "center", fontSize: 13, fontWeight: 700 }}>A {tyLeA}% / B {100 - tyLeA}%</span>
            <button onClick={() => upMeta({ ...meta, tyLeLaiA: Math.min(100, tyLeA + 5) })} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 800, fontSize: 17, cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>
        )}
        {!locked && (laiTay ? (
          <div style={{ marginBottom: 10, background: C.blueASoft, borderRadius: 10, padding: "9px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.blueA, fontWeight: 700 }}>✎ Lãi nhập tay (tháng này)</span>
              <button onClick={() => { const m2 = { ...mData }; delete m2.laiTay; upMData(m2); }} style={{ fontSize: 11, color: C.coral, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>↺ Tự động lại</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, color: C.blueA, marginBottom: 2, fontWeight: 600 }}>Lãi A</div><BlurNum value={laiTay.A} onCommit={(n) => upMData({ ...mData, laiTay: { ...laiTay, A: n ?? 0 } })} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, boxSizing: "border-box" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, color: C.violetB, marginBottom: 2, fontWeight: 600 }}>Lãi B</div><BlurNum value={laiTay.B} onCommit={(n) => upMData({ ...mData, laiTay: { ...laiTay, B: n ?? 0 } })} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, boxSizing: "border-box" }} /></div>
            </div>
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 5 }}>Tỷ lệ % không áp dụng cho tháng này. Tổng nên = LN kế toán ({fmt(lnKeToan)}).</div>
          </div>
        ) : (
          <button onClick={() => upMData({ ...mData, laiTay: { A: Math.round(lnKeToan * tyLeA / 100), B: lnKeToan - Math.round(lnKeToan * tyLeA / 100) } })} style={{ marginBottom: 10, fontSize: 12, color: C.blueA, background: C.blueASoft, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}>✎ Nhập tay lãi A/B tháng này</button>
        ))}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ display: "flex", background: C.graySoft, fontSize: 11.5, color: C.sub, fontWeight: 700, padding: "7px 10px" }}>
            <span style={{ flex: 1.5 }}>Nội dung</span>
            <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Người A</span>
            <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Người B</span>
          </div>
          <div style={{ display: "flex", fontSize: 12.5, padding: "8px 10px", borderTop: `1px solid ${C.line}` }}>
            <span style={{ flex: 1.5, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="coins" size={14} color={C.amber} /> Lãi được chia{laiTay ? <span style={{ fontSize: 10, color: C.blueA, fontWeight: 700 }}> ✎ tay</span> : null}</span>
            <b style={{ flex: 1, textAlign: "right", color: C.blueA }}>{fmt(laiChiaA)}</b>
            <b style={{ flex: 1, textAlign: "right", color: C.violetB }}>{fmt(laiChiaB)}</b>
          </div>
          <div style={{ display: "flex", fontSize: 12.5, padding: "8px 10px", borderTop: `1px solid ${C.line}` }}>
            <div style={{ flex: 1.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="landmark" size={14} color={C.pine} /> Quỹ trường đang giữ</span><div style={{ fontSize: 10, color: C.sub }}>(lũy kế đến hết tháng)</div></div>
            <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: (luyKe?.giuA ?? 0) < 0 ? C.coral : C.blueA }}>{luyKe ? fmt(luyKe.giuA) : "…"}</b><div style={{ fontSize: 10, color: giuThangA < 0 ? C.coral : C.sub }}>T{month}: {fmt(giuThangA)}</div></div>
            <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: (luyKe?.giuB ?? 0) < 0 ? C.coral : C.violetB }}>{luyKe ? fmt(luyKe.giuB) : "…"}</b><div style={{ fontSize: 10, color: giuThangB < 0 ? C.coral : C.sub }}>T{month}: {fmt(giuThangB)}</div></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 2 }}><span style={{ color: C.sub }}>Tổng quỹ trường đang giữ</span><b style={{ color: tongTienMat < 0 ? C.coral : C.pine }}>{fmt(tongTienMat)} đ</b></div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>Quỹ âm = A/B đang ứng tiền túi, trường nợ lại.</div>
        {luyKe && (guiQuyA < 0 || guiQuyB < 0) && (
          <div style={{ marginTop: 6, fontSize: 12, color: C.coral, background: C.coralSoft, borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Icon name="alertTriangle" size={14} color={C.coral} />
            {guiQuyA < 0 && <span>Trường đang nợ <b>A</b> (ứng/chi hộ): <b>{fmt(-guiQuyA)}</b>đ</span>}
            {guiQuyA < 0 && guiQuyB < 0 && <span>·</span>}
            {guiQuyB < 0 && <span>Trường đang nợ <b>B</b>: <b>{fmt(-guiQuyB)}</b>đ</span>}
            <span style={{ width: "100%", fontSize: 10.5, color: C.sub }}>→ Trả lại bằng nghiệp vụ "↩️ Hoàn ứng", không phải "Rút lãi".</span>
          </div>
        )}

        {luyKe && luyKe.brkA && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setOpenBrk((v) => !v)} style={{ background: "none", border: "none", color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "4px 0", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="helpCircle" size={14} color={C.pine} /> Vì sao quỹ có số này? {openBrk ? "▾" : "▸"}
            </button>
            {openBrk && (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", marginTop: 4 }}>
                <div style={{ display: "flex", background: C.graySoft, fontSize: 11.5, color: C.sub, fontWeight: 700, padding: "6px 10px" }}>
                  <span style={{ flex: 1.5 }}>Lũy kế từ đầu</span>
                  <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Tiền A giữ</span>
                  <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Tiền B giữ</span>
                </div>
                {brkRow("Số dư đầu kỳ", luyKe.brkA.open, luyKe.brkB.open, false)}
                {brkRow("Thu (học phí + ngoài)", luyKe.brkA.thu, luyKe.brkB.thu, false)}
                {brkRow("Nhận chuyển từ người kia", luyKe.brkA.cIn, luyKe.brkB.cIn, false, true)}
                {brkRow("Đã chi / trả NCC", luyKe.brkA.tra, luyKe.brkB.tra, true)}
                {brkRow("Chuyển sang người kia", luyKe.brkA.cOut, luyKe.brkB.cOut, true, true)}
                {brkRow("Đã trả lãi (rút ra)", luyKe.brkA.rut, luyKe.brkB.rut, true, true)}
                <div style={{ display: "flex", fontSize: 12.5, padding: "7px 10px", borderTop: `2px solid ${C.line}`, background: C.greenSoft, fontWeight: 800 }}>
                  <span style={{ flex: 1.5, color: C.ink }}>= Đang giữ</span>
                  <span style={{ flex: 1, textAlign: "right", color: luyKe.giuA < 0 ? C.coral : C.blueA }}>{fmt(luyKe.giuA)}</span>
                  <span style={{ flex: 1, textAlign: "right", color: luyKe.giuB < 0 ? C.coral : C.violetB }}>{fmt(luyKe.giuB)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {luyKe && (
          <>
            <div style={{...sheetTitle, display:"flex", alignItems:"center", gap:8}}><Icon name="coins" size={17} color={C.amber} /> Lãi & rút lãi (lũy kế)</div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", background: C.graySoft, fontSize: 11.5, color: C.sub, fontWeight: 700, padding: "7px 10px" }}>
                <span style={{ flex: 1.5 }}>Nội dung</span>
                <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Người A</span>
                <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Người B</span>
              </div>
              <div style={{ display: "flex", fontSize: 12.5, padding: "7px 10px", borderTop: `1px solid ${C.line}` }}>
                <span style={{ flex: 1.5, color: C.sub }}>Được chia</span>
                <b style={{ flex: 1, textAlign: "right", color: C.blueA }}>{fmt(duocChiaA)}</b>
                <b style={{ flex: 1, textAlign: "right", color: C.violetB }}>{fmt(duocChiaB)}</b>
              </div>
              <div style={{ display: "flex", fontSize: 12.5, padding: "7px 10px", borderTop: `1px solid ${C.line}` }}>
                <span style={{ flex: 1.5, color: C.sub }}>Đã rút</span>
                <span style={{ flex: 1, textAlign: "right", color: C.sub }}>−{fmt(daRutA)}</span>
                <span style={{ flex: 1, textAlign: "right", color: C.sub }}>−{fmt(daRutB)}</span>
              </div>
              <div style={{ display: "flex", fontSize: 12.5, padding: "8px 10px", borderTop: `2px solid ${C.line}`, background: C.greenSoft, fontWeight: 800 }}>
                <span style={{ flex: 1.5, color: C.ink }}>Còn được nhận</span>
                <span style={{ flex: 1, textAlign: "right", color: conNhanA < 0 ? C.coral : C.blueA }}>{fmt(conNhanA)}</span>
                <span style={{ flex: 1, textAlign: "right", color: conNhanB < 0 ? C.coral : C.violetB }}>{fmt(conNhanB)}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, background: C.pineSoft, borderRadius: 10, padding: "9px 12px" }}>
              <span style={{ fontSize: 12.5, color: C.pine, fontWeight: 700 }}>💰 Tiền có thể chia ngay</span>
              <b style={{ fontFamily: font.display, fontSize: 16, color: coTheChia < 0 ? C.coral : C.pine }}>{fmt(coTheChia)} đ</b>
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>= Tiền mặt {fmt(tongTienMat)} − Nợ NCC {fmt(noNCCcum)}. <i>"Được chia" là lãi trên giấy (gồm cả tiền HS chưa thu); chỉ rút được tối đa bằng "có thể chia".</i></div>
          </>
        )}

        {!locked && (
          <>
            <div style={{ ...sheetTitle, display: "flex", alignItems: "center", gap: 8 }}><Icon name="banknote" size={17} color={C.pine} /> Kiểm tiền cuối tháng</div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}><span style={{ color: C.sub }}>Theo app (quỹ hiện có)</span><b style={{ color: C.ink }}>{fmt(tongTienMat)} đ</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 7 }}>
                <span style={{ color: C.sub }}>Đếm tiền thật</span>
                <BlurNum value={mData?.demThat ?? null} onCommit={(n) => { const m2 = { ...mData }; if (n == null) delete m2.demThat; else m2.demThat = n; upMData(m2); }} placeholder="Nhập số đếm" style={{ width: 150, textAlign: "right", padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, boxSizing: "border-box" }} />
              </div>
              {mData?.demThat != null && (() => {
                const lech = (Number(mData.demThat) || 0) - tongTienMat;
                return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, paddingTop: 7, borderTop: `1px solid ${C.line}`, fontWeight: 800 }}><span style={{ color: C.ink }}>Lệch (thật − app)</span><b style={{ color: lech === 0 ? C.green : C.coral }}>{lech > 0 ? "+" : ""}{fmt(lech)} đ</b></div>;
              })()}
            </div>
            {mData?.demThat != null && ((Number(mData.demThat) || 0) - tongTienMat !== 0) && (
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{(Number(mData.demThat) || 0) - tongTienMat < 0 ? "Đếm thật ÍT hơn app → có thể thiếu tiền / quên ghi 1 khoản chi." : "Đếm thật NHIỀU hơn app → có thể quên ghi 1 khoản thu."}</div>
            )}
          </>
        )}

        {(tk.noAB_AtoB > 0 || tk.noAB_BtoA > 0) && (<>
          <div style={sheetTitle}>Nợ nội bộ A ↔ B</div>
          {noAB > 0 && <div style={{ fontSize: 13.5 }}>A đang nợ B: <b style={{ color: C.gold }}>{fmt(noAB)} đ</b></div>}
          {noAB < 0 && <div style={{ fontSize: 13.5 }}>B đang nợ A: <b style={{ color: C.gold }}>{fmt(-noAB)} đ</b></div>}
          {noAB === 0 && <div style={{ fontSize: 13.5, color: C.green }}>Đã cấn trừ xong.</div>}
        </>)}

        <button onClick={() => setSheetLN(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Hoàn thành</button>
      </BottomSheet>

      <BottomSheet open={sheetLS} onClose={() => setSheetLS(false)} title="Lịch sử các tháng trước">
        {!lichSu || lichSu.length === 0 ? <div style={{ color: C.sub, fontSize: 14, padding: 10, textAlign: "center" }}>Chưa có dữ liệu các tháng.</div> : (() => {
          const splitA = (v) => Math.round(v * tyLeA / 100);
          const rev = [...lichSu].reverse(); 
          const tongLKT = lichSu.reduce((a, r) => a + r.laiKeToan, 0);
          const tongLTM = lichSu.reduce((a, r) => a + r.laiTienMat, 0);
          const rowLine = { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "1px 0" };
          const sub2 = (la, va, lb, vb) => (
            <div style={{ display: "flex", gap: 10, marginTop: 3, fontSize: 12 }}>
              <span style={{ flex: 1, color: C.sub }}>{la} <b style={{ color: C.blueA }}>{fmt(va)}</b></span>
              <span style={{ flex: 1, color: C.sub }}>{lb} <b style={{ color: C.violetB }}>{fmt(vb)}</b></span>
            </div>
          );
          return (
          <div>
            {rev.map((r) => {
              const aKT = r.laiA != null ? r.laiA : splitA(r.laiKeToan), bKT = r.laiB != null ? r.laiB : (r.laiKeToan - aKT);
              return (
              <div key={r.thang} style={{ border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ background: C.pineSoft, padding: "8px 12px", fontFamily: font.display, fontWeight: 800, fontSize: 14.5, color: C.pine, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="calendarCheck" size={14} color={C.pine} /> Tháng {r.mm}/{r.yy}</span>{r.daChot && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.pine, display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="lock" size={11} color={C.pine} /> đã chốt</span>}</div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={rowLine}><span style={{ color: C.sub, fontWeight: 600, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="receipt" size={13} color={C.sub} /> Doanh thu (thực thu)</span><b style={{ color: C.ink }}>{fmt(r.thuThang)} đ</b></div>
                  {sub2("A thu:", r.thuA, "B thu:", r.thuB)}
                  {(r.tnPhai > 0 || r.tnThu > 0) && (
                    <div style={{ ...rowLine, marginTop: 3, fontSize: 11.5 }}>
                      <span style={{ color: C.sub, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="droplet" size={12} color={C.blueA} /> trong đó thu ngoài (KV4)</span>
                      <span style={{ color: C.sub }}>thu <b style={{ color: C.ink }}>{fmt(r.tnThu)}</b>{r.tnPhai - r.tnThu > 0 ? <b style={{ color: C.coral }}> · nợ {fmt(r.tnPhai - r.tnThu)}</b> : null}</span>
                    </div>
                  )}
                  <div style={{ ...rowLine, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}><span style={{ color: C.sub, fontWeight: 600 }}><span style={{display:"inline-flex",alignItems:"center",gap:5}}><Icon name="banknote" size={13} color={C.coral} /> Chi phí xử lý (đã chi)</span></span><b style={{ color: C.ink }}>{fmt(r.traThang)} đ</b></div>
                  {sub2("A chi:", r.traA, "B chi:", r.traB)}
                  {(r.noNCCThang !== 0 || r.noNCC > 0) && (
                    <div style={{ ...rowLine, marginTop: 3, fontSize: 11.5 }}>
                      <span style={{ color: C.amber, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="building" size={13} color="#9A6B00" /> Nợ NCC (trường nợ)</span>
                      <span style={{ color: C.amber }}>{r.noNCCThang !== 0 ? `T${r.mm}: ${r.noNCCThang > 0 ? "+" : ""}${fmt(r.noNCCThang)} · ` : ""}dồn <b>{fmt(r.noNCC)}</b></span>
                    </div>
                  )}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginBottom: 6, display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="pieChart" size={13} color={C.sub} /> Phân chia tài chính · LN kế toán: <b style={{ color: r.laiKeToan < 0 ? C.coral : C.green }}>{fmt(r.laiKeToan)} đ</b></div>
                    <div style={{ border: `1px solid ${C.line}`, borderRadius: 9, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: C.graySoft, fontSize: 11, color: C.sub, fontWeight: 700, padding: "5px 9px" }}>
                        <span style={{ flex: 1.5 }}>Nội dung</span>
                        <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Người A</span>
                        <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Người B</span>
                      </div>
                      <div style={{ display: "flex", fontSize: 12, padding: "6px 9px", borderTop: `1px solid ${C.line}` }}>
                        <span style={{ flex: 1.5, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="coins" size={14} color={C.amber} /> Lãi chia {r.laiTay ? <span style={{ fontSize: 10, color: C.blueA, fontWeight: 700 }}>✎ tay</span> : `(${tyLeA}/${100 - tyLeA})`}</span>
                        <b style={{ flex: 1, textAlign: "right", color: C.blueA }}>{fmt(aKT)}</b>
                        <b style={{ flex: 1, textAlign: "right", color: C.violetB }}>{fmt(bKT)}</b>
                      </div>
                      <div style={{ display: "flex", fontSize: 12, padding: "6px 9px", borderTop: `1px solid ${C.line}` }}>
                        <div style={{ flex: 1.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="landmark" size={14} color={C.pine} /> Quỹ trường giữ</span><div style={{ fontSize: 9.5, color: C.sub }}>(lũy kế)</div></div>
                        <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: r.giuACum < 0 ? C.coral : C.blueA }}>{fmt(r.giuACum)}</b><div style={{ fontSize: 9.5, color: r.deltaA < 0 ? C.coral : C.sub }}>T{r.mm}: {fmt(r.deltaA)}</div></div>
                        <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: r.giuBCum < 0 ? C.coral : C.violetB }}>{fmt(r.giuBCum)}</b><div style={{ fontSize: 9.5, color: r.deltaB < 0 ? C.coral : C.sub }}>T{r.mm}: {fmt(r.deltaB)}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
            <div style={{ background: C.goldSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 4 }}>
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 13.5, color: C.amber, marginBottom: 4 }}>Σ Cộng tất cả các tháng</div>
              <div style={rowLine}><span style={{ color: C.sub }}>Tổng LN kế toán</span><b style={{ color: tongLKT < 0 ? C.coral : C.green }}>{fmt(tongLKT)} đ</b></div>
              <div style={rowLine}><span style={{ color: C.sub }}>Tổng LN tiền mặt</span><b style={{ color: tongLTM < 0 ? C.coral : C.blueA }}>{fmt(tongLTM)} đ</b></div>
              <div style={rowLine}><span style={{ color: C.sub }}>Chia lãi · A {tyLeA}% / B {100 - tyLeA}%</span><b><span style={{ color: C.blueA }}>{fmt(splitA(tongLKT))}</span> / <span style={{ color: C.violetB }}>{fmt(tongLKT - splitA(tongLKT))}</span></b></div>
            </div>
          </div>
          );
        })()}
        <button onClick={() => setSheetLS(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Hoàn thành</button>
      </BottomSheet>

      <SoGiaoDichSheet open={sheetGD} onClose={() => setSheetGD(false)} ym={ym} students={students} />
      <BaoCaoSheet open={sheetBC} onClose={() => setSheetBC(false)} lichSu={lichSu} ym={ym} />
    </>
  );
}
