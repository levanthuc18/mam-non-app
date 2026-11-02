import { C, font } from "./lib.js";
import { Icon } from "./Icon.jsx";
import { useState, useEffect } from "react";

export function MoreMenu({ setTab, onLogout, students = [], meta = {} }) {
  const [backup, setBackup] = useState("");
  useEffect(() => { try { setBackup(localStorage.getItem("mn5:lastBackup") || ""); } catch {} }, []);
  const dangHoc = students.filter((s) => s.trangThai !== "Ra trường").length;
  const soLop = (meta.classes || []).length;
  const soGV = (meta.giaoVien || []).length;
  const stat = (icon, val, lab) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
      <Icon name={icon} size={18} color={C.pine} />
      <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: C.ink, minWidth: 44 }}>{val}</span>
      <span style={{ fontSize: 13, color: C.sub }}>{lab}</span>
    </div>
  );
  const sections = [
    {
      title: "Quản lý & Cài đặt",
      items: [
        { icon: "settings", label: "Cài đặt hệ thống (Lớp, HS, Đơn giá...)", action: () => setTab("caidat") },
      ]
    },
    {
      title: "Tài khoản",
      items: [
        { icon: "logOut", label: "Đăng xuất", action: onLogout },
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
              <Icon name={item.icon} size={19} color={C.pine} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ color: C.gray }}>›</span>
            </button>
          ))}
        </div>
      ))}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: 0.5, margin: "6px 0 4px" }}>DỮ LIỆU HỆ THỐNG</div>
        <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "6px 14px" }}>
          {stat("users", dangHoc, "học sinh đang học")}
          <div style={{ height: 1, background: C.line }} />
          {stat("building", soLop, soLop > 1 ? "lớp học" : "lớp học")}
          <div style={{ height: 1, background: C.line }} />
          {stat("graduationCap", soGV, "giáo viên")}
          <div style={{ height: 1, background: C.line }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
            <Icon name="download" size={18} color={backup ? C.pine : C.amber} />
            <span style={{ fontSize: 13, color: C.sub }}>Sao lưu gần nhất: <b style={{ color: backup ? C.ink : C.amber }}>{backup || "chưa sao lưu lần nào"}</b></span>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.sub, marginTop: 12 }}>Mầm Non Tuổi Thần Tiên</div>
      </div>
    </div>
  );
}
