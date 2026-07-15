// Splash.jsx — màn chờ 2 giây khi mở app
import { useEffect } from "react";
import { C, font } from "./lib.js";
import { Logo } from "./Brand.jsx";
import { Cloud } from "./Decor.jsx";

export function Splash({ onDone, ms = 2000, tenTruong = "Mầm Non Tuổi Thần Tiên" }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), ms);
    return () => clearTimeout(t);
  }, [onDone, ms]);

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      height: "100dvh", minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14,
      background: `linear-gradient(165deg, ${C.bg} 0%, ${C.pineSoft} 100%)`,
      fontFamily: font.body, padding: 24,
    }}>
      <style>{`
        @keyframes ttFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ttDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
        @keyframes ttFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      `}</style>

      {/* mây trang trí */}
      <Cloud w={120} style={{ position: "absolute", top: 70, left: -18, opacity: 0.85, animation: "ttFloat 6s ease-in-out infinite" }} />
      <Cloud w={84} style={{ position: "absolute", top: 130, right: 24, opacity: 0.7, animation: "ttFloat 7s ease-in-out infinite" }} />
      <Cloud w={150} style={{ position: "absolute", bottom: 64, left: -30, opacity: 0.75, animation: "ttFloat 8s ease-in-out infinite" }} />
      <Cloud w={96} style={{ position: "absolute", bottom: 120, right: -16, opacity: 0.6, animation: "ttFloat 6.5s ease-in-out infinite" }} />

      <div style={{ position: "relative", textAlign: "center", animation: "ttFade .6s ease both" }}>
        <Logo w={216} style={{ width: "min(216px, 48vw)" }} />
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: "clamp(16px,4.6vw,20px)", color: C.ink, marginTop: 14 }}>{tenTruong}</div>
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, marginTop: 6, animation: "ttFade .7s .2s ease both" }}>
        <span style={{ fontSize: 13, color: C.sub }}>Đang tải dữ liệu</span>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: 99, background: C.pine, display: "inline-block", animation: `ttDot 1.2s ${i * 0.18}s infinite` }} />
        ))}
      </div>
    </div>
  );
}
