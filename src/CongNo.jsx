import { useState, useEffect, useMemo } from "react";
import {
  sList, sGet, sSet, ymKey, lopOfMonth, tinhPSFromRec, fmt, noDau,
  C, font, TT_COLOR, toast, ask, getCurrentActor
} from "./lib.js";
import { tinhNoNCCThang, nhomNoNCC } from "./taichinh.js";
import { Icon } from "./Icon.jsx";
import { Card, Chips, useStickyShrink, StickyBar, BottomSheet } from "./ui.jsx";

export function CongNoTab({ students, meta, ym, mData, setPhieuId, setTab }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [tongNo, setTongNo] = useState(0);
  const [tongDu, setTongDu] = useState(0);
  const [noFilter, setNoFilter] = useState("all");
  const [showDetail, setShowDetail] = useState(null);
  const [tnData, setTnData] = useState(null);
  const [nccData, setNccData] = useState(null);
  const [nccVendors, setNccVendors] = useState([]);
  const [openTn, setOpenTn] = useState(false);
  const [openNcc, setOpenNcc] = useState(false);
  const [xemThang, setXemThang] = useState(false);
  const [nhacMap, setNhacMap] = useState({});
  const [nhacHS, setNhacHS] = useState(null);
  const [nhacGhiChu, setNhacGhiChu] = useState("");
  const [daCopy, setDaCopy] = useState(false);
  const { sentinelRef, shrunk } = useStickyShrink();

  useEffect(() => { (async () => {
    setLoading(true);
    const keys = await sList("mn5:thang:");
    const months = keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
    const perHS = {};
    students.forEach((hs) => { perHS[hs.id] = { hs, phaiThu: 0, daThu: 0, chiTiet: [], noDauKy: hs.noDauKy || 0 }; });
    let tnPhai = 0, tnThu = 0; const tnChiTiet = [];
    let nccCum = 0; const nccChiTiet = []; const chiPhiTheoThang = [];
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
      // Nợ NCC — trường nợ ra (logic tập trung tại taichinh.js)
      const mNcc = tinhNoNCCThang(td.chiPhi);
      if (mNcc !== 0) { nccCum += mNcc; nccChiTiet.push({ thang: m, delta: mNcc, cum: nccCum }); }
      if (td.chiPhi?.length) chiPhiTheoThang.push({ m, chiPhi: td.chiPhi });
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
    setNccVendors(nhomNoNCC(chiPhiTheoThang));
    setNhacMap((await sGet("mn5:nhacno")) || {});
    setData(arr); setTongNo(tNo); setTongDu(tDu); setLoading(false);
  })(); }, [students, meta, ym, mData]);

  if (loading) return <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 30 }}>Đang tính công nợ lũy kế…</div>;
  const noList = data.filter((x) => x.luyKe > 0);
  const duList = data.filter((x) => x.luyKe < 0);

  // ===== Nhắc nợ Zalo (GĐ1) =====
  const chipNhac = (x) => {
    const r = nhacMap[x.hs.id];
    if (!r) return { t: "Chưa nhắc", c: C.coral, bg: C.coralSoft };
    const d = new Date(r.ts);
    const t = `Đã nhắc ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return (Date.now() - r.ts > 7 * 86400000) ? { t, c: C.amber, bg: C.amberSoft } : { t, c: C.green, bg: C.greenSoft };
  };
  const tenLop = (hs) => meta.classes.find((c) => c.id === lopOfMonth(hs, ym))?.ten || "";
  const buildTin = (x) => {
    const [yy, mm] = ym.split("-");
    const bank = meta.bank?.[x.hs.nguoiThu];
    const hd = (meta.hanDong || "").trim();
    return `Kính gửi phụ huynh bé ${x.hs.ten}. Nhà trường xin thông báo học phí của bé đến tháng ${Number(mm)}/${yy} hiện còn học phí chưa thanh toán là ${fmt(x.luyKe)}đ. Kính mong phụ huynh sắp xếp hoàn thành giúp nhà trường${hd ? ` ${hd}` : ""}. ${bank?.stk ? `Thông tin chuyển khoản: ${bank.chu} – ${bank.stk} – ${bank.nh}. Nội dung chuyển khoản: ${x.hs.ten} ${tenLop(x.hs)}. ` : ""}Xin chân thành cảm ơn Quý phụ huynh! 🌸`;
  };
  const sdtCua = (x) => (x.hs.phuHuynh?.sdt || "").replace(/\D/g, "");
  const moNhac = (x) => { setNhacHS(x); setNhacGhiChu(nhacMap[x.hs.id]?.ghiChu || ""); setDaCopy(false); };
  const copyTin = async () => {
    const x = nhacHS; if (!x) return;
    const text = buildTin(x);
    try { await navigator.clipboard.writeText(text); }
    catch { try { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); } catch { toast("Không copy được, chép tay giúp mình"); return; } }
    setDaCopy(true);
    toast("Đã copy — dán vào Zalo");
  };
  const xacNhanGui = () => {
    const x = nhacHS; if (!x) return;
    const nm = { ...nhacMap, [x.hs.id]: { ts: Date.now(), nguoi: getCurrentActor(), soTien: x.luyKe, ghiChu: nhacGhiChu.trim(), ym, kenh: "zalo", version: 1 } };
    setNhacMap(nm); sSet("mn5:nhacno", nm);
    setNhacHS(null);
    toast("Đã ghi nhận: đã nhắc phụ huynh");
  };
  const xemPhieu = async () => {
    const x = nhacHS; if (!x || !setPhieuId) return;
    if (nhacGhiChu.trim() && !(await ask("Mở phiếu thu sẽ đóng bảng nhắc, ghi chú vừa gõ sẽ mất. Tiếp tục?", { okText: "Mở phiếu" }))) return;
    setNhacHS(null); setPhieuId(x.hs.id); setTab("phieu");
  };
  const moZalo = () => { const s = sdtCua(nhacHS); if (s) window.open(`https://zalo.me/${s}`, "_blank"); };

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Card style={{ flex: 1, background: C.coralSoft, borderColor: C.line, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: C.coral, fontWeight: 600 }}>Tổng nợ ({noList.length} HS + KV4)</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.coral }}>{fmt(tongNo)} đ</div>
        </Card>
        <Card style={{ flex: 1, background: C.greenSoft, borderColor: C.line, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Đóng dư ({duList.length} HS)</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.green }}>{fmt(tongDu)} đ</div>
        </Card>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Lũy kế xuyên tháng, bù trừ thừa/thiếu. Bao gồm cả HS đã nghỉ học còn nợ. <b style={{ color: C.ink }}>"Tổng nợ" đã gộp cả Thu ngoài (KV4)</b> — không gồm Nợ NCC (chiều ngược lại: trường nợ ra, xem thẻ bên dưới).</div>

      {nccData && nccData.chiTiet.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, marginBottom: 12, overflow: "hidden" }}>
          <div onClick={() => setOpenNcc(!openNcc)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, display:"flex", alignItems:"center", gap:6 }}><Icon name="building" size={16} color={C.amber} /> Nợ nhà cung cấp (NCC)</div>
              <div style={{ fontSize: 11.5, color: C.sub }}>Trường nợ ra — chiều ngược với Tổng nợ HS ở trên</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: nccData.luyKe > 0 ? C.amber : C.green }}>{fmt(Math.abs(nccData.luyKe))}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{nccData.luyKe > 0 ? "đang nợ" : "không nợ"}</div>
            </div>
          </div>
          {openNcc && (
            <div style={{ borderTop: `1px dashed ${C.line}`, padding: "10px 14px", background: C.amberSoft, fontSize: 12.5 }}>
              {nccVendors.length > 0 ? (
                <>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 6 }}>Còn nợ từng nhà cung cấp:</div>
                  {nccVendors.map((v) => {
                    const lau = v.soThang >= 3;
                    return (
                      <div key={v.ten} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px dashed ${C.line}` }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: C.ink, fontWeight: 600 }}>{v.ten}</div>
                          {lau && <div style={{ fontSize: 10.5, color: C.coral, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}><Icon name="alertTriangle" size={11} color={C.coral} /> nợ đã {v.soThang} tháng</div>}
                        </div>
                        <b style={{ color: v.conNo > 0 ? C.amber : C.green, flexShrink: 0, marginLeft: 8 }}>{v.conNo > 0 ? fmt(v.conNo) : "+" + fmt(-v.conNo)}</b>
                      </div>
                    );
                  })}
                  <button onClick={() => setXemThang((x) => !x)} style={{ marginTop: 8, background: "none", border: "none", color: C.amber, fontWeight: 700, fontSize: 11.5, cursor: "pointer", padding: 0 }}>{xemThang ? "▾ Ẩn theo tháng" : "▸ Xem theo tháng"}</button>
                </>
              ) : null}
              {(xemThang || nccVendors.length === 0) && (
                <div style={{ marginTop: nccVendors.length > 0 ? 8 : 0 }}>
                  {nccData.chiTiet.map((c) => (
                    <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: c.delta > 0 ? C.amber : C.green }}>
                      <span>Th{c.thang.slice(5)}: {c.delta > 0 ? "nợ thêm" : "trả bớt"} {fmt(Math.abs(c.delta))}</span>
                      <b>dồn: {fmt(c.cum)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  <div style={{ fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{x.hs.ten}{x.luyKe > 0 && (() => { const ch = chipNhac(x); return <span style={{ fontSize: 10, fontWeight: 700, color: ch.c, background: ch.bg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>{ch.t}</span>; })()}</div>
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
                  {x.luyKe > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
                      {nhacMap[x.hs.id] && (() => { const r = nhacMap[x.hs.id]; const d = new Date(r.ts); return (
                        <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 7 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}><Icon name="bell" size={12} color={C.sub} /> Nhắc gần nhất: <b style={{ color: C.ink }}>{String(d.getDate()).padStart(2, "0")}/{String(d.getMonth() + 1).padStart(2, "0")} {String(d.getHours()).padStart(2, "0")}:{String(d.getMinutes()).padStart(2, "0")}</b> · {r.nguoi} · khi còn nợ <b style={{ color: C.ink }}>{fmt(r.soTien)}đ</b>{r.ym ? ` · kỳ ${Number(r.ym.slice(5))}/${r.ym.slice(0, 4)}` : ""}</span>
                          {r.ghiChu && <div style={{ marginTop: 2, fontStyle: "italic" }}>Ghi chú: "{r.ghiChu}"</div>}
                        </div>
                      ); })()}
                      <button onClick={() => moNhac(x)} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="bell" size={14} color="#fff" /> Nhắc Zalo</button>
                    </div>
                  )}
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

      <BottomSheet open={!!nhacHS} onClose={() => setNhacHS(null)} title="Nhắc học phí qua Zalo">
        {nhacHS && (() => {
          const sdt = sdtCua(nhacHS);
          return (
            <>
              <div style={{ background: C.graySoft, borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ color: C.sub }}>Bé</span><b style={{ color: C.ink }}>{nhacHS.hs.ten} · {tenLop(nhacHS.hs)}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ color: C.sub }}>Còn nợ</span><b style={{ color: C.coral }}>{fmt(nhacHS.luyKe)} đ</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.sub }}>SĐT phụ huynh</span>{sdt ? <b style={{ color: C.ink }}>{nhacHS.hs.phuHuynh.sdt}</b> : <b style={{ color: C.coral }}>⚠ Chưa có SĐT</b>}</div>
              </div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 4 }}>Nội dung tin nhắn</div>
              <div style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.ink, whiteSpace: "pre-wrap", marginBottom: 10, userSelect: "text", lineHeight: 1.5 }}>{buildTin(nhacHS)}</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 4 }}>Ghi chú (tuỳ chọn)</div>
              <input value={nhacGhiChu} onChange={(e) => setNhacGhiChu(e.target.value)} placeholder="VD: hứa chuyển tối" style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, boxSizing: "border-box", marginBottom: 12 }} />
              <button onClick={copyTin} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: daCopy ? C.green : C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer", marginBottom: 8 }}>{daCopy ? "✓ Đã copy nội dung" : "📋 Copy nội dung"}</button>
              {sdt && <button onClick={moZalo} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer", marginBottom: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="send" size={15} color={C.pine} /> Mở Zalo phụ huynh</button>}
              {setPhieuId && <button onClick={xemPhieu} style={{ width: "100%", padding: "11px 0", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginBottom: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="receipt" size={15} color={C.pine} /> Xem phiếu · Lưu ảnh</button>}
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, lineHeight: 1.55, background: C.graySoft, borderRadius: 8, padding: "7px 10px" }}>
                <b>Chỉ gửi chữ:</b> Copy → Mở Zalo phụ huynh → dán → gửi.<br />
                <b>Gửi kèm ảnh phiếu:</b> "Xem phiếu · Lưu ảnh" → <b>Tải ảnh về</b> → Mở Zalo phụ huynh → chọn ảnh vừa lưu.
              </div>
              <div style={{ borderTop: `1px dashed ${C.line}`, paddingTop: 10, marginTop: 2 }}>
                <button onClick={xacNhanGui} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: `1.5px solid ${C.green}`, background: C.greenSoft, color: C.green, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer", marginBottom: 8 }}>✓ Đã gửi xong</button>
              </div>
              <button onClick={() => setNhacHS(null)} style={{ width: "100%", padding: "10px 0", borderRadius: 11, border: "none", background: "none", color: C.sub, fontFamily: font.body, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Hủy</button>
            </>
          );
        })()}
      </BottomSheet>
    </>
  );
}
