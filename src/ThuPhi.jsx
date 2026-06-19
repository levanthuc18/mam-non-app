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
        
        // RENDER THẺ HS BÌNH THƯỜNG (ĐÃ THÊM ONCLICK MỞ HỒ SƠ 360°)
        return (
          <div key={r.hs.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => onSelectStudent && onSelectStudent(r.hs.id)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: r.hs.nguoiThu === "B" ? C.violetBSoft : C.blueASoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 14, color: r.hs.nguoiThu === "B" ? C.violetB : C.blueA }}>{r.hs.ten.charAt(0).toUpperCase()}</div>
                {r.noTruoc > 0 && <div title="có nợ tháng trước" style={{ position: "absolute", top: -3, right: -3, width: 11, height: 11, borderRadius: 99, background: C.coral, border: "2px solid #fff" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{r.hs.ten}{r.ps.suaCount > 0 && <span title="có khoản đã sửa" style={{ color: C.amber, fontSize: 12 }}> ⚠</span>}</div>
                <div style={{ fontSize: 11.5, color: C.sub, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 1 }}>
                  <span>{r.lop?.ten}</span>
                  <PLBadge pl={r.hs.pl} />
                  {r.nghi > 0 ? <span>· nghỉ {r.nghi}</span> : null}
                </div>
                {r.noTruoc !== 0 && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 1, color: r.noTruoc > 0 ? C.coral : C.green }}>{r.noTruoc > 0 ? `🔴 Nợ cũ ${fmt(r.noTruoc)}` : `🟢 Dư cũ ${fmt(-r.noTruoc)}`}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{fmt(r.tongPhaiThu)}</div>
                  <Badge s={r.st} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPhieuId(r.hs.id); setTab("phieu"); }} title="In phiếu thu" style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", padding: 2 }}>🧾</button>
              </div>
            </div>
            {/* ĐÃ BỎ PHẦN MỞ RỘNG INLINE CŨ Ở ĐÂY */}
          </div>
        );
      })}
