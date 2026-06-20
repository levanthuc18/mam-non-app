import { useState, useEffect } from "react";
import { C, font, fmt, sList, sGet, ymKey, lopOfMonth, tinhPSFromRec, PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, KHOAN, noDau, logAction } from "./lib.js";
import { Card, NumInput, ABBtn, PLBadge } from "./ui.jsx";

export function StudentProfile({ studentId, store, onBack }) {
  const { meta, students, ym, upStudents } = store;
  const student = students.find(s => s.id === studentId);
  const [activeTab, setActiveTab] = useState("info");
  
  if (!student) return <div style={{ padding: 20, textAlign: "center", color: C.sub }}>Đang tải...</div>;
  const lopTen = meta.classes.find(c => c.id === lopOfMonth(student, ym))?.ten || "?";
  
  const tabs = [
    { id: "info", label: "Thông tin" },
    { id: "thuPhi", label: "Thu phí" },
    { id: "diemDanh", label: "Điểm danh" },
    { id: "congNo", label: "Công nợ" },
    { id: "lichSu", label: "Lịch sử" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto" }}>
      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "14px 14px 10px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: C.sub, padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.ten}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
              <span>{lopTen}</span>
              <PLBadge pl={student.pl} />
              <span style={{ fontSize: 11, fontWeight: 600, color: TT_COLOR[student.trangThai] }}>{student.trangThai}</span>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 16, color: C.pine }}>
            {student.ten.charAt(0).toUpperCase()}
          </div>
        </div>
        {/* TABS */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "6px 12px", borderRadius: 99, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap",
                background: activeTab === t.id ? C.pine : C.graySoft,
                color: activeTab === t.id ? "#fff" : C.sub
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: "14px 14px 40px" }}>
        {activeTab === "info" && <InfoTab student={student} meta={meta} ym={ym} students={students} upStudents={upStudents} />}
        {activeTab === "thuPhi" && <ThuPhiTab student={student} meta={meta} />}
        {activeTab === "diemDanh" && <DiemDanhTab student={student} />}
        {activeTab === "congNo" && <CongNoTab student={student} meta={meta} />}
        {activeTab === "lichSu" && <LichSuTab student={student} />}
      </div>
    </div>
  );
}

