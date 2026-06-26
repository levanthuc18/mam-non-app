import { Logo } from "./Brand.jsx";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  C, font, fmt, binOf, ask, toast, logAction, uid,
  LOAI_CHI, ymKey, lopOfMonth, tinhPSFromRec, noDau,
  sGet, sList
} from "./lib.js";
import {
  Card, BottomSheet, NumInput, ABBtn, Badge
} from "./ui.jsx";

export function QRBox({ bank, amount, noiDung }) {
  const bin = binOf(bank?.nh);
  const [err, setErr] = useState(false);
  if (!bin || !bank?.stk || err) {
    return <div style={{ width: 88, height: 88, borderRadius: 8, background: "#fff", border: `1.5px solid ${C.pine}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.sub, textAlign: "center", flexShrink: 0, padding: 4 }}>{bin ? "QR" : "QR (ngân hàng chưa hỗ trợ)"}</div>;
  }
  const url = `https://img.vietqr.io/image/${bin}-${bank.stk}-compact.png?` + (amount > 0 ? `amount=${Math.round(amount)}&` : "") + `addInfo=${encodeURIComponent(noiDung || "")}`;
  return <img src={url} alt="QR chuyển khoản" onError={() => setErr(true)} style={{ width: 88, height: 88, borderRadius: 8, background: "#fff", border: `1.5px solid ${C.pine}`, flexShrink: 0, objectFit: "contain" }} />;
}

export function PhieuThu({ phieuRow, allRows, setPhieuId, getLop, meta, month, year, upMeta, mData, upMData }) {
  const nguoiThu = phieuRow.hs.nguoiThu;
  const bienLai = phieuRow.rec.bienLai || null;
  const namHoc = month >= 8 ? `${year}–${year + 1}` : `${year - 1}–${year}`;

  const inPhieu = () => {
    if (!bienLai) {
      const next = (meta.soBienLai?.[nguoiThu] || 0) + 1;
      const bl = `BL-${nguoiThu}-${String(next).padStart(4, "0")}`;
      upMeta({ ...meta, soBienLai: { ...(meta.soBienLai || {}), [nguoiThu]: next } });
      upMData({ ...mData, fees: { ...mData.fees, [phieuRow.hs.id]: { ...mData.fees[phieuRow.hs.id], bienLai: bl } } });
      setTimeout(() => window.print(), 100);
    } else {
      window.print();
    }
  };

  return (
    <>
      {/* CSS ép khít 1 trang A5 */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0.4cm 0.6cm;
          }
          html, body {
            height: 99%;
            overflow: hidden;
          }
          #phieu-in {
            box-shadow: none !important;
            background: #fff !important;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Select chọn học sinh */}
      <select className="no-print" value={phieuRow.hs.id} onChange={(e) => setPhieuId(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, marginBottom: 14, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card }}>
        {allRows.filter((r) => r.coRec).map((r) => <option key={r.hs.id} value={r.hs.id}>{r.hs.ten} — {r.lop?.ten}</option>)}
      </select>

      <div id="phieu-in" style={{ background: "#FFFEF9", padding: "0 0 10px", minHeight: "135mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        
        {/* Khối nội dung chính */}
        <div>
          {/* Đường răng cưa */}
          <div className="no-print" style={{ height: 6, background: `linear-gradient(45deg, transparent 33.33%, #FFFEF9 33.33%, #FFFEF9 66.66%, transparent 66.66%), linear-gradient(-45deg, transparent 33.33%, #FFFEF9 33.33%, #FFFEF9 66.66%, transparent 66.66%)`, backgroundColor: C.bg, backgroundSize: "14px 20px" }} />
          
          <div style={{ maxWidth: 420, margin: "0 auto", padding: "8px 10px 0" }}>
            
            {/* Header đối xứng: Logo trái - Địa chỉ phải */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: 10 }}>
              <div style={{ flexShrink: 0 }}>
                <Logo mark={false} w={90} />
              </div>
              <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', fontSize: "11px", color: C.ink, lineHeight: "1.35", fontWeight: "bold", textAlign: "right" }}>
                <div style={{ fontSize: "12.5px", textTransform: "uppercase" }}>{meta.tenTruong || "Mầm Non Tuổi Thần Tiên"}</div>
                <div>Địa chỉ: {meta.diaChi || "Lạc Nông- Mai Đình- Sóc Sơn - Hà Nội"}</div>
                <div>Điện thoại: {meta.dienThoai || "0945.958.222"}</div>
              </div>
            </div>

            {/* Tiêu đề */}
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 16.5, color: C.ink, letterSpacing: "0.5px" }}>
                PHIẾU THÔNG BÁO HỌC PHÍ
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, marginTop: 1 }}>
                Tháng {month < 10 ? `0${month}` : month} năm {year}
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 0.5, fontStyle: "italic", fontWeight: 500 }}>
                Năm học {namHoc}
              </div>
            </div>

            {/* Đường kẻ */}
            <div style={{ margin: "8px 0 6px", borderTop: `1px solid ${C.line || "#E2E8F0"}` }} />

            {/* Thông tin học sinh */}
            <div style={{ fontSize: 12, color: C.ink, lineHeight: "1.4", marginBottom: 6 }}>
              <div>Họ và tên trẻ: <b>{phieuRow.hs.ten}</b></div>
              <div>Lớp: <b>{phieuRow.lop?.ten || "Sóc Nhí"}</b></div>
            </div>

            {/* Bảng phí chi tiết */}
            <div style={{ fontSize: 12, marginTop: 6 }}>
              {phieuRow.ps.dong.map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px dotted ${C.line}` }}>
                  <span style={{ color: C.sub }}>{l}</span>
                  <span>{fmt(v)}</span>
                </div>
              ))}
              {phieuRow.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px dotted ${C.line}`, color: phieuRow.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{phieuRow.noTruoc > 0 ? "Nợ tháng trước" : "Dư tháng trước"}</span>
                  <span>{phieuRow.noTruoc > 0 ? fmt(phieuRow.noTruoc) : "−" + fmt(-phieuRow.noTruoc)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontFamily: font.display, fontWeight: 800, fontSize: 14 }}>
                <span>TỔNG PHẢI THU</span>
                <span>{fmt(phieuRow.tongPhaiThu)} đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: C.sub }}>Đã thu</span>
                <span>{fmt(phieuRow.rec.thucThu)} đ</span>
              </div>
              {phieuRow.conNo !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: phieuRow.conNo > 0 ? C.coral : C.amber, fontWeight: 600 }}>
                  <span>{phieuRow.conNo > 0 ? "Còn lại cần đóng" : "Thu thừa"}</span>
                  <span>{fmt(Math.abs(phieuRow.conNo))} đ</span>
                </div>
              )}
            </div>

            {/* QR + Thông tin chuyển khoản */}
            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: C.pineSoft, display: "flex", gap: 10, alignItems: "center" }}>
              <QRBox bank={meta.bank[nguoiThu]} amount={Math.max(0, phieuRow.conNo)} noiDung={`Hoc phi ${phieuRow.hs.ten} T${month}`} />
              <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                <b>Thông tin tài khoản</b><br />
                {meta.bank[nguoiThu].chu}<br />
                {meta.bank[nguoiThu].stk} · {meta.bank[nguoiThu].nh}
              </div>
            </div>

          </div>
        </div>

        {/* Chân trang: Ghi chú + Mã phiếu + Ngày tháng */}
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 10px", width: "100%" }}>
          
          {/* Ghi chú */}
          <div style={{ padding: "6px 8px", backgroundColor: "#F8FAFC", borderRadius: 4, fontSize: 10, color: C.sub || "#64748B", lineHeight: "1.4", textAlign: "center", marginBottom: 8 }}>
            <div style={{ marginBottom: 2 }}>
              Đóng tiền từ ngày <b>01/{month < 10 ? `0${month}` : month}</b> đến <b>10/{month < 10 ? `0${month}` : month}</b> tại văn phòng hoặc giáo viên tại lớp.
            </div>
            <div style={{ fontStyle: "italic", fontWeight: 500 }}>
              Vui lòng kiểm tra thông tin trước khi thanh toán. Xin cảm ơn!
            </div>
          </div>

          {/* Mã phiếu + Ngày tháng đối xứng */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 9.5, color: C.sub, paddingTop: 4, borderTop: `1px dashed ${C.line || "#E2E8F0"}` }}>
            <div>
              {bienLai ? <span>Mã phiếu: <b style={{ color: C.ink }}>{bienLai}</b></span> : "Mã phiếu: (cấp khi in)"}
            </div>
            <div>
              Ngày {new Date().getDate()} tháng {((new Date().getMonth() + 1).toString().padStart(2, '0'))} năm {new Date().getFullYear()}
            </div>
          </div>

        </div>

      </div>

      <button className="no-print" onClick={inPhieu} style={{ marginTop: 14, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        {bienLai ? "🖨 In / Lưu PDF" : "✓ Cấp số biên lai & In"}
      </button>
    </>
  );
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

  useEffect(() => {
    let huy = false;
    (async () => {
      const dk = meta?.soDuDauKy || {};
      let giuA = dk.tienMatA || 0, giuB = dk.tienMatB || 0;
      let noNCC = 0; 
      const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).map((k) => k.replace("mn5:thang:", "")).filter((m) => m <= ym).sort();
      const ls = [];
      for (const m of keys) {
        const td = await sGet(`mn5:thang:${m}`); if (!td) continue;
        const my = Number(m.slice(0, 4)), mmo = Number(m.slice(5));
        const pmo = mmo === 1 ? 12 : mmo - 1, pyy = mmo === 1 ? my - 1 : my;
        const ddPrevM = (await sGet(`mn5:dd:${ymKey(pyy, pmo)}`)) || {};
        let thuA = 0, thuB = 0, chiA = 0, chiB = 0, traA = 0, traB = 0, psA = 0, psB = 0;
        let thangNoNCC = 0, tnPhaiThang = 0, tnThuThang = 0;
        Object.entries(td.fees || {}).forEach(([sid, rec]) => {
          const hs = students.find((s) => s.id === sid); if (!hs) return;
          const tt = Number(rec.thucThu) || 0;
          if (hs.nguoiThu === "A") thuA += tt; else if (hs.nguoiThu === "B") thuB += tt;
          const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, m));
          const nghi = Object.keys(ddPrevM[sid] || {}).length;
          const ps = tinhPSFromRec(hs, rec, lop, nghi).tong;
          if (hs.nguoiThu === "A") psA += ps; else if (hs.nguoiThu === "B") psB += ps;
        });
        (td.thuNgoai || []).forEach((k) => {
          const tt = Number(k.thucThu) || 0, st = Number(k.soTien) || 0;
          tnPhaiThang += st; tnThuThang += tt;
          if (k.nguoiThu === "A") { thuA += tt; psA += st; } else if (k.nguoiThu === "B") { thuB += tt; psB += st; }
        });
        (td.chiPhi || []).forEach((c) => {
          const e = Number(c.soTien) || 0, kk = Number(c.daTra) || 0;
          if (c.loai === "CHUYEN") { if (c.huong === "A->B") { thuA -= e; thuB += e; } else { thuB -= e; thuA += e; } return; }
          if (c.loai === "NO_AB") return;
          if (c.nguoiChi === "A") { chiA += e; traA += kk; } else { chiB += e; traB += kk; }
          thangNoNCC += (e - kk); 
        });
        noNCC += thangNoNCC;
        giuA += thuA - traA; giuB += thuB - traB;
        const [yy, mm] = m.split("-");
        const psThang = psA + psB, chiThang = chiA + chiB, thuThang = thuA + thuB, traThang = traA + traB;
        ls.push({ thang: `T${Number(mm)}/${yy}`, mm: Number(mm), yy: Number(yy), laiKeToan: psThang - chiThang, laiTienMat: thuThang - traThang, psThang, chiThang, thuThang, traThang, noNCC, thuA, thuB, traA, traB, chiA, chiB, giuACum: giuA, giuBCum: giuB, deltaA: thuA - traA, deltaB: thuB - traB, tnPhai: tnPhaiThang, tnThu: tnThuThang, noNCCThang: thangNoNCC });
      }
      if (!huy) { setLuyKe({ giuA, giuB, noNCC }); setLichSu(ls); }
    })();
    return () => { huy = true; };
  }, [meta, students, ym, mData]);

  const cp = mData.chiPhi || [];
  const [nd, setNd] = useState(""); const [so, setSo] = useState(""); const [ng, setNg] = useState("A"); const [loai, setLoai] = useState("PHAT_SINH"); const [huong, setHuong] = useState("A->B");
  const [showCoDinh, setShowCoDinh] = useState(true);
  const add = () => {
    if (loai === "TRA_NO") {
      if (!nd.trim()) return;
      upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim(), soTien: 0, nguoiChi: ng, daTra: Number(so) || 0, loai: "TRA_NO" }] });
      setNd(""); setSo(""); return;
    }
    if (!so) return;
    if (loai === "CHUYEN") { upMData({ ...mData, chiPhi: [...cp, { id: uid(), noiDung: nd.trim() || "Chuyển tiền", soTien: Number(so), loai: "CHUYEN", huong, daTra: 0 }] }); setNd(""); setSo(""); return; }
    if (!nd.trim()) return;
    const item = { id: uid(), noiDung: nd.trim(), soTien: Number(so), nguoiChi: ng, daTra: 0, loai }; if (loai === "NO_AB") item.huong = huong;
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
  const tongTienMat = (luyKe ? luyKe.giuA + luyKe.giuB : (tk.A - tk.traA) + (tk.B - tk.traB));

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
      const snapNCC = (mData.chiPhi || []).reduce((a, c) => (c.loai === "CHUYEN" || c.loai === "NO_AB") ? a : a + ((Number(c.soTien) || 0) - (Number(c.daTra) || 0)), 0);
      await upMData({ ...mData, daChot: true, noLuyKe, snapThuNgoai, snapNCC });
      logAction(`Chốt tháng ${month}/${year}`);
      toast("Đã chốt tháng.");
    }
  };
  const moChot = async () => { if (await ask("Mở khóa tháng đã chốt để chỉnh sửa lại?", { okText: "Mở khóa" })) { const { noLuyKe, snapThuNgoai, snapNCC, ...rest } = mData; await upMData({ ...rest, daChot: false }); logAction(`Mở khóa tháng ${month}/${year}`); toast("Đã mở khóa."); } };

  const giuThangA = tk.A - tk.traA, giuThangB = tk.B - tk.traB;

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

  return (
    <>
      <Card style={{ marginBottom: 12, boxShadow: "0 3px 12px -8px rgba(23,107,91,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>📊</span>
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
          <button onClick={() => setTab && setTab("no")} style={{ width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 9, border: `1px solid #EFC9BF`, background: C.coralSoft, color: C.coral, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>🔴 {noRows.length} HS còn nợ — {fmt(conNoAll)} đ ❯</button>
        )}
      </Card>

      {cbGroups.length > 0 && (
        <button onClick={() => setSheetCB(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid #EAD8A0`, background: C.amberSoft, color: "#7A5E12", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🚨 Cảnh báo: {cbGroups.map((g) => `${g[0]} (${g[1].length})`).join(" · ")}</span>
          <span style={{ flexShrink: 0, fontWeight: 700 }}>❯</span>
        </button>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>💸</span><span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>Chi phí tháng {month}</span></div>
          <span style={{ fontSize: 12, color: C.sub }}>Tổng chi: <b style={{ color: C.ink }}>{fmt(tongChi)}</b></span>
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>📊 {cpDone.length}/{cpKhoan.length} khoản đã xử lý</div>
        <div style={{ height: 8, borderRadius: 99, background: C.line, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ width: cpPct + "%", height: "100%", background: cpPct >= 100 ? C.green : C.pine, borderRadius: 99, transition: "width .3s" }} />
        </div>
        {cpChua.slice(0, 2).map((c) => (
          <div key={c.id} style={{ fontSize: 13, color: C.ink, padding: "3px 0" }}>🔴 {c.noiDung}: <span style={{ color: C.coral, fontWeight: 600 }}>{(Number(c.daTra) || 0) > 0 ? "Trả 1 phần" : "Chưa trả"}</span></div>
        ))}
        {cpKhoan.length > 0 && cpChua.length === 0 && <div style={{ fontSize: 13, color: C.green, fontWeight: 600, padding: "3px 0" }}>✓ Đã xử lý hết các khoản chi</div>}
        {cpKhoan.length === 0 && <div style={{ fontSize: 13, color: C.sub, padding: "3px 0" }}>Chưa có khoản chi nào — bấm Quản lý để thêm.</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => setSheetCP(true)} style={drillBtn}>Quản lý ❯</button>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, background: C.greenSoft, borderColor: "#BFE3CC" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 16 }}>🤝</span><span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>Lợi nhuận & chia quỹ</span></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.green, fontWeight: 600 }}>LN kế toán</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: lnKeToan < 0 ? C.coral : C.green }}>{fmt(lnKeToan)}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.blueA, fontWeight: 600 }}>LN tiền mặt</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: lnTienMat < 0 ? C.coral : C.blueA }}>{fmt(lnTienMat)}</div></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.blueA, fontWeight: 600 }}>Quỹ A giữ</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: (luyKe?.giuA ?? 0) < 0 ? C.coral : C.blueA }}>{luyKe ? fmt(luyKe.giuA) : "…"}</div></div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.card, borderRadius: 10 }}><div style={{ fontSize: 10.5, color: C.violetB, fontWeight: 600 }}>Quỹ B giữ</div><div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: (luyKe?.giuB ?? 0) < 0 ? C.coral : C.violetB }}>{luyKe ? fmt(luyKe.giuB) : "…"}</div></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => setSheetLN(true)} style={drillBtn}>Chi tiết ❯</button>
        </div>
      </Card>

      <button onClick={() => setSheetLS(true)} style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>📈 Lịch sử các tháng trước</span><span style={{ color: C.sub, fontWeight: 700 }}>❯</span>
      </button>

      {!locked
        ? <button onClick={chotThang} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.gold}`, background: C.goldSoft, color: "#7A5E12", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>🔒 Chốt tháng {month}/{year}</button>
        : <button onClick={moChot} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>🔓 Mở khóa tháng {month}/{year}</button>}
      {!locked && (
        <div style={{ marginTop: 8 }}>
          {!showDelConfirm ? (
            <button onClick={() => setShowDelConfirm(true)} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.coralSoft}`, background: C.card, color: C.coral, fontFamily: font.body, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🗑 Xóa bảng thu tháng này (tạo lại)</button>
          ) : (
            <div style={{ background: C.coralSoft, borderRadius: 12, padding: 12, border: `1.5px solid ${C.coral}` }}>
              <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, marginBottom: 8 }}>⚠️ Nhập "XOA" để xác nhận xóa bảng thu tháng {month}/{year}</div>
              <input value={delConfirmText} onChange={(e) => setDelConfirmText(e.target.value)} placeholder="Nhập XOA" style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 14, marginBottom: 8, textAlign: "center", fontWeight: 700, textTransform: "uppercase" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowDelConfirm(false); setDelConfirmText(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Hủy</button>
                <button onClick={() => { if (delConfirmText.trim().toUpperCase() === "XOA") { delThang(); setShowDelConfirm(false); setDelConfirmText(""); } else { toast("Nhập sai — gõ XOA để xác nhận"); } }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: delConfirmText.trim().toUpperCase() === "XOA" ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 13, cursor: delConfirmText.trim().toUpperCase() === "XOA" ? "pointer" : "default" }}>🗑 Xóa</button>
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
              <div style={{ fontWeight: 600 }}>💰 Trả nợ NCC · <b style={{ color: c.nguoiChi === "A" ? C.blueA : C.violetB }}>[{c.nguoiChi}]</b> {c.noiDung} · {fmt(k)} đ</div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}>🗑</button>}
            </div>
          );
          if (isCT) return (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <div style={{ fontWeight: 600 }}>🔄 Chuyển tiền <b style={{ color: c.huong === "A->B" ? C.blueA : C.violetB }}>{c.huong === "A->B" ? "A → B" : "B → A"}</b> · {fmt(e)} đ</div>
              {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", padding: 4 }}>🗑</button>}
            </div>
          );
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
                  {!locked && <button onClick={() => del(c.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", marginLeft: "auto", padding: 4 }}>🗑</button>}
                </div>
                {k > e && <div style={{ fontSize: 11.5, color: C.amber, background: C.amberSoft, borderRadius: 7, padding: "4px 8px" }}>⚠️ Đã trả nhiều hơn phải trả {fmt(k - e)} đ</div>}
              </div>
            </div>
          );
        })}
        {!locked && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              <input value={nd} onChange={(e) => setNd(e.target.value)} placeholder={loai === "TRA_NO" ? "Tên nợ (VD: Thực phẩm T4)" : "Khoản chi"} style={{ flex: "2 1 150px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
              {loai !== "TRA_NO" && (
                <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <select value={loai} onChange={(e) => { setLoai(e.target.value); if (e.target.value === "TRA_NO") { setSo("0"); } }} style={{ padding: "8px 8px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 12.5, fontFamily: font.body, background: "#fff" }}>{LOAI_CHI.map((l) => <option key={l} value={l}>{l === "PHAT_SINH" ? "Phát sinh" : l === "CO_DINH" ? "Cố định" : l === "NO_AB" ? "Nợ A↔B" : l === "TRA_NO" ? "💰 Trả nợ NCC" : "🔄 Chuyển tiền"}</option>)}</select>
              {(loai === "NO_AB" || loai === "CHUYEN") ? <select value={huong} onChange={(e) => setHuong(e.target.value)} style={{ padding: "8px 8px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 12.5, fontFamily: font.body, background: "#fff" }}><option value="A->B">A → B</option><option value="B->A">B → A</option></select> : <ABBtn val={ng} set={setNg} small />}
              <button onClick={() => { if (loai === "TRA_NO" && !nd.trim()) { toast("Nhập tên nợ cần trả"); return; } add(); }} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", marginLeft: "auto" }}>+ Thêm</button>
            </div>
          </div>
        )}
        {locked && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 10, textAlign: "center" }}>🔒 Tháng đã chốt — chỉ xem.</div>}
        <button onClick={() => setSheetCP(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Hoàn thành</button>
      </BottomSheet>

      <BottomSheet open={sheetLN} onClose={() => setSheetLN(false)} title={`Lợi nhuận & chia quỹ — T${month}/${year}`}>
        <div style={{ background: "#FAFCFA", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>🧾 Doanh thu (thực thu)</span>
            <b style={{ fontFamily: font.display, fontSize: 17, color: C.ink }}>{fmt(tk.thu)} đ</b>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12.5 }}>
            <span style={{ flex: 1 }}>A thu: <b style={{ color: C.blueA }}>{fmt(tk.A)}</b></span>
            <span style={{ flex: 1 }}>B thu: <b style={{ color: C.violetB }}>{fmt(tk.B)}</b></span>
          </div>
        </div>
        <div style={{ background: "#FAFCFA", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>💸 Đã chi (tiền mặt ra)</span>
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

        <div style={sheetTitle}>📊 Phân chia tài chính T{month}</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Tổng LN kế toán toàn trường: <b style={{ color: lnKeToan < 0 ? C.coral : C.green, fontSize: 14 }}>{fmt(lnKeToan)} đ</b></div>
        {!locked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: C.goldSoft, borderRadius: 10, padding: "8px 10px" }}>
            <span style={{ fontSize: 12, color: "#7A5E12", fontWeight: 600 }}>Tỷ lệ chia</span>
            <button onClick={() => upMeta({ ...meta, tyLeLaiA: Math.max(0, tyLeA - 5) })} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 800, fontSize: 17, cursor: "pointer", lineHeight: 1 }}>−</button>
            <span style={{ minWidth: 92, textAlign: "center", fontSize: 13, fontWeight: 700 }}>A {tyLeA}% / B {100 - tyLeA}%</span>
            <button onClick={() => upMeta({ ...meta, tyLeLaiA: Math.min(100, tyLeA + 5) })} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 800, fontSize: 17, cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>
        )}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ display: "flex", background: "#FAFCFA", fontSize: 11.5, color: C.sub, fontWeight: 700, padding: "7px 10px" }}>
            <span style={{ flex: 1.5 }}>Nội dung</span>
            <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Người A</span>
            <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Người B</span>
          </div>
          <div style={{ display: "flex", fontSize: 12.5, padding: "8px 10px", borderTop: `1px solid ${C.line}` }}>
            <span style={{ flex: 1.5 }}>💰 Lãi được chia</span>
            <b style={{ flex: 1, textAlign: "right", color: C.blueA }}>{fmt(Math.round(lnKeToan * tyLeA / 100))}</b>
            <b style={{ flex: 1, textAlign: "right", color: C.violetB }}>{fmt(lnKeToan - Math.round(lnKeToan * tyLeA / 100))}</b>
          </div>
          <div style={{ display: "flex", fontSize: 12.5, padding: "8px 10px", borderTop: `1px solid ${C.line}` }}>
            <div style={{ flex: 1.5 }}>🏦 Quỹ trường đang giữ<div style={{ fontSize: 10, color: C.sub }}>(lũy kế đến hết tháng)</div></div>
            <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: (luyKe?.giuA ?? 0) < 0 ? C.coral : C.blueA }}>{luyKe ? fmt(luyKe.giuA) : "…"}</b><div style={{ fontSize: 10, color: giuThangA < 0 ? C.coral : C.sub }}>T{month}: {fmt(giuThangA)}</div></div>
            <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: (luyKe?.giuB ?? 0) < 0 ? C.coral : C.violetB }}>{luyKe ? fmt(luyKe.giuB) : "…"}</b><div style={{ fontSize: 10, color: giuThangB < 0 ? C.coral : C.sub }}>T{month}: {fmt(giuThangB)}</div></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 2 }}><span style={{ color: C.sub }}>Tổng quỹ trường đang giữ</span><b style={{ color: tongTienMat < 0 ? C.coral : C.pine }}>{fmt(tongTienMat)} đ</b></div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>Quỹ âm = A/B đang ứng tiền túi, trường nợ lại.</div>

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
              const aKT = splitA(r.laiKeToan), bKT = r.laiKeToan - aKT;
              return (
              <div key={r.thang} style={{ border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ background: C.pineSoft, padding: "8px 12px", fontFamily: font.display, fontWeight: 800, fontSize: 14.5, color: C.pine }}>📅 Tháng {r.mm}/{r.yy}</div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={rowLine}><span style={{ color: C.sub, fontWeight: 600 }}>🧾 Doanh thu (thực thu)</span><b style={{ color: C.ink }}>{fmt(r.thuThang)} đ</b></div>
                  {sub2("A thu:", r.thuA, "B thu:", r.thuB)}
                  {(r.tnPhai > 0 || r.tnThu > 0) && (
                    <div style={{ ...rowLine, marginTop: 3, fontSize: 11.5 }}>
                      <span style={{ color: C.sub }}>💧 trong đó thu ngoài (KV4)</span>
                      <span style={{ color: C.sub }}>thu <b style={{ color: C.ink }}>{fmt(r.tnThu)}</b>{r.tnPhai - r.tnThu > 0 ? <b style={{ color: C.coral }}> · nợ {fmt(r.tnPhai - r.tnThu)}</b> : null}</span>
                    </div>
                  )}
                  <div style={{ ...rowLine, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}><span style={{ color: C.sub, fontWeight: 600 }}>💸 Chi phí xử lý (đã chi)</span><b style={{ color: C.ink }}>{fmt(r.traThang)} đ</b></div>
                  {sub2("A chi:", r.traA, "B chi:", r.traB)}
                  {(r.noNCCThang !== 0 || r.noNCC > 0) && (
                    <div style={{ ...rowLine, marginTop: 3, fontSize: 11.5 }}>
                      <span style={{ color: "#9A6B00" }}>🏭 Nợ NCC (trường nợ)</span>
                      <span style={{ color: "#9A6B00" }}>{r.noNCCThang !== 0 ? `T${r.mm}: ${r.noNCCThang > 0 ? "+" : ""}${fmt(r.noNCCThang)} · ` : ""}dồn <b>{fmt(r.noNCC)}</b></span>
                    </div>
                  )}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginBottom: 6 }}>📊 Phân chia tài chính · LN kế toán: <b style={{ color: r.laiKeToan < 0 ? C.coral : C.green }}>{fmt(r.laiKeToan)} đ</b></div>
                    <div style={{ border: `1px solid ${C.line}`, borderRadius: 9, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: "#FAFCFA", fontSize: 11, color: C.sub, fontWeight: 700, padding: "5px 9px" }}>
                        <span style={{ flex: 1.5 }}>Nội dung</span>
                        <span style={{ flex: 1, textAlign: "right", color: C.blueA }}>Người A</span>
                        <span style={{ flex: 1, textAlign: "right", color: C.violetB }}>Người B</span>
                      </div>
                      <div style={{ display: "flex", fontSize: 12, padding: "6px 9px", borderTop: `1px solid ${C.line}` }}>
                        <span style={{ flex: 1.5 }}>💰 Lãi chia ({tyLeA}/{100 - tyLeA})</span>
                        <b style={{ flex: 1, textAlign: "right", color: C.blueA }}>{fmt(aKT)}</b>
                        <b style={{ flex: 1, textAlign: "right", color: C.violetB }}>{fmt(bKT)}</b>
                      </div>
                      <div style={{ display: "flex", fontSize: 12, padding: "6px 9px", borderTop: `1px solid ${C.line}` }}>
                        <div style={{ flex: 1.5 }}>🏦 Quỹ trường giữ<div style={{ fontSize: 9.5, color: C.sub }}>(lũy kế)</div></div>
                        <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: r.giuACum < 0 ? C.coral : C.blueA }}>{fmt(r.giuACum)}</b><div style={{ fontSize: 9.5, color: r.deltaA < 0 ? C.coral : C.sub }}>T{r.mm}: {fmt(r.deltaA)}</div></div>
                        <div style={{ flex: 1, textAlign: "right" }}><b style={{ color: r.giuBCum < 0 ? C.coral : C.violetB }}>{fmt(r.giuBCum)}</b><div style={{ fontSize: 9.5, color: r.deltaB < 0 ? C.coral : C.sub }}>T{r.mm}: {fmt(r.deltaB)}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
            <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 12, padding: "10px 12px", marginBottom: 4 }}>
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 13.5, color: "#7A5E12", marginBottom: 4 }}>Σ Cộng tất cả các tháng</div>
              <div style={rowLine}><span style={{ color: C.sub }}>Tổng LN kế toán</span><b style={{ color: tongLKT < 0 ? C.coral : C.green }}>{fmt(tongLKT)} đ</b></div>
              <div style={rowLine}><span style={{ color: C.sub }}>Tổng LN tiền mặt</span><b style={{ color: tongLTM < 0 ? C.coral : C.blueA }}>{fmt(tongLTM)} đ</b></div>
              <div style={rowLine}><span style={{ color: C.sub }}>Chia lãi · A {tyLeA}% / B {100 - tyLeA}%</span><b><span style={{ color: C.blueA }}>{fmt(splitA(tongLKT))}</span> / <span style={{ color: C.violetB }}>{fmt(tongLKT - splitA(tongLKT))}</span></b></div>
            </div>
          </div>
          );
        })()}
        <button onClick={() => setSheetLS(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Hoàn thành</button>
      </BottomSheet>
    </>
  );
}
