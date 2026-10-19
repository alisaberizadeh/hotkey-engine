export type ScopeId = string;
export type Shortcut = string;
export type Theme = "light" | "dark" | "system";
export type Direction = "ltr" | "rtl";
export type FloatingPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";

export interface HotkeyAction {
  id: string;
  label: string;
  defaultShortcut: Shortcut;
  onTrigger: (event: KeyboardEvent) => void;
  editable?: boolean;
  scope?: ScopeId;
  allowInEditable?: boolean;
  preventDefault?: boolean;
}

export interface ParsedShortcut {
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; mod: boolean };
  code: string;
}

export interface StoredSettings { version: 1; shortcuts: Record<string, Shortcut | null>; }

export interface ResolvedAction extends HotkeyAction { shortcut: Shortcut | null; }
