import { useState, useEffect, useRef, useMemo } from "react";
import {
  ymKey, stripYm, uid, noDau,
  sGet, sGetSafe, sGetSafeCached, cachePut, sSet, sList, sDel, queueWrite, MEM, CHOT_MEM, saveChotMem,
  SB, TT_THU_PHI, KHOAN, SEED_META,
  defaultKhoan, seedThangData, lopOfMonth,
  soBuoiT7Auto, soNgayHoc, ngayNhapHocTrongThang, tinhPSFromRec,
  trangThaiThu, ask, toast, logAction, hadKey, getSbEmail, sbRpc, snapshotTruoc, docSnapshot
} from "./lib.js";
import { tinhTKThang, tinhNoLuyKe } from "./taichinh.js";

export function useStore() {
  const now = new Date();
  const [meta, setMeta] = useState(null);
  const [students, setStudents] = useState(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [mData, setMData] = useState(null);
  const [ddData, setDDData] = useState(null);
  const [leData, setLeData] = useState(null);
  const [ddPrev, setDDPrev] = useState({});
  const [nextChot, setNextChot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const [loadErrKind, setLoadErrKind] = useState("network"); // "network" | "auth"
  const [ddOk, setDDOk] = useState(true);
  const [ddNonce, setDDNonce] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const [prevDebt, setPrevDebt] = useState({});
  const [prevDebtStale, setPrevDebtStale] = useState(false);
  const saveT = useRef({});
  const pendingSave = useRef({});
  const ym = ymKey(year, month);

  const doSeed = async () => {
    // ⛔ CHỐT CHẶN: chỉ seed (ghi rỗng) khi CHẮC CHẮN server đang trống.
    const chk = await sGetSafe("mn5:students");
    if (!chk.ok) throw new Error("seed-abort-network"); // đọc lỗi → KHÔNG seed
    if (Array.isArray(chk.value) && chk.value.length > 0) {
      // Server đang có học sinh → KHÔNG seed, dùng dữ liệu thật.
      const m2 = await sGetSafe("mn5:meta");
      return { m: (m2.ok && m2.value) ? m2.value : SEED_META, st: chk.value, skipped: true };
    }
    // ⛔ null ≠ [] : server thật sự trống (đã từng seed) trả []. null = key không thấy được
    //   (chưa xác thực / RLS lọc / chưa từng tồn tại) → KHÔNG ĐƯỢC seed khi không chắc.
    if (chk.value == null) throw new Error("seed-abort-auth");
    // ⛔ Máy này từng THẤY học sinh thật → server chắc chắn có dữ liệu → cấm seed vĩnh viễn.
    if (hadKey("mn5:students") || hadKey("mn5:meta")) throw new Error("seed-abort-auth");
    const m = SEED_META, st = [];
    await sSet("mn5:meta", m, { force: true }); await sSet("mn5:students", st, { force: true });
    await sSet("mn5:seedVersion", 14, { force: true });
    try { logAction(`SEED khởi tạo bởi ${getSbEmail() || "?"} · ${String(navigator.userAgent).slice(0, 60)}`); } catch {}
    return { m, st };
  };

  useEffect(() => { (async () => {
    // Đọc CÓ PHÂN BIỆT LỖI — mạng lỗi thì KHÔNG được seed (đó là lỗi từng xóa sạch dữ liệu).
    const mR = await sGetSafe("mn5:meta");
    const sR = await sGetSafe("mn5:students");
    const svR = await sGetSafe("mn5:seedVersion");
    if (!mR.ok || !sR.ok || !svR.ok) { setLoadErr(true); setLoading(false); return; }
    let m = mR.value, st = sR.value; const sv = svR.value;
    if (m == null || st == null || sv !== 14) {
      // Máy từng thấy dữ liệu thật mà server trả thiếu → nghi phiên/RLS, KHÔNG rơi vào seed.
      if ((m == null || st == null) && (hadKey("mn5:students") || hadKey("mn5:meta"))) {
        setLoadErrKind("auth"); setLoadErr(true); setLoading(false); return;
      }
      try { const r = await doSeed(); m = r.m; st = r.st; if (!r.skipped) setSeeded(true); }
      catch (e) { setLoadErrKind(String(e?.message).includes("auth") ? "auth" : "network"); setLoadErr(true); setLoading(false); return; }
    }
    setMeta(m); setStudents(st); setLoading(false);
  })(); }, []);

  const reseedAll = async () => {
    await snapshotTruoc("Trước khi Xóa sạch & bắt đầu lại"); // lưới đỡ: chụp trước reset
    // Reset chủ đích duy nhất — qua RPC server (delete+seed trong 1 transaction, GIỮ pinhash).
    const ok = await sbRpc("admin_reset_all", { seed_meta: SEED_META, seed_version: 14 });
    if (!ok) { toast("Không reset được — kiểm tra mạng/đăng nhập rồi thử lại."); return false; }
    Object.keys(CHOT_MEM).forEach((k) => delete CHOT_MEM[k]); saveChotMem();
    try { localStorage.removeItem("mn5:had:mn5:students"); localStorage.removeItem("mn5:had:mn5:meta"); } catch {}
    Object.keys(MEM).forEach((k) => { if (k.startsWith("mn5:") && k !== "mn5:pinhash") delete MEM[k]; });
    const m = SEED_META, st = [];
    setMeta({ ...m }); setStudents([...st]);
    setMData(null); setSeeded(true);
    setMonth(now.getMonth() + 1); setYear(now.getFullYear());
    try { logAction("RESET toàn bộ dữ liệu (reseedAll qua RPC)"); } catch {}
    return true;
  };

  const khoiPhucTruoc = async () => {
    const snap = await docSnapshot();
    if (!snap || !snap.data) { toast("Chưa có bản tự lưu nào."); return false; }
    const st = snap.data["mn5:students"];
    const khi = new Date(snap.ts).toLocaleString("vi-VN");
    if (!(await ask(`Khôi phục về bản tự lưu lúc ${khi}${snap.nhan ? ` (${snap.nhan})` : ""} — ${Array.isArray(st) ? st.length : "?"} học sinh?\n\nGhi đè dữ liệu HIỆN TẠI bằng bản đó.`, { danger: true, okText: "Khôi phục" }))) return false;
    for (const [k, v] of Object.entries(snap.data)) { if (v != null && k !== "mn5:bak:last") await sSet(k, v); }
    try { logAction(`Khôi phục bản tự lưu (${khi})`); } catch {}
    toast("Đã khôi phục — đang tải lại…");
    setTimeout(() => { try { window.location.reload(); } catch {} }, 900);
    return true;
  };

  const metaReady = !!meta;
  useEffect(() => { if (!metaReady) return; (async () => {
    const d = await sGet(`mn5:thang:${ym}`);
    const ddR = await sGetSafe(`mn5:dd:${ym}`);
    if (!ddR.ok) { setDDOk(false); setDDData({}); } // đọc lỗi → KHÓA sửa điểm danh, không coi là trống
    else {
      let dd = ddR.value;
      if (!dd && d?.att) { dd = d.att; await sSet(`mn5:dd:${ym}`, dd); }
      setDDData(dd || {}); setDDOk(true);
    }
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
  })(); }, [ym, metaReady, ddNonce]);

  useEffect(() => {
    if (!SB || !metaReady) return;
    const t = setInterval(async () => {
      delete MEM[`mn5:dd:${ym}`];
      const r = await sGetSafe(`mn5:dd:${ym}`);
      if (r.ok) { setDDData(r.value || {}); setDDOk(true); }
      else setDDOk(false); // lỗi → GIỮ state cũ, khóa sửa — KHÔNG bao giờ set {} (từng là gốc wipe)
    }, 10000);
    return () => clearInterval(t);
  }, [ym, metaReady]);

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
        KHOAN.forEach((k) => { const d = (lop.lapLai?.[k.key] === "khong") ? 0 : defaultKhoan(k.key, lop, hs, ngayAn); rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d; });
        fees[hs.id] = rec; changed = true;
      } else {
        const cur = fees[hs.id];
        const nd = { ...cur.khoanDefault }, nk = { ...cur.khoan }; let rc = false;
        KHOAN.forEach((k) => {
          const isKhongThu = lop.lapLai?.[k.key] === "khong";
          const want = isKhongThu ? 0 : defaultKhoan(k.key, lop, hs, cur.ngayAn);
          const od = cur.khoanDefault?.[k.key] ?? 0, ov = cur.khoan?.[k.key] ?? 0;
          if (want !== od) { nd[k.key] = want; if (ov === od || isKhongThu) nk[k.key] = want; rc = true; }
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
      const isKhongThu = lop?.lapLai?.tienAn === "khong";
      const newDef = isKhongThu ? 0 : snh * (lop?.tienAn || 0);
      const giuSuaTayTienAn = cur.khoan.tienAn !== cur.khoanDefault.tienAn;
      fees[sid] = { ...cur, ngayAn: snh, khoanDefault: { ...cur.khoanDefault, tienAn: newDef }, khoan: { ...cur.khoan, tienAn: giuSuaTayTienAn ? cur.khoan.tienAn : newDef } };
      changed = true;
    });
    if (changed) setMData((m) => { const ndata = { ...m, fees }; flush(`mn5:thang:${ym}`, stripYm(ndata)); return ndata; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leData, meta, students, ym]);

  useEffect(() => { if (!metaReady || !students) return; let huy = false; (async () => {
    const keys = await sList("mn5:thang:");
    const months = keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m) && m < ym).sort();
    // Đọc CÓ PHÂN BIỆT LỖI + cache tháng đã chốt (bất biến) — chuyển tháng nhanh hơn.
    const dRes = await Promise.all(months.map((m) => sGetSafeCached(`mn5:thang:${m}`)));
    const ddRes = await Promise.all(months.map((m) => sGetSafeCached(`mn5:dd:${m}`)));
    const prevKeys = Array.from(new Set(months.map((m) => { const y = Number(m.slice(0, 4)), mo = Number(m.slice(5)); const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y; return ymKey(py, pm); }).filter((k) => !months.includes(k))));
    const pRes = await Promise.all(prevKeys.map((k) => sGetSafeCached(`mn5:dd:${k}`)));
    if (huy) return;
    if (dRes.some((r) => !r.ok) || ddRes.some((r) => !r.ok) || pRes.some((r) => !r.ok)) { setPrevDebtStale(true); return; } // GIỮ số cũ, KHÔNG hiện nợ sai
    months.forEach((m, i) => { if (dRes[i].value?.daChot) { cachePut(`mn5:thang:${m}`, dRes[i].value); cachePut(`mn5:dd:${m}`, ddRes[i].value); } });
    const datas = dRes.map((r) => r.value);
    const dds = ddRes.map((r) => r.value);
    const ddPrevExtra = {}; prevKeys.forEach((k, i) => { ddPrevExtra[k] = pRes[i].value || {}; });
    const { debt } = tinhNoLuyKe({ months, datas, dds, ddExtra: ddPrevExtra, students, meta, boundExcl: ym });
    setPrevDebt(debt); setPrevDebtStale(false);
  })(); return () => { huy = true; }; }, [ym, metaReady, students, mData, meta]);

  const q = (k, v) => { pendingSave.current[k] = v; clearTimeout(saveT.current[k]); saveT.current[k] = setTimeout(() => { delete pendingSave.current[k]; sSet(k, v); }, 400); };
  const flush = (k, v) => { delete pendingSave.current[k]; clearTimeout(saveT.current[k]); return sSet(k, v); };

  // Đóng/ẩn app → đẩy ngay các bản lưu debounce chưa kịp bắn vào hàng đợi bền (chống mất sửa lẻ).
  useEffect(() => {
    const flushAll = () => {
      const p = pendingSave.current; pendingSave.current = {};
      Object.keys(saveT.current).forEach((k) => clearTimeout(saveT.current[k]));
      Object.keys(p).forEach((k) => { try { queueWrite(k, p[k]); } catch {} });
    };
    const onVis = () => { if (document.visibilityState === "hidden") flushAll(); };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("pagehide", flushAll); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  const upMeta = (m) => { setMeta(m); q("mn5:meta", m); };
  const upStudents = (s, now) => { setStudents(s); return (now ? flush : q)("mn5:students", s); };
  const upMData = (d) => { CHOT_MEM[ym] = !!d.daChot; saveChotMem(); const dd = { ...d, __ym: ym }; setMData(dd); return flush(`mn5:thang:${ym}`, stripYm(dd)); };
  const upDDData = (d) => {
    if (!ddOk) { toast("Chưa tải được điểm danh (mạng/phiên) — bấm Thử lại trước khi sửa."); return Promise.resolve(false); }
    setDDData(d); return flush(`mn5:dd:${ym}`, d);
  };
  const reloadDD = () => setDDNonce((n) => n + 1);
  const upLeData = (d) => { setLeData(d); flush(`mn5:le:${ym}`, d); };

  const getLop = (id) => meta?.classes.find((c) => c.id === id);
  const locked = mData?.daChot;

  const taoThang = async () => {
    // Chống 2 admin cùng tạo tháng: kiểm server NGAY TRƯỚC khi seed.
    const existed = await sGetSafe(`mn5:thang:${ym}`);
    // ⛔ Đọc lỗi → KHÔNG đi tiếp: sẽ vô hiệu luôn chính chốt chặn chống-ghi-đè ngay dưới.
    if (!existed.ok) { toast("Không kiểm tra được bảng thu trên máy chủ (mạng/phiên) — hủy tạo tháng. Thử lại."); return; }
    if (existed.value?.fees && Object.keys(existed.value.fees).length) {
      if (!(await ask(`Tháng ${month}/${year} ĐÃ CÓ bảng thu trên máy chủ (có thể máy khác vừa tạo).\n\nTạo lại sẽ GHI ĐÈ bảng đang có. Tiếp tục?`, { danger: true, okText: "Ghi đè, tạo lại" }))) { setMData(existed.value); return; }
    }
    const py = month === 1 ? year - 1 : year;
    const pm = month === 1 ? 12 : month - 1;
    // ⛔ Đọc lỗi → prev=null → tháng mới GHI LÊN SERVER thiếu phụ thu/chi phí/thu ngoài CỐ ĐỊNH, admin không hay.
    const prevR = await sGetSafe(`mn5:thang:${ymKey(py, pm)}`);
    if (!prevR.ok) { toast("Không đọc được bảng thu tháng trước (mạng/phiên) — hủy tạo tháng để không thiếu khoản cố định. Thử lại."); return; }
    const prev = prevR.value;
    const data = seedThangData(ym, students, meta);
    data.fees = {};
    students.forEach((hs) => {
      if (!TT_THU_PHI[hs.trangThai]) return;
      const lop = getLop(lopOfMonth(hs, ym));
      const nhap = ngayNhapHocTrongThang(hs, year, month);
      const ngayAn = nhap <= 26 ? soNgayHoc(year, month, leData, nhap) : 0;
      const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
      KHOAN.forEach((k) => {
        const d = (lop?.lapLai?.[k.key] === "khong") ? 0 : defaultKhoan(k.key, lop, hs, ngayAn);
        rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d;
      });
      const prevRec = prev?.fees?.[hs.id];
      if (prevRec?.phuThu) rec.phuThu = prevRec.phuThu.filter((p) => p.coDinh).map((p) => ({ ...p, id: uid() }));
      data.fees[hs.id] = rec;
    });
    if (prev?.chiPhi?.length) {
      data.chiPhi = prev.chiPhi.filter((c) => c.loai === "CO_DINH").map((c) => ({ id: uid(), noiDung: c.noiDung, soTien: c.soTien, nguoiChi: c.nguoiChi, loai: "CO_DINH", daTra: 0 }));
    }
    if (prev?.thuNgoai?.length) {
      data.thuNgoai = prev.thuNgoai.filter((k) => k.coDinh).map((k) => ({ id: uid(), ten: k.ten, soTien: k.soTien, thucThu: 0, nguoiThu: k.nguoiThu || "A", coDinh: true }));
    }
    upMData(data);
    toast(`Đã tạo tháng ${month}/${year}.`);
    logAction(`Tạo bảng thu tháng ${month}/${year}`);
  };

  const delThang = async () => {
    if (locked) { toast("Tháng đã chốt — mở khóa trước khi xóa."); return; }
    if (await ask(`Xóa toàn bộ bảng THU tháng ${month}/${year}?\nĐiểm danh tháng này vẫn được GIỮ lại.`, { danger: true, okText: "Xóa bảng thu" })) {
      await snapshotTruoc(`Trước khi xóa bảng thu T${month}/${year}`);
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
    logAction(`Reset các khoản về mặc định cho HS "${hsTen(sid)}" (T${ym})`);
  };
  
  const hsTen = (sid) => students.find((x) => x.id === sid)?.ten || sid;
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
    logAction(`Đặt ${val} ngày ăn cho ${ids.length} HS (T${ym})`);
    toast(`Đã đặt ${val} ngày ăn cho ${ids.length} HS đang hiển thị.`);
  };
  
  const addPhuThuHS = (sid, ten, soTien) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten, soTien: Number(soTien) || 0 }] } } });
    logAction(`Thêm khoản riêng "${ten}" ${Number(soTien) || 0}đ cho HS "${hsTen(sid)}" (T${ym})`);
  };
  
  const delPhuThuHS = (sid, pid) => {
    if (locked) return;
    const cur = mData.fees[sid];
    const pt = (cur.phuThu || []).find((p) => p.id === pid);
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: (cur.phuThu || []).filter((p) => p.id !== pid) } } });
    logAction(`Xóa khoản riêng "${pt?.ten || "?"}" của HS "${hsTen(sid)}" (T${ym})`);
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

  const tk = useMemo(() => tinhTKThang(allRows, mData, meta), [allRows, mData, meta]);

  return {
    meta, students, month, year, setMonth, setYear,
    mData, ddData, leData, ddPrev, nextChot, loading, loadErr, loadErrKind, ddOk, reloadDD, seeded, ym,
    reseedAll, upMeta, upStudents, upMData, upDDData, upLeData,
    taoThang, delThang, setRec, thuDuNhieu, setKhoan, resetKhoan,
    resetAllKhoan, setNgayAnAll, addPhuThuHS, delPhuThuHS,
    allRows, ddRows, tk, getLop, locked, prevDebt, prevDebtStale
  };
}
