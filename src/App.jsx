import { useState, useEffect } from "react";
import { C, font, TT_THU_PHI, setCurrentActor, sGet, sSet, sDel, setAskRef, setToastRef } from "./lib.js";
import { BottomSheet } from "./ui.jsx";
import { useStore } from "./useStore.js";
import { HomeTab } from "./Home.jsx";
import { ThuPhiTab } from "./ThuPhi.jsx";
import { DiemDanhTab } from "./DiemDanh.jsx";
import { CongNoTab } from "./CongNo.jsx";
import { PhieuThu, DashTab } from "./TongQuan.jsx";
import { CaiDat } from "./CaiDat.jsx";
import { HocSinhTab } from "./HocSinh.jsx"; // THÊM DÒNG NÀY
import { StudentProfile } from "./StudentProfile.jsx";
import { MoreMenu } from "./MoreMenu.jsx";

function ConfirmHost() {
  const [state, setState] = useState(null);
  useEffect(() => { setAskRef((s) => setState(s)); return () => setAskRef(null); }, []);
  if (!state) return null;
  const close = (v) => { state.res(v); setState(null); };
  const danger = state.opts.danger;
  return (
    <div onClick={() => close(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,40,30,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 14.5, color: C.ink, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 18 }}>{state.msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => close(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.cancelText || "Hủy"}</button>
          <button onClick={() => close(true)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: danger ? C.coral : C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.okText || "Đồng ý"}</button>
        </div>
      </div>
    </div>
  );
}

function ToastHost() {
  const [state, setState] = useState(null);
  const tRef = useState({})[0]; 
  useEffect(() => { setToastRef((s) => { setState(s); clearTimeout(tRef.current); tRef.current = setTimeout(() => setState(null), s && s.undo ? 6000 : 2600); }); return () => setToastRef(null); }, []);
  if (!state) return null;
  return (
    <div style={{ position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: C.ink, color: "#fff", padding: "11px 18px", borderRadius: 99, fontSize: 13.5, fontWeight: 600, maxWidth: "90%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span>{state.msg}</span>
      {state.undo && <button onClick={() => { state.undo(); clearTimeout(tRef.current); setState(null); }} style={{ background: "#fff", color: C.ink, border: "none", borderRadius: 99, padding: "4px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Hoàn tác</button>}
    </div>
  );
}

function LoginScreen({ meta, onLogin }) {
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const tryAdmin = () => { if (pin.trim() === "1989") onLogin({ role: "admin" }); else setErr("Mã quản lý không đúng"); };
  const tryGV = () => { const gv = meta?.giaoVien?.find((g) => g.pin === pin.trim()); if (gv) onLogin({ role: "gv", gvId: gv.id, ten: gv.ten, lopId: gv.lopId }); else setErr("PIN không đúng"); };
  const lopTen = (id) => meta?.classes.find((c) => c.id === id)?.ten || "?";
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font.body }}>
      <div style={{ background: C.card, borderRadius: 20, padding: "30px 26px", width: "100%", maxWidth: 360, boxShadow: "0 8px 30px rgba(0,0,0,.08)", textAlign: "center" }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: C.pine }}>{meta?.tenTruong || "Mầm Non"}</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 22 }}>Quản lý điểm danh & thu phí</div>
        {!mode ? (
          <>
            <button onClick={() => { setMode("admin"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>👩‍💼 Quản lý (Kế toán)</button>
            <button onClick={() => { setMode("gv"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.blueA}`, background: C.card, color: C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>👩‍🏫 Giáo viên điểm danh</button>
          </>
        ) : (
          <>
            <div style={{ textAlign: "left", marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.sub }}>{mode === "admin" ? "🔐 Nhập mã quản lý" : "👩‍🏫 Nhập PIN giáo viên"}</div>
            <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && (mode === "admin" ? tryAdmin() : tryGV())} placeholder={mode === "admin" ? "Mã quản lý" : "PIN của bạn"} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${err ? C.coral : C.line}`, fontSize: 16, fontFamily: font.body, outline: "none", textAlign: "center", letterSpacing: 4 }} />
            {err && <div style={{ fontSize: 12.5, color: C.coral, marginTop: 6 }}>{err}</div>}
            <button onClick={mode === "admin" ? tryAdmin : tryGV} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: mode === "admin" ? C.pine : C.blueA, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>Vào</button>
            <button onClick={() => { setMode(null); setPin(""); setErr(""); }} style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none", background: "none", color: C.sub, fontSize: 13, cursor: "pointer", marginTop: 6 }}>‹ Quay lại</button>
            {mode === "gv" && meta?.giaoVien?.length > 0 && <div style={{ marginTop: 12, fontSize: 11, color: C.gray, lineHeight: 1.6 }}>{meta.giaoVien.map((g) => <div key={g.id}>{g.ten} · lớp {lopTen(g.lopId)}</div>)}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home"); 
  const [auth, setAuth] = useState(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [phieuId, setPhieuId] = useState(null);
  const [lopFilter, setLopFilter] = useState("all");
  const [thuFilter, setThuFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isWide, setIsWide] = useState(typeof window !== "undefined" && window.innerWidth >= 820);
  const [viewStudentId, setViewStudentId] = useState(null); 
  
  const store = useStore();
  const { meta, students, loading } = store;

  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId || null;
  const gvTen = auth?.ten || "";
  setCurrentActor(isAdmin ? "Admin" : (isGV ? gvTen : "?"));

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 820);
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { setOpenId(null); }, [tab]);
  useEffect(() => { if (isGV && !["dd", "home", "caidat", "more"].includes(tab)) setTab("home"); }, [isGV, tab]);

  const login = (a) => { setAuth(a); sSet("mn5:auth", a); };
  const logout = () => { setAuth(null); sDel("mn5:auth"); setTab("home"); };

  useEffect(() => { (async () => { const a = await sGet("mn5:auth"); if (a && (a.role === "admin" || a.role === "gv")) setAuth(a); })(); }, []);

  if (loading || !meta || !students)
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.sub, fontFamily: font.body }}>Đang tải dữ liệu…</div>;
  if (!auth) return <LoginScreen meta={meta} onLogin={login} />;

  const prevM = () => { if (store.month === 1) { store.setMonth(12); store.setYear(store.year - 1); } else store.setMonth(store.month - 1); };
  const nextM = () => { if (store.month === 12) { store.setMonth(1); store.setYear(store.year + 1); } else store.setMonth(store.month + 1); };
  const chipsLop = [["all", "Tất cả"], ...meta.classes.map((c) => [c.id, c.ten])];
  const phieuRow = store.allRows.find((r) => r.hs.id === phieuId && r.coRec) || store.allRows.find((r) => r.coRec);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font.body, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        input[type=number]::-webkit-inner-spin-button{display:none}
        *{box-sizing:border-box}
        button:active{transform:scale(0.97)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @media print { .no-print{display:none!important} #phieu-in{box-shadow:none!important} body{background:#fff} }
      `}</style>

      <div className="no-print" style={{ background: C.pine, padding: "16px 16px 14px", color: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, lineHeight: 1.25, maxHeight: 38, overflow: "hidden", wordBreak: "break-word" }}>{meta.tenTruong}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{isGV ? `👩‍🏫 ${gvTen}` : `${students.filter((s) => TT_THU_PHI[s.trangThai]).length} đang học · ${meta.classes.length} lớp`}{store.locked ? " · 🔒" : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,.16)", borderRadius: 999, padding: "4px 4px" }}>
              <button onClick={prevM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>‹</button>
              <button onClick={() => setMonthPickerOpen(true)} style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, minWidth: 64, textAlign: "center", color: "#fff", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", gap: 3 }}>Th{store.month}/{store.year} <span style={{ fontSize: 9, opacity: 0.8 }}>▾</span></button>
              <button onClick={nextM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>›</button>
            </div>
            <button onClick={logout} title="Đăng xuất" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 8, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>↩</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 14px 92px" }}>
        {store.seeded && tab === "home" && <div className="no-print" style={{ background: C.pineSoft, border: `1px solid #BFE0D4`, borderRadius: 12, padding: "9px 12px", marginBottom: 12, fontSize: 12.5, color: C.pine }}>👋 Khởi tạo xong! Bắt đầu: vào ⚙️ Cài đặt → Học sinh để thêm/nhập danh sách, rồi tạo bảng thu cho tháng.</div>}

        {tab === "home" && (
          <HomeTab 
            store={store} 
            auth={auth} 
            setTab={setTab} 
            setThuFilter={setThuFilter} 
            openStudentProfile={setViewStudentId}
          />
        )}

                {tab === "thu" && store.mData && (
          <ThuPhiTab 
            rows={store.allRows.filter((r) => {
              if (!r.coRec) return false;
              if (lopFilter !== "all" && r.lopId !== lopFilter) return false;
              const s = (search || "").toLowerCase(); 
              if (s && !r.hs.ten.toLowerCase().includes(s) && !r.hs.id.toLowerCase().includes(s)) return false;
              if (thuFilter === "chuaThu") return r.ps.tong > 0 && (r.rec.thucThu || 0) === 0;
              if (thuFilter === "thieu") return r.conNo > 0 && (r.rec.thucThu || 0) > 0;
              if (thuFilter === "noCu") return r.noTruoc > 0;
              if (thuFilter === "thuThua") return r.conNo < 0;
              return true;
            })}
            tk={store.tk} allRows={store.allRows} chipsLop={chipsLop} 
            lopFilter={lopFilter} setLopFilter={setLopFilter} thuFilter={thuFilter} setThuFilter={setThuFilter}
            search={search} setSearch={setSearch} openId={openId} setOpenId={setOpenId}
            getLop={store.getLop} setRec={store.setRec} setKhoan={store.setKhoan}
            resetKhoan={store.resetKhoan} resetAllKhoan={store.resetAllKhoan}
            setNgayAnAll={store.setNgayAnAll} thuDuNhieu={store.thuDuNhieu}
            addPhuThuHS={store.addPhuThuHS} delPhuThuHS={store.delPhuThuHS}
            locked={store.locked} mData={store.mData} upMData={store.upMData}
            setPhieuId={setPhieuId} setTab={setTab} isWide={isWide} 
            onSelectStudent={setViewStudentId}
          />
        )}
        
        {tab === "dd" && (
          <DiemDanhTab 
            allRows={store.ddRows} chipsLop={chipsLop} lopFilter={lopFilter} setLopFilter={setLopFilter}
            search={search} setSearch={setSearch} ddData={store.ddData} upDDData={store.upDDData}
            leData={store.leData} upLeData={store.upLeData} year={store.year} month={store.month}
            locked={store.nextChot} ddLockReason={store.nextChot} isWide={isWide} ym={store.ym}
            isGV={isGV} gvLopId={gvLopId} gvTen={gvTen} students={students} 
            onSelectStudent={setViewStudentId}
          />
        )}
        
        {tab === "phieu" && store.mData && phieuRow && (
          <PhieuThu phieuRow={phieuRow} allRows={store.allRows} setPhieuId={setPhieuId} getLop={store.getLop} meta={meta} month={store.month} year={store.year} upMeta={store.upMeta} mData={store.mData} upMData={store.upMData} />
        )}
        
        {tab === "dash" && store.mData && (
          <DashTab tk={store.tk} mData={store.mData} upMData={store.upMData} month={store.month} year={store.year} locked={store.locked} meta={meta} allRows={store.allRows} delThang={store.delThang} students={students} ym={store.ym} upMeta={store.upMeta} setTab={setTab} />
        )}
        
        {tab === "no" && (
          <CongNoTab students={students} meta={meta} ym={store.ym} mData={store.mData} />
        )}
        
        {tab === "caidat" && (
          <CaiDat meta={meta} upMeta={store.upMeta} students={students} upStudents={store.upStudents} ym={store.ym} reseedAll={store.reseedAll} isWide={isWide} />
        )}
        {tab === "hs" && (
          <HocSinhTab 
            meta={meta} 
            students={students} 
            upStudents={store.upStudents} 
            ym={store.ym} 
            openStudentProfile={setViewStudentId} 
          />
        )}

        {tab === "more" && (
          <MoreMenu setTab={setTab} onLogout={logout} />
        )}

        {["thu", "phieu", "dash", "no", "caidat"].includes(tab) && !store.mData && !["caidat", "no", "more"].includes(tab) && (
          <div className="no-print" style={{ background: C.card, borderRadius: 16, padding: 28, textAlign: "center", border: `1px dashed ${C.line}` }}>
            <div style={{ fontSize: 32 }}>📅</div>
            <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Tháng {store.month}/{store.year} chưa có dữ liệu</div>
            {isAdmin ? (
              <>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>Tạo bảng thu cho HS đang học.</div>
                <button onClick={store.taoThang} style={{ background: C.pine, color: "#fff", padding: "11px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: font.display }}>+ Tạo tháng {store.month}/{store.year}</button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: C.sub }}>Vui lòng liên hệ kế toán để tạo bảng thu.</div>
            )}
          </div>
        )}
      </div>

           <div className="no-print" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center", zIndex: 20 }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 640 }}>
          {(isAdmin 
            ? [["home", "Trang chủ", "🏠"], ["thu", "Thu phí", "💰"], ["dd", "Điểm danh", "✓"], ["hs", "Học sinh", "👶"], ["more", "Thêm", "☰"]] 
            : [["home", "Trang chủ", "🏠"], ["dd", "Điểm danh", "✓"], ["hs", "Học sinh", "👶"], ["more", "Thêm", "☰"]]
          ).map(([id, lb, ic]) => (
            <button 
              key={id} 
              onClick={() => setTab(id)} 
              style={{ flex: 1, padding: "9px 0 11px", border: "none", background: "none", cursor: "pointer", color: tab === id ? C.pine : C.gray, fontFamily: font.body, fontSize: 10, fontWeight: tab === id ? 700 : 500 }}
            >
              <div style={{ fontSize: 17, marginBottom: 2 }}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      </div>

      <BottomSheet open={monthPickerOpen} onClose={() => setMonthPickerOpen(false)} title="Chọn tháng xem báo cáo">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(() => {
            const base = new Date();
            const items = [];
            for (let i = -1; i <= 17; i++) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); items.push({ m: d.getMonth() + 1, y: d.getFullYear() }); }
            return items.map(({ m, y }) => {
              const active = m === store.month && y === store.year;
              const isNow = m === base.getMonth() + 1 && y === base.getFullYear();
              return (
                <button key={`${y}-${m}`} onClick={() => { store.setMonth(m); store.setYear(y); setMonthPickerOpen(false); }} style={{ flex: "1 1 28%", minWidth: 96, padding: "11px 6px", borderRadius: 11, border: `1.5px solid ${active ? C.pine : C.line}`, background: active ? C.pine : C.card, color: active ? "#fff" : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  Th{m}/{y}
                  {isNow && <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? "#fff" : C.green }}>● hiện tại</span>}
                </button>
              );
            });
          })()}
        </div>
        <button onClick={() => setMonthPickerOpen(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Xong</button>
      </BottomSheet>

      {viewStudentId && (
        <StudentProfile 
          studentId={viewStudentId} 
          store={store} 
          onBack={() => setViewStudentId(null)} 
        />
      )}
      
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
