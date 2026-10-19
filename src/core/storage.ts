import type { StoredSettings } from "./types";

const KEY = "hotkey-engine:v1";
export function loadSettings(): StoredSettings {
  if (typeof window === "undefined") return { version: 1, shortcuts: {} };
  try { const value = window.localStorage.getItem(KEY); return value ? JSON.parse(value) : { version: 1, shortcuts: {} }; }
  catch { return { version: 1, shortcuts: {} }; }
}
export function saveSettings(settings: StoredSettings): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage may be unavailable */ }
}
