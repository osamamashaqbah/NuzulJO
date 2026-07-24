// Escapes user-controlled strings before they're interpolated into HTML email bodies
// (names/hotel names are free text with no HTML stripping, so this is the injection point).
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
