// LoginScreen.jsx — màn chọn vai trò + nhập PIN (phong cách mầm non)
import { useState } from "react";
import { C, font } from "./lib.js";
import { Logo } from "./Brand.jsx";
import { Cloud, Sun, Grass, School } from "./Decor.jsx";

export function LoginScreen({ meta, onLogin }) {
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const tryAdmin = () => { if (pin.trim() === "1989") onLogin({ role: "admin" }); else setErr("Mã quản lý không đúng"); };
  const tryGV = () => { const gv = meta?.giaoVien?.find((g) => g.pin === pin.trim()); if (gv) onLogin({ role: "gv", gvId: gv.id, ten: gv.ten, lopId: gv.lopId }); else setErr("PIN không đúng"); };
  const lopTen = (id) => meta?.classes.find((c) => c.id === id)?.ten || "?";

  return (
    <div style={{
      position: "relative", overflow: "hidden", height: "100dvh", minHeight: "100dvh",
      background: "linear-gradient(165deg,#EAF3EE 0%,#E4EEF3 55%,#EAF0F3 100%)",
      fontFamily: font.body, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "20px 22px 132px",
    }}>
      <style>{`
        @keyframes ttFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ttFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      `}</style>

      {/* trang trí trời */}
      <Cloud w={110} style={{ position: "absolute", top: 56, left: -16, opacity: 0.85, animation: "ttFloat 6s ease-in-out infinite" }} />
      <Cloud w={80} style={{ position: "absolute", top: 120, left: 90, opacity: 0.6, animation: "ttFloat 7s ease-in-out infinite" }} />
      <Sun w={72} style={{ position: "absolute", top: 44, right: 22, animation: "ttFloat 7s ease-in-out infinite" }} />

      {/* nội dung */}
      <div style={{ position: "relative", width: "100%", maxWidth: 320, textAlign: "center", animation: "ttFade .5s ease both" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Logo w={178} style={{ width: "min(158px, 42vw)" }} /></div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: "clamp(16px,4.6vw,20px)", color: C.ink, marginTop: 10 }}>{meta?.tenTruong || "Mầm Non"}</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 18 }}>Quản lý điểm danh & thu phí</div>

        {!mode ? (
          <>
            <button onClick={() => { setMode("admin"); setPin(""); setErr(""); }}
              style={{ width: "100%", padding: "15px 18px", borderRadius: 16, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15.5, cursor: "pointer", marginBottom: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 6px 16px rgba(23,107,91,.28)" }}>
              <span style={{ fontSize: 19 }}>👩‍💼</span> Quản lý (Kế toán)
            </button>
            <button onClick={() => { setMode("gv"); setPin(""); setErr(""); }}
              style={{ width: "100%", padding: "15px 18px", borderRadius: 16, border: `1.5px solid ${C.pine}`, background: "#fff", color: C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 15.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
              <span style={{ fontSize: 19 }}>👩‍🏫</span> Giáo viên điểm danh
            </button>
          </>
        ) : (
          <div style={{ background: "#fff", borderRadius: 18, padding: "20px 18px", boxShadow: "0 8px 28px rgba(0,0,0,.12)", textAlign: "center" }}>
            <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: mode === "admin" ? C.pine : C.blueA }}>{mode === "admin" ? "🔐 Nhập mã quản lý" : "👩‍🏫 Nhập PIN giáo viên"}</div>
            <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && (mode === "admin" ? tryAdmin() : tryGV())} placeholder={mode === "admin" ? "Mã quản lý" : "PIN của bạn"} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${err ? C.coral : C.line}`, fontSize: 17, fontFamily: font.body, outline: "none", textAlign: "center", letterSpacing: 5 }} />
            {err && <div style={{ fontSize: 12.5, color: C.coral, marginTop: 6 }}>{err}</div>}
            <button onClick={mode === "admin" ? tryAdmin : tryGV} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: mode === "admin" ? C.pine : C.blueA, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 14, fontFamily: font.display }}>Vào</button>
            <button onClick={() => { setMode(null); setPin(""); setErr(""); }} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: "none", color: C.sub, fontSize: 13, cursor: "pointer", marginTop: 4 }}>‹ Quay lại</button>
            {mode === "gv" && meta?.giaoVien?.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: C.gray, lineHeight: 1.6 }}>{meta.giaoVien.map((g) => <div key={g.id}>{g.ten} · lớp {lopTen(g.lopId)}</div>)}</div>}
          </div>
        )}
      </div>

      {/* cảnh trường dưới đáy */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 124, pointerEvents: "none" }}>
        <Grass h={66} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, display: "flex", justifyContent: "center" }}>
          <School w={248} />
        </div>
      </div>
    </div>
  );
}
