import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { displayShortcut } from "../core/shortcut";
import { useHotkey } from "../react/context";
import { messages } from "../locales/messages";

function Recorder({ onSave, onCancel }: { onSave: (shortcut: string) => void; onCancel(): void }) {
  const { locale } = useHotkey();
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      event.preventDefault(); event.stopPropagation();
      if (event.key === "Escape") { onCancel(); return; }
      if (["Control", "Alt", "Shift", "Meta"].includes(event.key) || event.repeat) return;
      const parts = [event.ctrlKey && "ctrl", event.altKey && "alt", event.shiftKey && "shift", event.metaKey && "meta", event.code.startsWith("Key") ? event.code.slice(3).toLowerCase() : event.code.startsWith("Digit") ? event.code.slice(5) : event.code.toLowerCase()].filter(Boolean);
      onSave(parts.join("+"));
    };
    window.addEventListener("keydown", handle, true); return () => window.removeEventListener("keydown", handle, true);
  }, [onSave, onCancel]);
  return <div className="hotkey-recorder" role="status" aria-live="polite">
    <span className="hotkey-recording-label">{messages[locale].recording}<span aria-hidden="true" className="hotkey-recording-dots"><i /><i /><i /></span></span>
    <button type="button" onClick={onCancel}>{messages[locale].cancel}</button>
  </div>;
}

export function HotkeySettingsModal() {
  const { open, closeSettings, actions, updateShortcut, resetShortcut, resetAll, locale, dir, theme } = useHotkey();
  const t = messages[locale]; const dialog = useRef<HTMLDivElement>(null); const previous = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState(""); const [recording, setRecording] = useState<string>(); const [validationError, setValidationError] = useState<{ actionId: string; message: string }>();
  useEffect(() => {
    if (!open) return; previous.current = document.activeElement as HTMLElement; dialog.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !recording) { closeSettings(); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keyboard); return () => { window.removeEventListener("keydown", keyboard); previous.current?.focus(); };
  }, [open, recording, closeSettings]);
  if (!open || typeof document === "undefined") return null;
  const visible = actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));
  const save = (shortcut: string) => {
    if (!recording) return; const result = updateShortcut(recording, shortcut);
    if (result.ok) { setValidationError(undefined); setRecording(undefined); return; }
    const message = result.reason === "conflict"
      ? `${t.conflict}: ${result.action?.label}`
      : locale === "fa"
        ? `${displayShortcut(shortcut)} رزرو است؛ میانبر دیگری انتخاب کنید.`
        : `${displayShortcut(shortcut)} is reserved. Choose another shortcut.`;
    setValidationError({ actionId: recording, message });
  };
  const content = <><div className="hotkey-overlay" data-hotkey-theme={theme} onMouseDown={(event) => { if (event.target === event.currentTarget && !recording) closeSettings(); }}>
    <div ref={dialog} className="hotkey-dialog" data-hotkey-theme={theme} role="dialog" aria-modal="true" aria-labelledby="hotkey-title" tabIndex={-1} dir={dir}>
      <div className="hotkey-glass-layout">
        <header className="hotkey-glass-header"><div className="hotkey-glass-title"><span className="hotkey-glass-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M7 10h1M11 10h1M15 10h2M7 14h6M16 14h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span><div><h2 id="hotkey-title">{locale === "fa" ? t.settings : "Shortcut Settings"}</h2><p>{locale === "fa" ? "میانبرهای سایت خود را شخصی‌سازی کنید" : "Personalize shortcuts for this site"}</p></div></div><div className="hotkey-header-actions"><button type="button" className="hotkey-dialog-close" aria-label={t.close} onClick={closeSettings}>×</button><button type="button" className="hotkey-reset-all-icon" aria-label={t.resetAll} onClick={resetAll}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2.3 5.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M4 5v6h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div></header>
        <section className="hotkey-glass-body">
          <div className="hotkey-glass-toolbar"><div className="hotkey-search-wrap"><span aria-hidden="true">⌕</span><input className="hotkey-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} /></div><span className="hotkey-action-count">{actions.length}</span></div>
          <ul className="hotkey-action-list">{visible.map((action) => <li className="hotkey-action-item" key={action.id}><div className="hotkey-action-row"><div className="hotkey-action-info"><strong>{action.label}</strong><span>{action.shortcut ? displayShortcut(action.shortcut) : t.disabled}</span></div>{recording === action.id ? <Recorder onSave={save} onCancel={() => { setValidationError(undefined); setRecording(undefined); }} /> : <div className="hotkey-row-actions">{action.editable !== false && <button type="button" className="hotkey-action-edit" onClick={() => { setValidationError(undefined); setRecording(action.id); }}>{t.edit}</button>}{action.editable !== false && <button type="button" className="hotkey-action-disable" onClick={() => updateShortcut(action.id, null)}>{t.disable}</button>}<button type="button" className="hotkey-action-reset" onClick={() => resetShortcut(action.id)}>{t.reset}</button></div>}</div>{validationError?.actionId === action.id && <div className="hotkey-inline-feedback" role="alert" aria-live="assertive"><span aria-hidden="true">!</span><p>{validationError.message}</p></div>}</li>)}</ul>
        </section>
      </div>
    </div></div></>;
  return createPortal(content, document.body);
}
