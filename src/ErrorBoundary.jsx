import React from "react";

// Lưới an toàn CUỐI CÙNG cho lỗi render: 1 component vỡ → hiện màn này thay vì trắng cả app.
// CỐ Ý không import lib.js/theme.js — boundary phải tự đứng được kể cả khi phần còn lại hỏng.
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("App crash:", err, info?.componentStack); } catch {} }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FAF7F2", padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#26323B", marginBottom: 8 }}>App gặp lỗi hiển thị</div>
          <div style={{ fontSize: 13.5, color: "#6B7680", lineHeight: 1.6, marginBottom: 8 }}>
            Dữ liệu của bạn <b style={{ color: "#26323B" }}>không mất</b> — đây chỉ là lỗi màn hình, app đã dừng để tránh thao tác sai. Bấm tải lại để tiếp tục.
          </div>
          <div style={{ fontSize: 11, color: "#9AA4AC", marginBottom: 18, wordBreak: "break-word" }}>
            {String((this.state.err && this.state.err.message) || this.state.err).slice(0, 160)}
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: "12px 28px", borderRadius: 11, border: "none", background: "#2E6E52", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>↻ Tải lại app</button>
        </div>
      </div>
    );
  }
}
