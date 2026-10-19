import React from "react";
import type { FloatingPosition } from "../core/types";
import { useHotkey, useHotkeySettings } from "../react/context";
import { messages } from "../locales/messages";

export function HotkeySettingsTrigger({ children, className }: { children?: React.ReactNode; className?: string }) {
  const { openSettings } = useHotkeySettings();
  return <button type="button" className={className} onClick={openSettings}>{children ?? "Keyboard shortcuts"}</button>;
}

export function FloatingTrigger({ position, offset, zIndex }: { position: FloatingPosition; offset: number | { x: number; y: number }; zIndex: number }) {
  const { openSettings } = useHotkeySettings(); const { locale } = useHotkey();
  const value = typeof offset === "number" ? { x: offset, y: offset } : offset;
  const [vertical, horizontal] = position.split("-");
  const style: React.CSSProperties = { position: "fixed", [vertical]: value.y, [horizontal]: value.x, zIndex };
  return <button type="button" className="hotkey-floating-trigger" style={style} aria-label={messages[locale].floatingLabel} title={messages[locale].floatingLabel} onClick={openSettings}>
    <svg className="hotkey-trigger-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 9h.01M10 9h.01M13 9h.01M16 9h1M7 13h1M10 13h1M13 13h4M7 16h10" />
    </svg>
  </button>;
}
