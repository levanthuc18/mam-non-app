// nav.js — Điều hướng "kiểu native": registry đóng overlay + bộ xử lý nút Back.
// Tách riêng 1 file để sau này đóng gói Capacitor/TWA chỉ sửa DUY NHẤT useBackHandler,
// phần còn lại của app không phải đụng vào.
import { useEffect, useRef } from "react";

// ───────────────────────────────────────────────────────────────
// DISMISS REGISTRY (LIFO)
// Mỗi overlay đang mở (BottomSheet / Dialog / StudentProfile / phiếu chi tiết…)
// tự đăng ký 1 hàm "đóng nó". Back sẽ đóng cái MỞ GẦN NHẤT trước —
// tự nhiên đúng thứ tự Dialog → Sheet → Profile mà không cần khai báo tay.
// ───────────────────────────────────────────────────────────────
let _seq = 0;
const _stack = []; // [{ id, fn }]

// Đăng ký 1 hàm đóng. Trả về hàm hủy đăng ký (dùng trong cleanup của useEffect).
export function registerDismiss(fn) {
  const id = ++_seq;
  _stack.push({ id, fn });
  return () => {
    const i = _stack.findIndex((x) => x.id === id);
    if (i !== -1) _stack.splice(i, 1);
  };
}

export function hasDismissable() {
  return _stack.length > 0;
}

// Đóng overlay trên cùng. Trả true nếu có đóng thứ gì đó.
export function dismissTop() {
  const top = _stack[_stack.length - 1];
  if (!top) return false;
  try { top.fn(); } catch {}
  return true;
}

// ───────────────────────────────────────────────────────────────
// useBackHandler
// v1: dùng History API. PWA / Android Chrome / TWA đều nhận nút Back qua đây.
// SAU NÀY nếu bọc Capacitor: chỉ thêm nhánh App.addListener('backButton', …)
// NGAY TRONG hook này — không phải sửa App.jsx.
//
// onBack() phải trả về:
//   true  = đã xử lý (đóng overlay / lùi màn) → giữ bẫy Back.
//   false = không còn gì để lùi (đang ở Home) → cho trình duyệt Back thật = thoát app.
// ───────────────────────────────────────────────────────────────
export function useBackHandler(onBack) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Gài 1 "chốt" lịch sử để lần Back ĐẦU TIÊN bắn popstate thay vì rời trang.
    window.history.pushState({ __navGuard: true }, "");

    const handler = () => {
      const handled = ref.current && ref.current();
      // Đã xử lý → gài lại chốt để lần Back kế tiếp vẫn bị bắt.
      // Không xử lý → để nguyên (đã pop khỏi chốt) → Back lần nữa là thoát.
      if (handled) window.history.pushState({ __navGuard: true }, "");
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
}
