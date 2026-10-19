import type { ParsedShortcut } from "./types";

const MODIFIERS = new Set(["ctrl", "control", "alt", "shift", "meta", "cmd", "command", "mod"]);
const NAMED_CODES: Record<string, string> = {
  enter: "Enter", escape: "Escape", esc: "Escape", space: "Space", tab: "Tab",
  backspace: "Backspace", delete: "Delete", arrowup: "ArrowUp", arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft", arrowright: "ArrowRight", slash: "Slash"
};
// These commands are normally owned by the browser or operating system. This
// intentionally conservative list is enforced unless a host app opts in.
const RESERVED = new Set(["ctrl+r", "ctrl+w", "ctrl+t", "ctrl+n", "ctrl+l", "ctrl+k", "ctrl+p", "ctrl+shift+t", "meta+r", "meta+w", "meta+t", "meta+n", "meta+l", "meta+k", "meta+p", "meta+q", "alt+f4"]);

function codeFor(key: string): string {
  const normalized = key.toLowerCase();
  if (NAMED_CODES[normalized]) return NAMED_CODES[normalized];
  if (/^[a-z]$/.test(normalized)) return `Key${normalized.toUpperCase()}`;
  if (/^[0-9]$/.test(normalized)) return `Digit${normalized}`;
  if (/^f([1-9]|1[0-2])$/.test(normalized)) return normalized.toUpperCase();
  throw new Error(`Unsupported shortcut key: ${key}`);
}

export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.toLowerCase().replace(/\s/g, "").split("+").filter(Boolean);
  if (!parts.length) throw new Error("A shortcut is required");
  const key = parts.pop()!;
  if (MODIFIERS.has(key)) throw new Error("A shortcut needs a non-modifier key");
  const modifiers = { ctrl: false, alt: false, shift: false, meta: false, mod: false };
  for (const part of parts) {
    if (!MODIFIERS.has(part)) throw new Error(`Unknown modifier: ${part}`);
    if (part === "ctrl" || part === "control") modifiers.ctrl = true;
    else if (part === "alt") modifiers.alt = true;
    else if (part === "shift") modifiers.shift = true;
    else if (part === "meta" || part === "cmd" || part === "command") modifiers.meta = true;
    else modifiers.mod = true;
  }
  return { modifiers, code: codeFor(key) };
}

export function isMacPlatform(platform = typeof navigator === "undefined" ? "" : navigator.platform): boolean {
  return /mac|iphone|ipad/i.test(platform);
}

export function shortcutMatches(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  const mac = isMacPlatform();
  const expectedCtrl = parsed.modifiers.ctrl || (parsed.modifiers.mod && !mac);
  const expectedMeta = parsed.modifiers.meta || (parsed.modifiers.mod && mac);
  return event.code === parsed.code && event.ctrlKey === expectedCtrl && event.altKey === parsed.modifiers.alt && event.shiftKey === parsed.modifiers.shift && event.metaKey === expectedMeta;
}

export function normalizeShortcut(shortcut: string): string {
  const parsed = parseShortcut(shortcut);
  const names = [parsed.modifiers.ctrl && "ctrl", parsed.modifiers.alt && "alt", parsed.modifiers.shift && "shift", parsed.modifiers.meta && "meta", parsed.modifiers.mod && "mod"].filter(Boolean);
  const key = parsed.code.startsWith("Key") ? parsed.code.slice(3).toLowerCase() : parsed.code.startsWith("Digit") ? parsed.code.slice(5) : parsed.code.toLowerCase();
  return [...names, key].join("+");
}

export function reservedReason(shortcut: string): string | undefined {
  const normalized = normalizeShortcut(shortcut).replace("mod", isMacPlatform() ? "meta" : "ctrl");
  return RESERVED.has(normalized) ? "This shortcut is commonly reserved by the browser or operating system." : undefined;
}

export function displayShortcut(shortcut: string, mac = isMacPlatform()): string {
  const parsed = parseShortcut(shortcut);
  const labels = [
    parsed.modifiers.ctrl && (mac ? "⌃" : "Ctrl"), parsed.modifiers.alt && (mac ? "⌥" : "Alt"),
    parsed.modifiers.shift && (mac ? "⇧" : "Shift"), parsed.modifiers.meta && (mac ? "⌘" : "Meta"),
    parsed.modifiers.mod && (mac ? "⌘" : "Ctrl")
  ].filter(Boolean);
  const key = parsed.code.startsWith("Key") ? parsed.code.slice(3) : parsed.code.startsWith("Digit") ? parsed.code.slice(5) : parsed.code.replace(/^Arrow/, "Arrow ");
  return [...labels, key].join(mac ? "" : " + ");
}