// 1. TAB THÔNG TIN
function InfoTab({ student, meta, ym, students, upStudents }) {
  const setHS = (p) => {
    const newStudents = students.map(s => s.id === student.id ? { ...s, ...p } : s);
    upStudents(newStudents, true);
  };
  
  const chuyenLop = (lopMoi) => {
    const newStudents = students.map(s => {
      if (s.id !== student.id) return s;
      const hist = (s.lopHistory || []).filter(h => h.tuThang !== ym);
      hist.push({ tuThang: ym, lop: lopMoi });
      hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang));
      return { ...s, lopHistory: hist };
    });
    upStudents(newStudents, true);
    logAction(`Chuyển lớp HS "${student.ten}" (T${ym})`);
  };

  const inp = { padding: "9px 10px", borderRadius: 9, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: "#FAFCFA", outline: "none", width: "100%" };
  const lab = { fontSize: 11.5, color: C.sub, display: "block", marginBottom: 2 };
  
  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: C.ink }}>Thông tin cá nhân</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 100%" }}>
            <label style={lab}>Họ tên</label>
            <input defaultValue={student.ten} onBlur={(e) => setHS({ ten: e.target.value })} style={inp} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Lớp (từ tháng {ym})</label>
            <select value={lopOfMonth(student, ym) || ""} onChange={(e) => chuyenLop(e.target.value)} style={inp}>
              {meta.classes.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Phân loại</label>
            <select value={student.pl} onChange={(e) => setHS({ pl: e.target.value })} style={inp}>
              {PHAN_LOAI.map(p => <option key={p} value={p}>{PL_LABEL[p]}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Trạng thái</label>
            <select value={student.trangThai} onChange={(e) => setHS({ trangThai: e.target.value })} style={inp}>
              {TRANG_THAI.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Người thu</label>
            <div style={{ marginTop: 2 }}><ABBtn val={student.nguoiThu} set={(p) => setHS({ nguoiThu: p })} small /></div>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Nợ đầu kỳ</label>
            <NumInput value={student.noDauKy || 0} onChange={(v) => setHS({ noDauKy: v })} w="100%" />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Ngày nhập học</label>
            <input type="date" value={student.ngayNhapHoc || ""} onChange={(e) => setHS({ ngayNhapHoc: e.target.value })} style={inp} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Ngày ra trường</label>
            <input type="date" value={student.ngayNghiHoc || ""} onChange={(e) => setHS(e.target.value ? { ngayNghiHoc: e.target.value, trangThai: "Ra trường" } : { ngayNghiHoc: "" })} style={inp} />
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: C.ink }}>Lịch sử chuyển lớp</div>
        {(student.lopHistory || []).map((h, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < student.lopHistory.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontSize: 13, color: C.sub }}>Từ {h.tuThang}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{meta.classes.find(c => c.id === h.lop)?.ten || h.lop}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// 2. TAB THU PHÍ
function ThuPhiTab({ student, meta }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const keys = await sList("mn5:thang:");
      const months = keys.map(k => k.replace("mn5:thang:", "")).filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
      const rows = [];
      for (const m of months) {
        const td = await sGet(`mn5:thang:${m}`);
        if (!td?.fees?.[student.id]) continue;
        const rec = td.fees[student.id];
        const y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
        const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
        const ddPrevM = (await sGet(`mn5:dd:${ymKey(py, pm)}`)) || {};
        const nghi = Object.keys(ddPrevM[student.id] || {}).length;
        const lop = meta.classes.find(c => c.id === lopOfMonth(student, m));
        const ps = tinhPSFromRec(student, rec, lop, nghi).tong;
        const tt = Number(rec.thucThu) || 0;
        rows.push({ thang: m, ps, tt, no: ps - tt, daChot: td.daChot });
      }
      setHistory(rows.reverse());
      setLoading(false);
    })();
  }, [student.id]);

  if (loading) return <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Đang tải...</div>;

  return (
    <div>
      {history.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Chưa có dữ liệu thu phí</div>}
      {history.map(h => (
        <Card key={h.thang} style={{ marginBottom: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Tháng {h.thang.slice(5)}/{h.thang.slice(0, 4)}</div>
            {h.daChot && <span style={{ fontSize: 11, background: C.goldSoft, color: "#7A5E12", padding: "2px 8px", borderRadius: 99 }}>🔒 Đã chốt</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, padding: "3px 0" }}>
            <span>Phải thu</span><b style={{ color: C.ink }}>{fmt(h.ps)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, padding: "3px 0" }}>
            <span>Đã thu</span><b style={{ color: h.tt >= h.ps ? C.green : C.blueA }}>{fmt(h.tt)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", marginTop: 4, borderTop: `1px solid ${C.line}`, fontWeight: 700 }}>
            <span style={{ color: h.no > 0 ? C.coral : h.no < 0 ? C.green : C.sub }}>
              {h.no > 0 ? "Còn nợ" : h.no < 0 ? "Thu thừa" : "Đủ"}
            </span>
            <span style={{ color: h.no > 0 ? C.coral : h.no < 0 ? C.green : C.sub }}>
              {fmt(Math.abs(h.no))}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 3. TAB ĐIỂM DANH
function DiemDanhTab({ student }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const keys = await sList("mn5:dd:");
      const months = keys.map(k => k.replace("mn5:dd:", "")).filter(m => /^\d{4}-\d{2}$/.test(m)).sort().reverse();
      const rows = [];
      for (const m of months) {
        const dd = await sGet(`mn5:dd:${m}`);
        const att = dd?.[student.id] || {};
        const soNghi = Object.keys(att).length;
        if (soNghi === 0) continue;
        const [y, mo] = m.split("-").map(Number);
        const days = new Date(y, mo, 0).getDate();
        const soNgayHoc = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
          const dw = new Date(y, mo - 1, d).getDay();
          return dw !== 0 && !att[d];
        }).length;
        rows.push({ thang: m, soNghi, soNgayHoc, chiTiet: att });
      }
      setHistory(rows);
    })();
  }, [student.id]);

  return (
    <div>
      {history.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Bé chưa nghỉ ngày nào 🎉</div>}
      {history.map(h => (
        <Card key={h.thang} style={{ marginBottom: 8 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Tháng {h.thang.slice(5)}/{h.thang.slice(0, 4)}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Nghỉ <b style={{ color: C.coral }}>{h.soNghi}</b> buổi · Đi học <b style={{ color: C.green }}>{h.soNgayHoc}</b> buổi
            </div>
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(h.chiTiet).map(d => (
              <span key={d} style={{ fontSize: 12, background: C.coralSoft, color: C.coral, padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>
                Ngày {d}
              </span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// 4. TAB CÔNG NỢ
function CongNoTab({ student, meta }) {
  const [debt, setDebt] = useState(null);

  useEffect(() => {
    (async () => {
      let luyKe = student.noDauKy || 0;
      const keys = await sList("mn5:thang:");
      const months = keys.map(k => k.replace("mn5:thang:", "")).filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
      const chiTiet = [];
      for (const m of months) {
        const td = await sGet(`mn5:thang:${m}`);
        if (!td?.fees?.[student.id]) continue;
        const rec = td.fees[student.id];
        const y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
        const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
        const ddPrevM = (await sGet(`mn5:dd:${ymKey(py, pm)}`)) || {};
        const nghi = Object.keys(ddPrevM[student.id] || {}).length;
        const lop = meta.classes.find(c => c.id === lopOfMonth(student, m));
        const ps = tinhPSFromRec(student, rec, lop, nghi).tong;
        const tt = Number(rec.thucThu) || 0;
        luyKe += ps - tt;
        chiTiet.push({ thang: m, ps, tt, no: ps - tt });
      }
      setDebt({ luyKe, chiTiet });
    })();
  }, [student.id]);

  if (!debt) return <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Đang tính...</div>;

  return (
    <div>
      <Card style={{ marginBottom: 12, background: debt.luyKe > 0 ? C.coralSoft : debt.luyKe < 0 ? C.greenSoft : C.graySoft, borderColor: debt.luyKe > 0 ? "#EFC9BF" : debt.luyKe < 0 ? "#BFE3CC" : C.line }}>
        <div style={{ fontSize: 12, color: debt.luyKe > 0 ? C.coral : debt.luyKe < 0 ? C.green : C.sub, fontWeight: 600 }}>
          {debt.luyKe > 0 ? "Còn nợ" : debt.luyKe < 0 ? "Đóng dư" : "Không nợ"}
        </div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, color: debt.luyKe > 0 ? C.coral : debt.luyKe < 0 ? C.green : C.ink }}>
          {fmt(Math.abs(debt.luyKe))} đ
        </div>
        {student.noDauKy > 0 && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Nợ đầu kỳ: {fmt(student.noDauKy)}</div>}
      </Card>

      {debt.chiTiet.map(c => (
        <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
          <span style={{ color: C.sub }}>Tháng {c.thang.slice(5)}/{c.thang.slice(0, 4)}</span>
          <div style={{ textAlign: "right" }}>
            <div>Phải {fmt(c.ps)} · Thu {fmt(c.tt)}</div>
            <div style={{ color: c.no > 0 ? C.coral : c.no < 0 ? C.green : C.sub, fontWeight: 700 }}>
              {c.no > 0 ? `Nợ ${fmt(c.no)}` : c.no < 0 ? `Dư ${fmt(-c.no)}` : "Đủ"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 5. TAB LỊCH SỬ
function LichSuTab({ student }) {
  const [log, setLog] = useState([]);

  useEffect(() => {
    (async () => {
      const all = (await sGet("mn5:log")) || [];
      const filtered = all.filter(e => e.act.includes(student.ten) || e.act.includes(student.id));
      setLog(filtered.slice(0, 50));
    })();
  }, [student.id]);

  return (
    <div>
      {log.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Chưa có thao tác nào được ghi</div>}
      {log.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
          <span style={{ color: C.sub, fontSize: 11, whiteSpace: "nowrap" }}>{new Date(e.t).toLocaleDateString("vi-VN")}</span>
          <span><b style={{ color: e.who === "Admin" ? C.pine : C.blueA }}>{e.who}</b> · {e.act}</span>
        </div>
      ))}
    </div>
  );
}
