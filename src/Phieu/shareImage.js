import { toBlob } from "html-to-image";

/**
 * Render 1 node DOM (phiếu) thành ảnh PNG rồi:
 *  - Điện thoại hỗ trợ Web Share file: mở share sheet (Zalo, Messenger, ...)
 *  - Không hỗ trợ (đa số máy tính): tự tải ảnh về
 * Trả về { ok, mode } với mode = "share" | "download" | "cancel".
 */
export async function sharePhieuAnh(node, { filename = "phieu.png", title = "Phiếu học phí", text = "" } = {}) {
  if (!node) return { ok: false, reason: "no-node" };

  let blob;
  try {
    blob = await toBlob(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      filter: (n) => !(n.classList && n.classList.contains("no-print")),
    });
  } catch (e) {
    return { ok: false, reason: "render-fail", error: e };
  }
  if (!blob) return { ok: false, reason: "render-fail" };

  const file = new File([blob], filename, { type: "image/png" });

  // Thử mở share sheet (chỉ chạy trên thiết bị hỗ trợ chia sẻ file)
  try {
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return { ok: true, mode: "share" };
    }
  } catch (e) {
    if (e && e.name === "AbortError") return { ok: true, mode: "cancel" };
    // lỗi khác -> rơi xuống tải về
  }

  // Fallback: tải ảnh về
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, mode: "download" };
}
