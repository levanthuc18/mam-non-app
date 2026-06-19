import { useState, useEffect, useRef, useMemo } from "react";
import {
  C, font, ymKey, stripYm, uid, noDau,
  sGet, sSet, sList, sDel, MEM, CHOT_MEM, saveChotMem,
  SB, PHAN_LOAI, TRANG_THAI, TT_COLOR, TT_THU_PHI,
  KHOAN, SEED_META, khoanMode, isKhongThu,
  defaultKhoan, seedThangData, lopOfMonth,
  soBuoiT7Auto, soNgayHoc, ngayNhapHocTrongThang, tinhPSFromRec,
  trangThaiThu, setCurrentActor, setAskRef, setToastRef, ask, toast, logAction
} from "./lib.js";
import { BottomSheet } from "./ui.jsx";
import { ThuPhiTab } from "./ThuPhi.jsx";
import { DiemDanhTab } from "./DiemDanh.jsx";
import { CongNoTab } from "./CongNo.jsx";
import { PhieuThu, DashTab } from "./TongQuan.jsx";
import { CaiDat } from "./CaiDat.jsx";

function ConfirmHost() {
  const [state, setState] = useState(null);
  useEffect(() => { setAskRef((s) => setState(s)); return () => setAskRef(null); }, []);
  if (!state) return null;
  const close = (v) => { state.res(v); setState(null); };
  const danger = state.opts.danger;
  return (
    <div onClick={() => close(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,40,30,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 14.5, color: C.ink, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 18 }}>{state.msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => close(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.cancelText || "Hủy"}</button>
          <button onClick={() => close(true)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: danger ? C.coral : C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.okText || "Đồng ý"}</button>
        </div>
      </div>
    </div>
  );
}
function ToastHost() {
  const [state, setState] = useState(null);
  const t = useRef(null);
  useEffect(() => { setToastRef((s) => { setState(s); clearTimeout(t.current); t.current = setTimeout(() => setState(null), s && s.undo ? 6000 : 2600); }); return () => setToastRef(null); }, []);
  if (!state) return null;
  return (
    <div style={{ position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: C.ink, color: "#fff", padding: "11px 18px", borderRadius: 99, fontSize: 13.5, fontWeight: 600, maxWidth: "90%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span>{state.msg}</span>
      {state.undo && <button onClick={() => { state.undo(); clearTimeout(t.current); setState(null); }} style={{ background: "#fff", color: C.ink, border: "none", borderRadius: 99, padding: "4px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Hoàn tác</button>}
    </div>
  );
}

function LoginScreen({ meta, onLogin }) {
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const tryAdmin = () => { if (pin.trim() === "1989") onLogin({ role: "admin" }); else setErr("Mã quản lý không đúng"); };
  const tryGV = () => { const gv = meta?.giaoVien?.find((g) => g.pin === pin.trim()); if (gv) onLogin({ role: "gv", gvId: gv.id, ten: gv.ten, lopId: gv.lopId }); else setErr("PIN không đúng"); };
  const lopTen = (id) => meta?.classes.find((c) => c.id === id)?.ten || "?";
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font.body }}>
      <div style={{ background: C.card, borderRadius: 20, padding: "30px 26px", width: "100%", maxWidth: 360, boxShadow: "0 8px 30px rgba(0,0,0,.08)", textAlign: "center" }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: C.pine }}>{meta?.tenTruong || "Mầm Non"}</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 22 }}>Quản lý điểm danh & thu phí</div>
        {!mode && (<>
          <button onClick={() => { setMode("admin"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>👩‍💼 Quản lý (Kế toán)</button>
          <button onClick={() => { setMode("gv"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.blueA}`, background: C.card, color: C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>👩‍🏫 Giáo viên điểm danh</button>
        </>)}
        {mode && (<>
          <div style={{ textAlign: "left", marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.sub }}>{mode === "admin" ? "🔐 Nhập mã quản lý" : "👩‍🏫 Nhập PIN giáo viên"}</div>
          <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && (mode === "admin" ? tryAdmin() : tryGV())} placeholder={mode === "admin" ? "Mã quản lý" : "PIN của bạn"} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${err ? C.coral : C.line}`, fontSize: 16, fontFamily: font.body, outline: "none", textAlign: "center", letterSpacing: 4 }} />
          {err && <div style={{ fontSize: 12.5, color: C.coral, marginTop: 6 }}>{err}</div>}
          <button onClick={mode === "admin" ? tryAdmin : tryGV} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: mode === "admin" ? C.pine : C.blueA, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>Vào</button>
          <button onClick={() => { setMode(null); setPin(""); setErr(""); }} style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none", background: "none", color: C.sub, fontSize: 13, cursor: "pointer", marginTop: 6 }}>‹ Quay lại</button>
          {mode === "gv" && meta?.giaoVien?.length > 0 && <div style={{ marginTop: 12, fontSize: 11, color: C.gray, lineHeight: 1.6 }}>{meta.giaoVien.map((g) => <div key={g.id}>{g.ten} · lớp {lopTen(g.lopId)}</div>)}</div>}
        </>)}
      </div>
    </div>
  );
}

export default function App() {
  const now = new Date();
  const [meta, setMeta] = useState(null);
  const [students, setStudents] = useState(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [mData, setMData] = useState(null);
  const [ddData, setDDData] = useState(null);
  const [leData, setLeData] = useState(null);
  const [ddPrev, setDDPrev] = useState({});
  const [nextChot, setNextChot] = useState(false);
  const [tab, setTab] = useState("thu");
  const [auth, setAuth] = useState(null);
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId || null;
  const gvTen = auth?.ten || "";
  setCurrentActor(isAdmin ? "Admin" : (isGV ? gvTen : "?"));
  const [openId, setOpenId] = useState(null);
  const [phieuId, setPhieuId] = useState(null);
  const [lopFilter, setLopFilter] = useState("all");
  const [thuFilter, setThuFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [isWide, setIsWide] = useState(typeof window !== "undefined" && window.innerWidth >= 820);
  const saveT = useRef({});
  const ym = ymKey(year, month);

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 820);
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  const doSeed = async () => {
    const m = SEED_META, st = [];
    await sSet("mn5:meta", m); await sSet("mn5:students", st);
    await sSet("mn5:seedVersion", 14);
    return { m, st };
  };

  useEffect(() => { (async () => {
    let m = await sGet("mn5:meta");
    let st = await sGet("mn5:students");
    const sv = await sGet("mn5:seedVersion");
    if (!m || !st || sv !== 14) {
      const r = await doSeed();
      m = r.m; st = r.st; setSeeded(true);
    }
    setMeta(m); setStudents(st); setLoading(false);
    const a = await sGet("mn5:auth"); if (a && (a.role === "admin" || a.role === "gv")) setAuth(a);
  })(); }, []);

  const login = (a) => { setAuth(a); sSet("mn5:auth", a); };
  const logout = () => { setAuth(null); sDel("mn5:auth"); setTab("dd"); };

  const reseedAll = async () => {
    const keys = await sList("mn5:");
    for (const k of keys) await sDel(k);
    Object.keys(CHOT_MEM).forEach((k) => delete CHOT_MEM[k]); saveChotMem();
    const r = await doSeed();
    setMeta({ ...r.m }); setStudents([...r.st]);
    setMData(null); setSeeded(true);
    setMonth(now.getMonth() + 1); setYear(now.getFullYear());
  };

  const metaReady = !!meta;
  useEffect(() => { if (!metaReady) return; (async () => {
    const d = await sGet(`mn5:thang:${ym}`);
    let dd = await sGet(`mn5:dd:${ym}`);
    if (!dd && d?.att) { dd = d.att; await sSet(`mn5:dd:${ym}`, dd); }
    setDDData(dd || {});
    const le = await sGet(`mn5:le:${ym}`);
    setLeData(le || {});
    const pm = month === 1 ? 12 : month - 1, py = month === 1 ? year - 1 : year;
    const ddP = await sGet(`mn5:dd:${ymKey(py, pm)}`);
    setDDPrev(ddP || {});
    const nm = month === 12 ? 1 : month + 1, ny = month === 12 ? year + 1 : year;
    const nd = await sGet(`mn5:thang:${ymKey(ny, nm)}`);
    setNextChot(!!nd?.daChot);
    if (d) { const { att, ...rest } = d; if (CHOT_MEM[ym] !== undefined) rest.daChot = CHOT_MEM[ym]; setMData({ ...rest, __ym: ym }); }
    else setMData(null);
  })(); setOpenId(null); setPhieuId(null); }, [ym, metaReady]);

  useEffect(() => {
    if (!SB || !metaReady) return;
    const t = setInterval(async () => {
      delete MEM[`mn5:dd:${ym}`]; const dd = await sGet(`mn5:dd:${ym}`); setDDData(dd || {});
    }, 10000);
    return () => clearInterval(t);
  }, [ym, metaReady]);
  
  useEffect(() => { setOpenId(null); }, [tab]);
  useEffect(() => { if (isGV && tab !== "dd") setTab("dd"); }, [isGV, tab]);

  useEffect(() => {
    if (!meta || !mData || mData.daChot || !students) return;
    if (mData.__ym !== ym) return; 
    let changed = false;
    const fees = { ...mData.fees };
    students.forEach((hs) => {
      if (!TT_THU_PHI[hs.trangThai]) return;
      const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym)); if (!lop) return;
      if (!fees[hs.id]) {
        const ngayAn = soNgayHoc(year, month, leData);
        const rec = { ngayAn, buoiT7: 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
        KHOAN.forEach((k) => { const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn); rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d; });
        fees[hs.id] = rec; changed = true;
      } else {
        const cur = fees[hs.id];
        const nd = { ...cur.khoanDefault }, nk = { ...cur.khoan }; let rc = false;
        KHOAN.forEach((k) => {
          const want = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, cur.ngayAn);
          const od = cur.khoanDefault?.[k.key] ?? 0, ov = cur.khoan?.[k.key] ?? 0;
          if (want !== od) { nd[k.key] = want; if (ov === od || isKhongThu(lop, k.key)) nk[k.key] = want; rc = true; }
        });
        if (rc) { fees[hs.id] = { ...cur, khoan: nk, khoanDefault: nd }; changed = true; }
      }
    });
    if (changed) setMData((m) => { const ndata = { ...m, fees }; flush(`mn5:thang:${ym}`, stripYm(ndata)); return ndata; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, students, ym]);

  useEffect(() => {
    if (!meta || !mData || mData.daChot || !students || leData == null) return;
    if (mData.__ym !== ym) return; 
    let changed = false;
    const fees = { ...mData.fees };
    Object.keys(fees).forEach((sid) => {
      const cur = fees[sid]; if (cur.ngayAnManual) return;
      const hs = students.find((s) => s.id === sid); if (!hs) return;
      const nhap = ngayNhapHocTrongThang(hs, year, month);
      const snh = nhap <= 26 ? soNgayHoc(year, month, leData, nhap) : 0;
      if (cur.ngayAn === snh) return;
      const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym));
      const newDef = isKhongThu(lop, "tienAn") ? 0 : snh * (lop?.tienAn || 0);
      const giuSuaTayTienAn = cur.khoan.tienAn !== cur.khoanDefault.tienAn;
      fees[sid] = { ...cur, ngayAn: snh, khoanDefault: { ...cur.khoanDefault, tienAn: newDef }, khoan: { ...cur.khoan, tienAn: giuSuaTayTienAn ? cur.khoan.tienAn : newDef } };
      changed = true;
    });
    if (changed) setMData((m) => { const ndata = { ...m, fees }; flush(`mn5:thang:${ym}`, stripYm(ndata)); return ndata; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leData, meta, students, ym]);

  const [prevDebt, setPrevDebt] = useState({});
  useEffect(() => { if (!metaReady || !students) return; (async () => {
    const keys = await sList("mn5:thang:");
    const months = keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m) && m < ym).sort();
    const datas = await Promise.all(months.map((m) => sGet(`mn5:thang:${m}`)));
    const dds = await Promise.all(months.map((m) => sGet(`mn5:dd:${m}`)));
    const prevKeys = Array.from(new Set(months.map((m) => { const y = Number(m.slice(0, 4)), mo = Number(m.slice(5)); const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y; return ymKey(py, pm); }).filter((k) => !months.includes(k))));
    const prevVals = await Promise.all(prevKeys.map((k) => sGet(`mn5:dd:${k}`)));
    const ddPrevExtra = {}; prevKeys.forEach((k, i) => { ddPrevExtra[k] = prevVals[i] || {}; });
    let snapIdx = -1;
    for (let i = months.length - 1; i >= 0; i--) { if (datas[i]?.daChot && datas[i]?.noLuyKe) { snapIdx = i; break; } }
    const debt = {};
    students.forEach((hs) => { debt[hs.id] = hs.noDauKy || 0; });
    if (snapIdx >= 0) { const snap = datas[snapIdx].noLuyKe; Object.keys(snap).forEach((sid) => { debt[sid] = snap[sid]; }); }
    for (let i = snapIdx + 1; i < months.length; i++) {
      const td = datas[i]; if (!td?.fees) continue;
      const m = months[i], y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
      const ddM = dds[i] || td.att || {};
      if (td.daChot && td.noLuyKe) { Object.keys(td.noLuyKe).forEach((sid) => { debt[sid] = td.noLuyKe[sid]; }); continue; }
      Object.keys(td.fees).forEach((sid) => {
        const hs = students.find((s) => s.id === sid); if (!hs) return;
        if (debt[sid] === undefined) debt[sid] = hs.noDauKy || 0;
        let rec = td.fees[sid];
        const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, m));
        const ppm = mo === 1 ? 12 : mo - 1, ppy = mo === 1 ? y - 1 : y;
        const ddPrevKey = ymKey(ppy, ppm);
        const idxPrev = months.indexOf(ddPrevKey);
        const ddPrevM = (idxPrev >= 0 ? dds[idxPrev] : null) || ddPrevExtra[ddPrevKey] || {};
        const nghi = Object.keys(ddPrevM[sid] || {}).length;
        if (hs.pl === "T7" && !rec.buoiT7Manual) rec = { ...rec, buoiT7: soBuoiT7Auto(y, mo, ddM[sid]) };
        const ps = tinhPSFromRec(hs, rec, lop, nghi).tong;
        debt[sid] += ps - (Number(rec.thucThu) || 0);
      });
    }
    setPrevDebt(debt);
  })(); }, [ym, metaReady, students, mData, meta]);

  const q = (k, v) => { clearTimeout(saveT.current[k]); saveT.current[k] = setTimeout(() => sSet(k, v), 400); };
  const flush = (k, v) => { clearTimeout(saveT.current[k]); return sSet(k, v); };
  const upMeta = (m) => { setMeta(m); q("mn5:meta", m); };
  const upStudents = (s, now) => { setStudents(s); return (now ? flush : q)("mn5:students", s); };
  const upMData = (d) => { CHOT_MEM[ym] = !!d.daChot; saveChotMem(); const dd = { ...d, __ym: ym }; setMData(dd); return flush(`mn5:thang:${ym}`, stripYm(dd)); };
  const upDDData = (d) => { setDDData(d); return flush(`mn5:dd:${ym}`, d); };
  const upLeData = (d) => { setLeData(d); flush(`mn5:le:${ym}`, d); };

  const getLop = (id) => meta?.classes.find((c) => c.id === id);
  const locked = mData?.daChot;

  const taoThang = async () => {
    const py = month === 1 ? year - 1 : year;
    const pm = month === 1 ? 12 : month - 1;
    const prev = await sGet(`mn5:thang:${ymKey(py, pm)}`);
    const data = seedThangData(ym, students, meta);
    data.fees = {};
    students.forEach((hs) => {
      if (!TT_THU_PHI[hs.trangThai]) return;
      const lop = getLop(lopOfMonth(hs, ym));
      const nhap = ngayNhapHocTrongThang(hs, year, month);
      const ngayAn = nhap <= 26 ? soNgayHoc(year, month, leData, nhap) : 0;
      const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
      KHOAN.forEach((k) => {
        const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn);
        rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d;
      });
      const prevRec = prev?.fees?.[hs.id];
      if (prevRec?.phuThu) rec.phuThu = prevRec.phuThu.filter((p) => p.coDinh).map((p) => ({ ...p, id: uid() }));
      data.fees[hs.id] = rec;
    });
    if (prev?.chiPhi?.length) {
      data.chiPhi = prev.chiPhi.filter((c) => c.loai === "CO_DINH").map((c) => ({ id: uid(), noiDung: c.noiDung, soTien: c.soTien, nguoiChi: c.nguoiChi, loai: "CO_DINH", daTra: 0 }));
    }
    upMData(data);
    toast(`Đã tạo tháng ${month}/${year}.`);
    logAction(`Tạo bảng thu tháng ${month}/${year}`);
  };

  const delThang = async () => {
    if (locked) { toast("Tháng đã chốt — mở khóa trước khi xóa."); return; }
    if (await ask(`Xóa toàn bộ bảng THU tháng ${month}/${year}?\nĐiểm danh tháng này vẫn được GIỮ lại.`, { danger: true, okText: "Xóa bảng thu" })) {
      await sDel(`mn5:thang:${ym}`);
      delete CHOT_MEM[ym]; saveChotMem();
      setMData(null);
      logAction(`Xóa bảng thu tháng ${month}/${year}`);
      toast(`Đã xóa bảng thu. Điểm danh tháng ${month}/${year} vẫn còn.`);
    }
  };

  const setRec = (sid, patch) => {
    if (locked) return;
    const cur = mData.fees[sid];
    let next = { ...cur, ...patch };
    if (patch.ngayAnManual === false) { patch = { ...patch, ngayAn: soNgayHoc(year, month, leData) }; next = { ...cur, ...patch }; }
    if (patch.ngayAn != null) {
      const lop = getLop(lopOfMonth(students.find((s) => s.id === sid), ym));
      const newDef = (patch.ngayAn || 0) * (lop?.tienAn || 0);
      next.khoanDefault = { ...next.khoanDefault, tienAn: newDef };
      if (cur.khoan.tienAn === cur.khoanDefault.tienAn) next.khoan = { ...next.khoan, tienAn: newDef };
    }
    upMData({ ...mData, fees: { ...mData.fees, [sid]: next } });
  };
  const thuDuNhieu = (pairs) => {
    if (locked) return;
    const fees = { ...mData.fees };
    pairs.forEach(({ sid, thucThu }) => { if (fees[sid]) fees[sid] = { ...fees[sid], thucThu }; });
    upMData({ ...mData, fees });
    if (pairs.length > 1) logAction(`Thu đủ hàng loạt ${pairs.length} HS (T${month}/${year})`);
  };
  const setKhoan = (sid, key, val) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoan, [key]: val } } } });
  };
  const resetKhoan = (sid, key) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoan, [key]: cur.khoanDefault[key] } } } });
  };
  const resetAllKhoan = (sid) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoanDefault } } } });
  };
  const setNgayAnAll = (val, onlyIds) => {
    if (locked) return;
    const fees = { ...mData.fees };
    const ids = onlyIds && onlyIds.length ? onlyIds.filter((id) => fees[id]) : Object.keys(fees);
    ids.forEach((sid) => {
      const cur = fees[sid];
      const lop = getLop(lopOfMonth(students.find((s) => s.id === sid), ym));
      const newDef = (val || 0) * (lop?.tienAn || 0);
      const giuSuaTay = cur.khoan.tienAn !== cur.khoanDefault.tienAn;
      fees[sid] = { ...cur, ngayAn: val, ngayAnManual: true, khoanDefault: { ...cur.khoanDefault, tienAn: newDef }, khoan: { ...cur.khoan, tienAn: giuSuaTay ? cur.khoan.tienAn : newDef } };
    });
    upMData({ ...mData, fees });
    toast(`Đã đặt ${val} ngày ăn cho ${ids.length} HS đang hiển thị.`);
  };
  const addPhuThuHS = (sid, ten, soTien) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten, soTien: Number(soTien) || 0 }] } } });
  };
  const delPhuThuHS = (sid, pid) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: (cur.phuThu || []).filter((p) => p.id !== pid) } } });
  };

  const allRows = useMemo(() => {
    if (!mData || !students) return [];
    return students.map((hs) => {
      let rec = mData.fees?.[hs.id];
      const lopId = lopOfMonth(hs, ym);
      const lop = getLop(lopId);
      const nghi = Object.keys(ddPrev?.[hs.id] || {}).length;
      if (rec && hs.pl === "T7" && !rec.buoiT7Manual) {
        const auto = soBuoiT7Auto(year, month, ddData?.[hs.id]);
        if (auto !== rec.buoiT7) rec = { ...rec, buoiT7: auto };
      }
      const ps = rec ? tinhPSFromRec(hs, rec, lop, nghi) : { tong: 0, dong: [], suaCount: 0 };
      const noTruoc = prevDebt[hs.id] || 0;
      const tongPhaiThu = ps.tong + noTruoc; 
      return { hs, rec, lopId, lop, nghi, ps, noTruoc, tongPhaiThu, st: rec ? trangThaiThu(tongPhaiThu, rec.thucThu) : null, conNo: rec ? tongPhaiThu - rec.thucThu : 0, coRec: !!rec };
    });
  }, [students, mData, ddData, ddPrev, meta, year, month, prevDebt]);

  const ddRows = useMemo(() => {
    if (mData) return allRows;
    if (!students || !meta) return [];
    return students.filter((hs) => TT_THU_PHI[hs.trangThai]).map((hs) => {
      const lopId = lopOfMonth(hs, ym);
      return { hs, lopId, lop: meta.classes.find((c) => c.id === lopId), coRec: true };
    });
  }, [mData, allRows, students, meta, ym]);

  const rows = useMemo(() => {
    const s = noDau(search);
    return allRows.filter((r) => {
      if (!r.coRec) return false;
      if (lopFilter !== "all" && r.lopId !== lopFilter) return false;
      if (s && !noDau(r.hs.ten).includes(s) && !r.hs.id.toLowerCase().includes(s)) return false;
      if (thuFilter === "chuaThu") return r.ps.tong > 0 && (r.rec.thucThu || 0) === 0;
      if (thuFilter === "thieu") return r.conNo > 0 && (r.rec.thucThu || 0) > 0;
      if (thuFilter === "noCu") return r.noTruoc > 0;
      if (thuFilter === "thuThua") return r.conNo < 0;
      return true;
    });
  }, [allRows, lopFilter, search, thuFilter]);

  const tk = useMemo(() => {
    const s = { ps: 0, thu: 0, no: 0, A: 0, B: 0, chiA: 0, chiB: 0, traA: 0, traB: 0, noList: [], noAB_AtoB: 0, noAB_BtoA: 0 };
    allRows.forEach((r) => {
      if (!r.coRec) return;
      s.ps += r.ps.tong; s.thu += r.rec.thucThu; 
      if (r.conNo > 0) { s.no += r.conNo; s.noList.push({ ten: r.hs.ten, so: r.conNo, chua: r.rec.thucThu === 0 }); }
      if (r.hs.nguoiThu === "A") s.A += r.rec.thucThu; else if (r.hs.nguoiThu === "B") s.B += r.rec.thucThu;
    });
    (mData?.thuNgoai || []).forEach((k) => {
      const tt = Number(k.thucThu) || 0; s.ps += Number(k.soTien) || 0; s.thu += tt;
      if (k.nguoiThu === "A") s.A += tt; else if (k.nguoiThu === "B") s.B += tt;
      const no = (Number(k.soTien) || 0) - tt; if (no > 0) { s.no += no; s.noList.push({ ten: "(TN) " + k.ten, so: no, chua: tt === 0 }); }
    });
    (mData?.chiPhi || []).forEach((c) => {
      const e = Number(c.soTien) || 0, kk = Number(c.daTra) || 0;
      if (c.loai === "CHUYEN") { if (c.huong === "A->B") { s.A -= e; s.B += e; } else { s.B -= e; s.A += e; } return; }
      if (c.loai === "NO_AB") { if (c.huong === "A->B") s.noAB_AtoB += e - kk; else s.noAB_BtoA += e - kk; return; }
      if (c.loai === "TRA_NO") {
        if (c.nguoiChi === "A") s.traA += kk; else s.traB += kk;
        return;
      }
      if (c.nguoiChi === "A") { s.chiA += e; s.traA += kk; } else { s.chiB += e; s.traB += kk; }
    });
    const dk = meta?.soDuDauKy || {};
    s.noAB_AtoB += (dk.AnoB || 0); s.noAB_BtoA += (dk.BnoA || 0);
    return s;
  }, [allRows, mData, meta]);

  if (loading || !meta || !students)
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.sub, fontFamily: font.body }}>Đang tải dữ liệu…</div>;
  if (!auth) return <LoginScreen meta={meta} onLogin={login} />;

  const prevM = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextM = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };
  const chipsLop = [["all", "Tất cả"], ...meta.classes.map((c) => [c.id, c.ten])];
  const phieuRow = allRows.find((r) => r.hs.id === phieuId && r.coRec) || allRows.find((r) => r.coRec);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font.body, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        input[type=number]::-webkit-inner-spin-button{display:none}
        *{box-sizing:border-box}
        button:active{transform:scale(0.97)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @media print { .no-print{display:none!important} #phieu-in{box-shadow:none!important} body{background:#fff} }
      `}</style>

      <div className="no-print" style={{ background: C.pine, padding: "16px 16px 14px", color: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, lineHeight: 1.25, maxHeight: 38, overflow: "hidden", wordBreak: "break-word" }}>{meta.tenTruong}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{isGV ? `👩‍🏫 ${gvTen}` : `${students.filter((s) => TT_THU_PHI[s.trangThai]).length} đang học · ${meta.classes.length} lớp`}{locked ? " · 🔒" : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,.16)", borderRadius: 999, padding: "4px 4px" }}>
              <button onClick={prevM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>‹</button>
              <button onClick={() => setMonthPickerOpen(true)} style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, minWidth: 64, textAlign: "center", color: "#fff", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", gap: 3 }}>Th{month}/{year} <span style={{ fontSize: 9, opacity: 0.8 }}>▾</span></button>
              <button onClick={nextM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>›</button>
            </div>
            <button onClick={logout} title="Đăng xuất" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 8, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>↩</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 14px 92px" }}>
        {seeded && <div className="no-print" style={{ background: C.pineSoft, border: `1px solid #BFE0D4`, borderRadius: 12, padding: "9px 12px", marginBottom: 12, fontSize: 12.5, color: C.pine }}>👋 Khởi tạo xong! Bắt đầu: vào ⚙️ Cài đặt → Học sinh để thêm/nhập danh sách, rồi tạo bảng thu cho tháng.</div>}

        {["thu", "phieu", "dash"].includes(tab) && !mData && (
          <div className="no-print" style={{ background: C.card, borderRadius: 16, padding: 28, textAlign: "center", border: `1px dashed ${C.line}` }}>
            <div style={{ fontSize: 32 }}>📅</div>
            <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Tháng {month}/{year} chưa có dữ liệu</div>
            {isAdmin ? (<>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>Tạo bảng thu cho HS đang học.</div>
              <button onClick={taoThang} style={{ background: C.pine, color: "#fff", padding: "11px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: font.display }}>+ Tạo tháng {month}/{year}</button>
            </>) : (
              <div style={{ fontSize: 13, color: C.sub }}>Vui lòng liên hệ kế toán để tạo bảng thu (vẫn điểm danh được bên dưới).</div>
            )}
          </div>
        )}

        {tab === "thu" && mData && (<ThuPhiTab {...{ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, openId, setOpenId, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }} />)}
        {tab === "dd" && (<DiemDanhTab {...{ allRows: ddRows, chipsLop, lopFilter, setLopFilter, search, setSearch, ddData, upDDData, leData, upLeData, year, month, locked: nextChot, ddLockReason: nextChot, isWide, ym, isGV, gvLopId, gvTen, students }} />)}
        {tab === "phieu" && mData && phieuRow && (<PhieuThu {...{ phieuRow, allRows, setPhieuId, getLop, meta, month, year, upMeta, mData, upMData }} />)}
        {tab === "dash" && mData && (<DashTab {...{ tk, mData, upMData, month, year, locked, meta, allRows, delThang, students, ym, upMeta, setTab }} />)}
        {tab === "no" && (<CongNoTab {...{ students, meta, ym, mData }} />)}
        {tab === "caidat" && (<CaiDat {...{ meta, upMeta, students, upStudents, ym, reseedAll, isWide }} />)}
      </div>

      <div className="no-print" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center", zIndex: 20 }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 640 }}>
          {(isAdmin ? [["thu", "Thu phí", "₫"], ["dd", "Điểm danh", "✓"], ["no", "Công nợ", "📕"], ["dash", "Tổng quan", "📊"], ["phieu", "Phiếu", "🧾"], ["caidat", "Cài đặt", "⚙️"]] : [["dd", "Điểm danh", "✓"]]).map(([id, lb, ic]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px 0 11px", border: "none", background: "none", cursor: "pointer", color: tab === id ? C.pine : C.gray, fontFamily: font.body, fontSize: 10, fontWeight: tab === id ? 700 : 500 }}>
              <div style={{ fontSize: 15, marginBottom: 1 }}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      </div>
      <BottomSheet open={monthPickerOpen} onClose={() => setMonthPickerOpen(false)} title="Chọn tháng xem báo cáo">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(() => {
            const base = new Date();
            const items = [];
            for (let i = -1; i <= 17; i++) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); items.push({ m: d.getMonth() + 1, y: d.getFullYear() }); }
            return items.map(({ m, y }) => {
              const active = m === month && y === year;
              const isNow = m === base.getMonth() + 1 && y === base.getFullYear();
              return (
                <button key={`${y}-${m}`} onClick={() => { setMonth(m); setYear(y); setMonthPickerOpen(false); }} style={{ flex: "1 1 28%", minWidth: 96, padding: "11px 6px", borderRadius: 11, border: `1.5px solid ${active ? C.pine : C.line}`, background: active ? C.pine : C.card, color: active ? "#fff" : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  Th{m}/{y}
                  {isNow && <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? "#fff" : C.green }}>● hiện tại</span>}
                </button>
              );
            });
          })()}
        </div>
        <button onClick={() => setMonthPickerOpen(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Xong</button>
      </BottomSheet>
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
