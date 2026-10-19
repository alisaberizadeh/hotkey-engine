import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Direction, FloatingPosition, HotkeyAction, ResolvedAction, ScopeId, Shortcut, Theme } from "../core/types";
import { loadSettings, saveSettings } from "../core/storage";
import { normalizeShortcut, reservedReason, shortcutMatches } from "../core/shortcut";
import { defaultDir, type Locale } from "../locales/messages";
import { HotkeySettingsModal } from "../ui/SettingsModal";
import { FloatingTrigger } from "../ui/FloatingTrigger";

export interface HotkeyProviderProps {
  actions: HotkeyAction[]; children: React.ReactNode; showFloatingButton?: boolean; position?: FloatingPosition;
  offset?: number | { x: number; y: number }; zIndex?: number; theme?: Theme; locale?: Locale; dir?: Direction;
  className?: string;
  /** Permit users to assign browser/system-reserved shortcuts such as Ctrl+K. Defaults to false. */
  allowReservedShortcuts?: boolean;
}
interface HotkeyContextValue {
  actions: ResolvedAction[]; open: boolean; openSettings(): void; closeSettings(): void;
  updateShortcut(id: string, shortcut: Shortcut | null): { ok: true } | { ok: false; reason: "conflict" | "reserved"; action?: ResolvedAction };
  resetShortcut(id: string): void; resetAll(): void; activeScopes: ScopeId[]; activateScope(scope: ScopeId): () => void;
  locale: Locale; setLocale(locale: Locale): void; dir: Direction; theme: Theme; allowReservedShortcuts: boolean;
}
const Context = createContext<HotkeyContextValue | null>(null);

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}
function scopesOverlap(a?: string, b?: string): boolean { return !a || !b || a === b; }

export function HotkeyProvider({ actions, children, showFloatingButton = true, position = "bottom-left", offset = { x: 24, y: 24 }, zIndex = 1000, theme = "system", locale = "en", dir, className, allowReservedShortcuts = false }: HotkeyProviderProps) {
  const [open, setOpen] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [settings, setSettings] = useState<Record<string, Shortcut | null>>({});
  const [hydrated, setHydrated] = useState(false);
  const [activeScopes, setActiveScopes] = useState<ScopeId[]>([]);
  const actionsRef = useRef(actions); actionsRef.current = actions;
  useEffect(() => setActiveLocale(locale), [locale]);
  useEffect(() => { const loaded = loadSettings(); setSettings(loaded.shortcuts); setHydrated(true); }, []);
  // Do not write until the initial browser storage read has committed. Without
  // this gate, the empty SSR-safe state can overwrite saved user choices.
  useEffect(() => { if (hydrated) saveSettings({ version: 1, shortcuts: settings }); }, [hydrated, settings]);
  const resolved = useMemo(() => actions.map((action) => ({ ...action, shortcut: Object.prototype.hasOwnProperty.call(settings, action.id) ? settings[action.id]! : action.defaultShortcut })), [actions, settings]);
  const resolvedRef = useRef(resolved); resolvedRef.current = resolved;
  const scopesRef = useRef(activeScopes); scopesRef.current = activeScopes;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || open) return;
      const rankedScopes = [...scopesRef.current].reverse().concat("global");
      for (const scope of rankedScopes) {
        const action = resolvedRef.current.find((item) => (item.scope ?? "global") === scope && item.shortcut && (!isEditable(event.target) || item.allowInEditable) && shortcutMatches(event, item.shortcut!));
        if (action) {
          // An explicit opt-in gets the strongest browser-level prevention we
          // can provide. Browsers may still retain control of some commands.
          if (action.preventDefault || (allowReservedShortcuts && reservedReason(action.shortcut!))) event.preventDefault();
          action.onTrigger(event); return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, allowReservedShortcuts]);

  const updateShortcut = useCallback((id: string, shortcut: Shortcut | null) => {
    const changed = resolvedRef.current.find((item) => item.id === id);
    if (!changed) throw new Error(`Unknown Hotkey action: ${id}`);
    if (shortcut) {
      let normalized: string;
      try { normalized = normalizeShortcut(shortcut); } catch { return { ok: false as const, reason: "reserved" as const }; }
      if (reservedReason(normalized) && !allowReservedShortcuts) return { ok: false as const, reason: "reserved" as const };
      const conflict = resolvedRef.current.find((item) => item.id !== id && item.shortcut && normalizeShortcut(item.shortcut) === normalized && scopesOverlap(item.scope, changed.scope));
      if (conflict) return { ok: false as const, reason: "conflict" as const, action: conflict };
      shortcut = normalized;
    }
    setSettings((current) => ({ ...current, [id]: shortcut }));
    return { ok: true as const };
  }, []);
  const resetShortcut = useCallback((id: string) => setSettings((current) => { const next = { ...current }; delete next[id]; return next; }), []);
  const resetAll = useCallback(() => setSettings({}), []);
  const activateScope = useCallback((scope: ScopeId) => {
    setActiveScopes((current) => [...current.filter((item) => item !== scope), scope]);
    return () => setActiveScopes((current) => current.filter((item) => item !== scope));
  }, []);
  const activeDir = dir ?? defaultDir(activeLocale);
  const value = useMemo<HotkeyContextValue>(() => ({ actions: resolved, open, openSettings: () => setOpen(true), closeSettings: () => setOpen(false), updateShortcut, resetShortcut, resetAll, activeScopes, activateScope, locale: activeLocale, setLocale: setActiveLocale, dir: activeDir, theme, allowReservedShortcuts }), [resolved, open, updateShortcut, resetShortcut, resetAll, activeScopes, activateScope, activeLocale, activeDir, theme, allowReservedShortcuts]);
  return <Context.Provider value={value}><div className={className} data-hotkey-theme={theme} dir={activeDir}>{children}{showFloatingButton && <FloatingTrigger position={position} offset={offset} zIndex={zIndex} />}<HotkeySettingsModal /></div></Context.Provider>;
}

export function useHotkeySettings(): Pick<HotkeyContextValue, "openSettings" | "closeSettings" | "open"> { const value = useContext(Context); if (!value) throw new Error("useHotkeySettings must be used within HotkeyProvider"); return value; }
/** Read or change HotkeyEngine's built-in English/Persian locale at runtime. */
export function useHotkeyLocale(): Pick<HotkeyContextValue, "locale" | "setLocale"> { const value = useContext(Context); if (!value) throw new Error("useHotkeyLocale must be used within HotkeyProvider"); return value; }
export function useHotkeyScope(scope: ScopeId, active = true): void { const value = useContext(Context); if (!value) throw new Error("useHotkeyScope must be used within HotkeyProvider"); const { activateScope } = value; useEffect(() => active ? activateScope(scope) : undefined, [active, scope, activateScope]); }
export function useHotkey(): HotkeyContextValue { const value = useContext(Context); if (!value) throw new Error("useHotkey must be used within HotkeyProvider"); return value; }
