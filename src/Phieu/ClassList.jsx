import { C, font, fmt } from "../lib.js";

export function ClassList({ meta, rows, selectedLop, onSelectLop }) {
  const lopMap = {};
  meta.classes.forEach((c) => { lopMap[c.id] = { ...c, totalHS: 0, daThu: 0, conNo: 0, rows: [] }; });

  rows.forEach((r) => {
    const l = lopMap[r.lopId];
    if (!l) return;
    l.totalHS++;
    if ((r.rec?.thucThu || 0) > 0) l.daThu++;
    if (r.conNo > 0) l.conNo++;
    l.rows.push(r);
  });

  const items = Object.values(lopMap).filter((l) => l.totalHS > 0);
  const icons = ["🐿", "🌱", "🍃", "🌸", "🌳", "🌻", "🍄", "🦋"];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 15 }}>📋</span> DANH SÁCH LỚP
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((l, i) => {
          const pct = l.totalHS > 0 ? Math.round((l.daThu / l.totalHS) * 100) : 0;
          const active = selectedLop === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onSelectLop(active ? "all" : l.id)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12,
                border: `1.5px solid ${active ? C.pine : C.line}`,
                background: active ? C.pineSoft : C.card,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                transition: "all .15s ease"
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icons[i % icons.length]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: C.ink }}>{l.ten}</span>
                  <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{l.totalHS} học sinh</span>
                </div>
                <div style={{ marginTop: 4, height: 6, borderRadius: 99, background: C.line, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", background: pct >= 80 ? C.green : pct >= 50 ? C.amber : C.coral, borderRadius: 99, transition: "width .3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 11.5 }}>
                  <span style={{ color: l.conNo > 0 ? C.coral : C.green, fontWeight: 600 }}>{l.conNo} còn nợ</span>
                  <span style={{ color: C.sub }}>{l.daThu} đã thu</span>
                </div>
              </div>
              <span style={{ fontSize: 14, color: C.sub, flexShrink: 0, marginLeft: 4 }}>❯</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
