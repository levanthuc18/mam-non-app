import { toBlob, getFontEmbedCSS } from "html-to-image";

/** Chụp node DOM -> PNG blob: đợi font nạp xong + chốt đúng kích thước + render 2 lần (lần đầu làm nóng) để chữ không phình/xuống dòng. */
async function renderBlob(node) {
  try { if (typeof document !== "undefined" && document.fonts && document.fonts.ready) await document.fonts.ready; } catch {}
  const w = node.offsetWidth || undefined;
  const h = node.offsetHeight || undefined;
  const opts = {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width: w,
    height: h,
    style: w ? { width: w + "px", height: h + "px", margin: "0" } : undefined,
    filter: (n) => !(n.classList && n.classList.contains("no-print")),
  };
  await toBlob(node, opts);          // làm nóng: nạp font/ảnh vào bản sao
  return await toBlob(node, opts);   // bản chuẩn
}

/** Tạo ảnh PNG từ node DOM -> { ok, url, file } hoặc { ok:false, reason, error }. */
export async function makePhieuImage(node, filename = "phieu.png") {
  if (!node) return { ok: false, reason: "no-node" };
  let blob;
  try {
    blob = await renderBlob(node);
  } catch (e) {
    return { ok: false, reason: "render-fail", error: e };
  }
  if (!blob) return { ok: false, reason: "render-fail" };
  return { ok: true, url: URL.createObjectURL(blob), file: new File([blob], filename, { type: "image/png" }) };
}

/**
 * Bản NHANH để tạo nhiều ảnh liên tiếp (tải hàng loạt): nạp font 1 lần rồi dùng lại, không render 2 lần, không phá cache.
 * ctx là một đối tượng rỗng {} dùng chung cho cả lượt; trả về giống makePhieuImage.
 */
export async function makePhieuImageNhanh(node, filename, ctx) {
  if (!node) return { ok: false, reason: "no-node" };
  try {
    const w = node.offsetWidth || undefined, h = node.offsetHeight || undefined;
    const opts = {
      pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: false, width: w, height: h,
      style: w ? { width: w + "px", height: h + "px", margin: "0" } : undefined,
      filter: (n) => !(n.classList && n.classList.contains("no-print")),
    };
    if (!ctx.san) {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch {}
      try { ctx.font = await getFontEmbedCSS(node); } catch { ctx.font = undefined; }
      if (ctx.font !== undefined) opts.fontEmbedCSS = ctx.font;
      await toBlob(node, opts); // làm nóng 1 lần cho cả lượt
      ctx.san = true;
    } else if (ctx.font !== undefined) opts.fontEmbedCSS = ctx.font;
    const blob = await toBlob(node, opts);
    if (!blob) return { ok: false, reason: "render-fail" };
    return { ok: true, file: new File([blob], filename, { type: "image/png" }) };
  } catch (e) {
    return { ok: false, reason: "render-fail", error: e };
  }
}

/** Máy có hỗ trợ chia sẻ trực tiếp file ảnh không? */
export function canShareImageFile(file) {
  try { return !!(typeof navigator !== "undefined" && navigator.canShare && file && navigator.canShare({ files: [file] })); }
  catch { return false; }
}

/** Thiết bị có chia sẻ trực tiếp file ảnh (điện thoại) không? Dò bằng 1 file mẫu. */
export function coChiaSeTrucTiep() {
  try { return canShareImageFile(new File([new Blob(["x"])], "a.png", { type: "image/png" })); } catch { return false; }
}
/** Trình duyệt có cho sao chép ẢNH vào bộ nhớ tạm không? (máy tính: dán Ctrl+V vào Zalo) */
export function coSaoChepAnh() {
  return typeof ClipboardItem !== "undefined" && !!(navigator.clipboard && navigator.clipboard.write);
}
export async function saoChepAnhFile(file) {
  try { await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]); return { ok: true }; }
  catch (e) { return { ok: false, error: e }; }
}

/** Mở share sheet (Zalo, Messenger...). */
export async function shareImageFile(file, { title = "", text = "" } = {}) {
  try { await navigator.share({ files: [file], title, text }); return { ok: true, mode: "share" }; }
  catch (e) { if (e && e.name === "AbortError") return { ok: true, mode: "cancel" }; return { ok: false, error: e }; }
}

/** Tải ảnh (blob URL) về máy. */
export function downloadImageUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

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
    blob = await renderBlob(node);
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
