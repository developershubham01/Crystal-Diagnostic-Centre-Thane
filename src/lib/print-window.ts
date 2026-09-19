/**
 * Shared print-window plumbing for black-on-white paper documents.
 *
 * Extracted from the admin AppointmentsTab so both the front-desk
 * printouts (slip, day sheet) and the public booking confirmation use
 * the same popup-with-iframe-fallback route:
 *   1. real popup window (normal case — the browser shows a preview tab)
 *   2. hidden same-origin iframe (popups blocked — the embedded onload
 *      script still triggers window.print() inside the frame)
 */

/** Shared print CSS for black-on-white printouts (administration + patient). */
export const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 32px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 12px; }
  .brand { display: flex; gap: 12px; align-items: center; }
  .brand .bname { font-size: 20px; font-weight: 800; letter-spacing: 0.06em; }
  .brand .bname small { display: block; font-size: 11px; font-weight: 400; letter-spacing: 0.14em; color: #444; margin-top: 4px; }
  .brand svg { width: 46px; height: 46px; flex: 0 0 auto; }
  .ref { text-align: right; }
  .ref .code { font-family: Consolas, monospace; font-size: 18px; font-weight: 700; letter-spacing: 0.12em; }
  .ref .label { font-size: 9px; letter-spacing: 0.2em; color: #555; }
  h1 { font-size: 13px; letter-spacing: 0.18em; margin: 22px 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; border-bottom: 1px solid #ddd; font-size: 13px; vertical-align: top; }
  td.k { width: 180px; font-size: 10px; letter-spacing: 0.14em; color: #555; text-transform: uppercase; padding-right: 12px; }
  .foot { margin-top: 26px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 10px; }
  .sign { margin-top: 48px; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
  .sign span { border-top: 1px solid #333; padding-top: 4px; width: 220px; text-align: center; }
  @media print { body { padding: 12mm; } }
`;

/**
 * Opens a print popup with the given HTML; falls back to a hidden iframe
 * when popups are blocked. Returns true when a route succeeded.
 */
export function openPrintWindow(html: string): boolean {
  const w = window.open("", "_blank", "width=800,height=900");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return true;
  }
  try {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;visibility:hidden;";
    frame.srcdoc = html;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
      } catch {
        /* cross-origin guard — srcdoc is same-origin, never expected */
      }
      setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
    return true;
  } catch {
    return false;
  }
}
