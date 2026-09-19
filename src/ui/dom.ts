export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};
export const maybe = (id: string): HTMLElement | null => document.getElementById(id);

export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function toast(t: string): void {
  const el = $('toast');
  el.textContent = t;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)] as T;
}
