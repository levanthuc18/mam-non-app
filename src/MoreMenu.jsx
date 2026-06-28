import { C, font } from "./lib.js";

export function MoreMenu({ setTab, onLogout }) {
  const sections = [
    {
      title: "Quản lý & Cài đặt",
      items: [
        { icon: "⚙️", label: "Cài đặt hệ thống (Lớp, HS, Đơn giá...)", action: () => setTab("caidat") },
      ]
    },
    {
      title: "⚙️ Tài khoản",
      items: [
        { icon: "↩", label: "Đăng xuất", action: onLogout },
      ]
    }
  ];

  return (
    <div style={{ paddingBottom: 20 }}>
      {sections.map(sec => (
        <div key={sec.title} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{sec.title}</div>
          {sec.items.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 12,
                border: `1.5px solid ${C.line}`, background: C.card, marginBottom: 8,
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                fontFamily: font.body, fontSize: 14.5, color: C.ink, fontWeight: 600
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ color: C.gray }}>›</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
