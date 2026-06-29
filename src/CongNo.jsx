import { useState, useEffect, useMemo } from "react";
import {
  sList, sGet, ymKey, lopOfMonth, tinhPSFromRec, fmt, noDau,
  C, font, TT_COLOR
} from "./lib.js";
import { Icon } from "./Icon.jsx";
import { Card, Chips, useStickyShrink, StickyBar } from "./ui.jsx";

export function CongNoTab({ students, meta, ym, mData }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [tongNo, setTongNo] = useState(0);
  const [tongDu, setTongDu] = useState(0);
  const [noFilter, setNoFilter] = useState("all");
  const [showDetail, setShowDetail] = useState(null);
  const [tnData, setTnData] = useState(null);
  const [nccData, setNccData] = useState(null);
  const [openTn, setOpenTn] = useState(false);
  const [openNcc, setOpenNcc] = useState(false);
  const { sentinelRef, shrunk } = useStickyShrink();

  useEffect(() => { (async () => {
    setLoading(true);
    const keys = await sList("mn5:thang:");
    const months = keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
    const perHS = {};
    students.forEach((hs) => { perHS[hs.id] = { hs, phaiThu: 0, daThu: 0, chiTiet: [], noDauKy: hs.noDauKy || 0 }; });
    let tnPhai = 0, tnThu = 0; const tnChiTiet = [];
    let nccCum = 0; const nccChiTiet = [];
    for (const m of months) {
      const td = await sGet(`mn5:thang:${m}`);
      if (!td?.fees) continue;
      const y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
      const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
      const ddPrevM = (await sGet(`mn5:dd:${ymKey(py, pm)}`)) || {};
      Object.keys(td.fees).forEach((sid) => {
        if (!perHS[sid]) return;
        const rec = td.fees[sid];
        const hs = perHS[sid].hs;
        const lopId = lopOfMonth(hs, m);
        const lop = meta.classes.find((c) => c.id === lopId);
        const nghi = Object.keys(ddPrevM[sid] || {}).length;
        const ps = tinhPSFromRec(hs, rec, lop, nghi).tong;
        const tt = Number(rec.thucThu) || 0;
        perHS[sid].phaiThu += ps; perHS[sid].daThu += tt;
        perHS[sid].chiTiet.push({ thang: m, ps, tt, no: ps - tt });
      });
      // Thu ngoài (KV4) — cùng chiều thu
      const tnArr = td.thuNgoai || [];
      if (tnArr.length) {
        let mPhai = 0, mThu = 0;
        tnArr.forEach((k) => { mPhai += Number(k.soTien) || 0; mThu += Number(k.thucThu) || 0; });
        if (mPhai || mThu) { tnPhai += mPhai; tnThu += mThu; tnChiTiet.push({ thang: m, ps: mPhai, tt: mThu, no: mPhai - mThu }); }
      }
      // Nợ NCC — trường nợ ra (bỏ CHUYEN/NO_AB, gồm TRA_NO để trừ)
      let mNcc = 0;
      (td.chiPhi || []).forEach((c) => {
        if (c.loai === "CHUYEN" || c.loai === "NO_AB") return;
        mNcc += (Number(c.soTien) || 0) - (Number(c.daTra) || 0);
      });
      if (mNcc !== 0) { nccCum += mNcc; nccChiTiet.push({ thang: m, delta: mNcc, cum: nccCum }); }
    }
    let tNo = 0, tDu = 0;
    const arr = Object.values(perHS).map((x) => {
      const luyKe = x.noDauKy + x.phaiThu - x.daThu; 
      if (luyKe > 0) tNo += luyKe; else tDu += -luyKe;
      return { ...x, luyKe };
    }).sort((a, b) => b.luyKe - a.luyKe);
    const tnLuyKe = tnPhai - tnThu;
    if (tnLuyKe > 0) tNo += tnLuyKe; else tDu += -tnLuyKe;
    setTnData({ luyKe: tnLuyKe, phai: tnPhai, thu: tnThu, chiTiet: tnChiTiet });
    setNccData({ luyKe: nccCum, chiTiet: nccChiTiet });
    setData(arr); setTongNo(tNo); setTongDu(tDu); setLoading(false);
  })(); }, [students, meta, ym, mData]);

  if (loading) return <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 30 }}>Đang tính công nợ lũy kế…</div>;
  const noList = data.filter((x) => x.luyKe > 0);
  const duList = data.filter((x) => x.luyKe < 0);

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Card style={{ flex: 1, background: C.coralSoft, borderColor: C.line, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: C.coral, fontWeight: 600 }}>Tổng nợ ({noList.length} HS)</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.coral }}>{fmt(tongNo)} đ</div>
        </Card>
        <Card style={{ flex: 1, background: C.greenSoft, borderColor: C.line, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Đóng dư ({duList.length} HS)</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.green }}>{fmt(tongDu)} đ</div>
        </Card>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Lũy kế xuyên tháng, bù trừ thừa/thiếu. Bao gồm cả HS đã nghỉ học còn nợ. Thu ngoài (KV4) đã gộp vào Tổng nợ; Nợ NCC để mục riêng bên dưới.</div>
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
        <Chips items={[["all", "Tất cả"], ["g500", "Nợ > 500k"], ["g1tr", "Nợ > 1 triệu"], ["m3", "Nợ ≥ 3 tháng"], ["thua", "Thu thừa"]]} val={noFilter} set={setNoFilter} />
      </StickyBar>

      {(() => {
        const soThangNo = (x) => (x.chiTiet || []).filter((c) => c.no > 0).length;
        const filtered = data.filter((x) => {
          if (noFilter === "thua") return x.luyKe < 0;
          if (noFilter === "g500") return x.luyKe > 500000;
          if (noFilter === "g1tr") return x.luyKe > 1000000;
          if (noFilter === "m3") return x.luyKe > 0 && soThangNo(x) >= 3;
          return x.luyKe !== 0;
        });
        if (filtered.length === 0) return <div style={{ textAlign: "center", color: C.green, fontSize: 14, fontWeight: 600, padding: 20 }}>✓ Không có HS phù hợp bộ lọc</div>;
        return filtered.map((x) => {
          const open = showDetail === x.hs.id;
          return (
            <div key={x.hs.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, marginBottom: 8, overflow: "hidden" }}>
              <div onClick={() => setShowDetail(open ? null : x.hs.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{x.hs.ten}</div>
                  <div style={{ fontSize: 11.5, color: TT_COLOR[x.hs.trangThai] }}>{x.hs.trangThai}{x.noDauKy ? ` · nợ đầu kỳ ${fmt(x.noDauKy)}` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: x.luyKe > 0 ? C.coral : C.green }}>{x.luyKe > 0 ? fmt(x.luyKe) : "+" + fmt(-x.luyKe)}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{x.luyKe > 0 ? "còn nợ" : "đóng dư"}</div>
                </div>
              </div>
              {open && (
                <div style={{ borderTop: `1px dashed ${C.line}`, padding: "10px 14px", background: C.graySoft, fontSize: 12.5 }}>
                  {x.noDauKy > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: C.sub }}><span>Nợ đầu kỳ</span><b>{fmt(x.noDauKy)}</b></div>}
                  {x.chiTiet.map((c) => (
                    <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: c.no > 0 ? C.coral : c.no < 0 ? C.green : C.sub }}>
                      <span>Th{c.thang.slice(5)}: phải {fmt(c.ps)} · thu {fmt(c.tt)}</span>
                      <b>{c.no > 0 ? fmt(c.no) : c.no < 0 ? "+" + fmt(-c.no) : "0"}</b>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTop: `1px solid ${C.line}`, fontWeight: 700 }}><span>Lũy kế</span><span style={{ color: x.luyKe > 0 ? C.coral : C.green }}>{x.luyKe > 0 ? fmt(x.luyKe) : "+" + fmt(-x.luyKe)} đ</span></div>
                </div>
              )}
            </div>
          );
        });
      })()}

      {tnData && tnData.chiTiet.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, marginTop: 14, overflow: "hidden" }}>
          <div onClick={() => setOpenTn(!openTn)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, display:"flex", alignItems:"center", gap:6 }}><Icon name="droplet" size={16} color={C.blueA} /> Thu ngoài (KV4)</div>
              <div style={{ fontSize: 11.5, color: C.sub }}>Khoản khác, cùng chiều thu · phải {fmt(tnData.phai)} · thu {fmt(tnData.thu)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: tnData.luyKe > 0 ? C.coral : C.green }}>{tnData.luyKe > 0 ? fmt(tnData.luyKe) : "+" + fmt(-tnData.luyKe)}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{tnData.luyKe > 0 ? "còn phải thu" : "đã đủ"}</div>
            </div>
          </div>
          {openTn && (
            <div style={{ borderTop: `1px dashed ${C.line}`, padding: "10px 14px", background: C.graySoft, fontSize: 12.5 }}>
              {tnData.chiTiet.map((c) => (
                <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: c.no > 0 ? C.coral : c.no < 0 ? C.green : C.sub }}>
                  <span>Th{c.thang.slice(5)}: phải {fmt(c.ps)} · thu {fmt(c.tt)}</span>
                  <b>{c.no > 0 ? fmt(c.no) : c.no < 0 ? "+" + fmt(-c.no) : "0"}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {nccData && nccData.chiTiet.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, marginTop: 10, overflow: "hidden" }}>
          <div onClick={() => setOpenNcc(!openNcc)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, display:"flex", alignItems:"center", gap:6 }}><Icon name="building" size={16} color="#9A6B00" /> Nợ nhà cung cấp (NCC)</div>
              <div style={{ fontSize: 11.5, color: C.sub }}>Trường nợ ra — KHÔNG tính vào Tổng nợ HS</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: nccData.luyKe > 0 ? "#9A6B00" : C.green }}>{fmt(Math.abs(nccData.luyKe))}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{nccData.luyKe > 0 ? "đang nợ" : "không nợ"}</div>
            </div>
          </div>
          {openNcc && (
            <div style={{ borderTop: `1px dashed ${C.line}`, padding: "10px 14px", background: C.amberSoft, fontSize: 12.5 }}>
              {nccData.chiTiet.map((c) => (
                <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: c.delta > 0 ? "#9A6B00" : C.green }}>
                  <span>Th{c.thang.slice(5)}: {c.delta > 0 ? "nợ thêm" : "trả bớt"} {fmt(Math.abs(c.delta))}</span>
                  <b>dồn: {fmt(c.cum)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
