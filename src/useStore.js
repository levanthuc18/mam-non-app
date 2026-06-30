import { useState, useEffect, useRef, useMemo } from "react";
import {
  ymKey, stripYm, uid, noDau,
  sGet, sSet, sList, sDel, MEM, CHOT_MEM, saveChotMem,
  SB, TT_THU_PHI, KHOAN, SEED_META,
  defaultKhoan, seedThangData, lopOfMonth,
  soBuoiT7Auto, soNgayHoc, ngayNhapHocTrongThang, tinhPSFromRec,
  trangThaiThu, ask, toast, logAction
} from "./lib.js";

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
  const [seeded, setSeeded] = useState(false);
  const [prevDebt, setPrevDebt] = useState({});
  const saveT = useRef({});
  const ym = ymKey(year, month);

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
  })(); }, []);

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
  })(); }, [ym, metaReady]);

  useEffect(() => {
    if (!SB || !metaReady) return;
    const t = setInterval(async () => {
      delete MEM[`mn5:dd:${ym}`]; const dd = await sGet(`mn5:dd:${ym}`); setDDData(dd || {});
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

  const tk = useMemo(() => {
    const s = { ps: 0, thu: 0, no: 0, A: 0, B: 0, chiA: 0, chiB: 0, traA: 0, traB: 0, rutA: 0, rutB: 0, noList: [], noAB_AtoB: 0, noAB_BtoA: 0 };
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
      if (c.loai === "RUT_LOI") {
        if (c.nguoiChi === "A") s.rutA += kk; else s.rutB += kk;
        return;
      }
      if (c.nguoiChi === "A") { s.chiA += e; s.traA += kk; } else { s.chiB += e; s.traB += kk; }
    });
    const dk = meta?.soDuDauKy || {};
    s.noAB_AtoB += (dk.AnoB || 0); s.noAB_BtoA += (dk.BnoA || 0);
    return s;
  }, [allRows, mData, meta]);

  return {
    meta, students, month, year, setMonth, setYear,
    mData, ddData, leData, ddPrev, nextChot, loading, seeded, ym,
    reseedAll, upMeta, upStudents, upMData, upDDData, upLeData,
    taoThang, delThang, setRec, thuDuNhieu, setKhoan, resetKhoan,
    resetAllKhoan, setNgayAnAll, addPhuThuHS, delPhuThuHS,
    allRows, ddRows, tk, getLop, locked, prevDebt
  };
}
