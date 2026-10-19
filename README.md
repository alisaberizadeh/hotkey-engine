# hotkey-engine

[![npm version](https://img.shields.io/npm/v/hotkey-engine.svg)](https://www.npmjs.com/package/hotkey-engine)
[![license](https://img.shields.io/npm/l/hotkey-engine.svg)](./LICENSE)

An accessible, user-customizable keyboard shortcut engine for React 18+ and Next.js 13+.

hotkey-engine combines a headless shortcut runtime with an optional ready-made settings UI: a floating trigger, a searchable modal, shortcut recording, persistence, English/Persian localization, RTL support, and light/dark themes. It has no external UI-library dependency.

## Features

- Physical-key shortcuts that remain stable when the user changes keyboard language/layout.
- Cross-platform mod modifier: Command on macOS, Control on Windows and Linux.
- Named scopes with stack-based priority.
- Per-action shortcut editing, disabling, reset, and reset-all.
- Conflict detection for overlapping scopes.
- Safe-by-default handling of browser and operating-system reserved shortcuts.
- Versioned localStorage persistence, read only after mount for SSR safety.
- Ready-made accessible dialog with focus trapping, focus restoration, Escape support, and appropriate ARIA semantics.
- Built-in English/LTR and Persian/RTL UI; Vazir is bundled for Persian text.
- Light, dark, and system themes.
- Explicit CSS import and documented CSS hooks for visual customization.

## Installation

~~~bash
npm install hotkey-engine
~~~

Import the stylesheet once, after your application's base styles:

~~~tsx
import "hotkey-engine/styles.css";
~~~

## Quick start: React

~~~tsx
import {
  HotkeyProvider,
  HotkeySettingsTrigger,
  type HotkeyAction,
} from "hotkey-engine";
import "hotkey-engine/styles.css";

const actions: HotkeyAction[] = [
  {
    id: "site-search",
    label: "Open site search",
    defaultShortcut: "mod+k",
    editable: true,
    onTrigger: () => document.getElementById("site-search")?.focus(),
  },
  {
    id: "save-draft",
    label: "Save draft",
    defaultShortcut: "mod+s",
    editable: true,
    preventDefault: true,
    onTrigger: () => saveDraft(),
  },
];

export function App() {
  return (
    <HotkeyProvider actions={actions}>
      <input id="site-search" placeholder="Search" />
      <HotkeySettingsTrigger>Keyboard shortcuts</HotkeySettingsTrigger>
    </HotkeyProvider>
  );
}
~~~

By default, a floating settings trigger is displayed at the bottom-left of the viewport. HotkeySettingsTrigger is optional; it is a convenient way to connect your own button or menu item to the settings dialog.

## Next.js 13+ (App Router)

Render the provider from a Client Component. hotkey-engine does not read window or localStorage during server rendering.

~~~tsx
// app/shortcut-provider.tsx
"use client";

import { HotkeyProvider, type HotkeyAction } from "hotkey-engine";

const actions: HotkeyAction[] = [
  {
    id: "search",
    label: "Open search",
    defaultShortcut: "mod+k",
    editable: true,
    onTrigger: () => console.log("open search"),
  },
];

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  return <HotkeyProvider actions={actions}>{children}</HotkeyProvider>;
}
~~~

~~~tsx
// app/layout.tsx
import "hotkey-engine/styles.css";
import { ShortcutProvider } from "./shortcut-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ShortcutProvider>{children}</ShortcutProvider></body>
    </html>
  );
}
~~~

## Defining actions

Each shortcut is defined as a HotkeyAction.

~~~ts
type HotkeyAction = {
  id: string;
  label: string;
  defaultShortcut: string;
  onTrigger: (event: KeyboardEvent) => void;
  editable?: boolean;
  scope?: string;
  allowInEditable?: boolean;
  preventDefault?: boolean;
};
~~~

| Field | Description |
| --- | --- |
| id | A stable, unique action identifier. Do not reuse an id for another action, because persisted user preferences are keyed by it. |
| label | The action label shown in the settings dialog. |
| defaultShortcut | A shortcut such as mod+k, ctrl+shift+n, or alt+arrowleft. |
| onTrigger | Runs when the shortcut matches. |
| editable | Set false to prevent users from editing or disabling this action. Defaults to editable. |
| scope | The named scope for this action. Defaults to global. |
| allowInEditable | Allows the action while an input, textarea, or contenteditable element is focused. Defaults to false. |
| preventDefault | Calls event.preventDefault() before the callback runs. |

Supported non-modifier keys are letters, numbers, F1 through F12, enter, escape, space, tab, backspace, delete, arrowup, arrowdown, arrowleft, arrowright, and slash. Supported modifiers are ctrl, alt, shift, meta, and mod.

The mod modifier resolves to Command on macOS and Control on other platforms. Matching is based on KeyboardEvent.code, not the typed character, so shortcut behavior does not change with keyboard language.

## Opening and closing the settings dialog

Use a custom trigger:

~~~tsx
import { HotkeySettingsTrigger } from "hotkey-engine";

<HotkeySettingsTrigger>Manage shortcuts</HotkeySettingsTrigger>
~~~

Or control it programmatically:

~~~tsx
import { useHotkeySettings } from "hotkey-engine";

function ShortcutMenuItem() {
  const { openSettings, closeSettings, open } = useHotkeySettings();

  return (
    <>
      <button onClick={openSettings}>Manage shortcuts</button>
      {open && <button onClick={closeSettings}>Close settings</button>}
    </>
  );
}
~~~

useHotkeySettings must be called beneath HotkeyProvider.

## Scopes and precedence

Actions without a scope belong to global. Active named scopes take precedence over global. When more than one scope is active, the most recently activated scope is checked first.

~~~tsx
import { useHotkeyScope } from "hotkey-engine";

function Editor() {
  useHotkeyScope("editor");
  return <textarea />;
}

const actions = [
  { id: "global-save", label: "Save", defaultShortcut: "mod+s", onTrigger: saveSite },
  {
    id: "editor-save",
    label: "Save editor",
    defaultShortcut: "mod+s",
    scope: "editor",
    onTrigger: saveEditor,
  },
];
~~~

The editor action runs while Editor is mounted; otherwise the global action runs. Users cannot save duplicate shortcuts for actions whose scopes overlap. The settings dialog reports the conflicting action.

## Reserved browser and system shortcuts

By default, users cannot assign commonly reserved commands such as Ctrl/Cmd + K, L, R, W, T, N, P, or Alt + F4. The recorder keeps the existing shortcut and shows an inline error for that action.

This is the recommended default. Browsers and operating systems own many of these commands and do not offer a reliable way for a website to take control of them.

If your product intentionally allows users to attempt reserved bindings, opt in at the provider level:

~~~tsx
<HotkeyProvider actions={actions} allowReservedShortcuts>
  <App />
</HotkeyProvider>
~~~

With allowReservedShortcuts, hotkey-engine calls preventDefault() for matching reserved shortcuts, giving the website the strongest browser-level priority available. It is not a guarantee: the browser or operating system can still retain control. Only enable this after considering that trade-off.

## Themes

~~~tsx
<HotkeyProvider actions={actions} theme="dark">
  <App />
</HotkeyProvider>
~~~

| Value | Behavior |
| --- | --- |
| light | Always renders the light package UI. |
| dark | Always renders the dark package UI. |
| system | The default. Follows the browser's prefers-color-scheme setting. |

The theme affects only hotkey-engine UI. It does not modify your application's theme or global color scheme.

## Language and RTL

English/LTR is the default. Set locale to fa to use the built-in Persian strings, Vazir font, and RTL layout.

~~~tsx
<HotkeyProvider actions={actions} locale="fa">
  <App />
</HotkeyProvider>
~~~

Switch locales at runtime:

~~~tsx
import { useHotkeyLocale } from "hotkey-engine";

function LanguageSwitch() {
  const { locale, setLocale } = useHotkeyLocale();

  return (
    <button onClick={() => setLocale(locale === "en" ? "fa" : "en")}>
      {locale === "en" ? "فارسی" : "English"}
    </button>
  );
}
~~~

Use dir="rtl" or dir="ltr" on the provider when direction must be set independently of the locale.

## Floating trigger

~~~tsx
<HotkeyProvider
  actions={actions}
  showFloatingButton
  position="bottom-right"
  offset={{ x: 32, y: 24 }}
  zIndex={2000}
>
  <App />
</HotkeyProvider>
~~~

| Prop | Default | Description |
| --- | --- | --- |
| showFloatingButton | true | Controls whether the default floating trigger is rendered. |
| position | bottom-left | One of bottom-left, bottom-right, top-left, or top-right. |
| offset | { x: 24, y: 24 } | A pixel value for both axes, or separate x and y pixel values. |
| zIndex | 1000 | The floating trigger z-index. |

Set showFloatingButton={false} when you only want to use a custom trigger or useHotkeySettings.

## UI customization

The shipped UI is intentionally customizable. Import your application's stylesheet after hotkey-engine/styles.css, then override its CSS variables and documented class hooks.

~~~tsx
<HotkeyProvider actions={actions} className="my-product">
  <HotkeySettingsTrigger className="my-shortcut-button">
    Shortcuts
  </HotkeySettingsTrigger>
  <App />
</HotkeyProvider>
~~~

className on HotkeyProvider is applied to the wrapper around your children. className on HotkeySettingsTrigger is applied to that trigger button.

The settings dialog is rendered with a portal in document.body. Therefore, dialog styles must use the package selectors directly rather than a selector scoped below .my-product.

### Example: a custom light theme

~~~css
/* app.css — import after hotkey-engine/styles.css */
.hotkey-dialog[data-hotkey-theme="light"] {
  --hk-header: linear-gradient(110deg, #075985, #0f766e);
  --hk-text: #17324d;
  --hk-muted: #52718f;
  --hk-line: rgba(15, 118, 110, .18);
  --hk-control: rgba(255, 255, 255, .72);
  --hk-control-hover: rgba(236, 253, 245, .9);
  border-radius: 24px;
}

.hotkey-floating-trigger {
  background: #0f766e;
  color: #fff;
  border-color: transparent;
  border-radius: 14px;
}

.hotkey-action-edit,
.hotkey-action-disable,
.hotkey-action-reset {
  border-radius: 8px;
}
~~~

### CSS hooks

| Selector | Target |
| --- | --- |
| .hotkey-floating-trigger | Floating settings trigger. |
| .hotkey-overlay | Dialog backdrop. |
| .hotkey-dialog | Settings dialog container. |
| .hotkey-glass-header | Dialog header. |
| .hotkey-search-wrap and .hotkey-search | Search control. |
| .hotkey-action-item | One action row. |
| .hotkey-action-edit, .hotkey-action-disable, .hotkey-action-reset | Per-action controls. |
| .hotkey-inline-feedback | Inline conflict/reserved-shortcut feedback. |
| .hotkey-recorder | Shortcut recording state. |

The primary customization variables are --hk-header, --hk-panel, --hk-control, --hk-control-hover, --hk-text, --hk-muted, and --hk-line. To customize dark mode, target .hotkey-dialog[data-hotkey-theme="dark"] instead.

## Persistence

After mounting, user preferences are saved to versioned localStorage under hotkey-engine:v1. A change takes effect immediately and is then persisted. The reset-all header action immediately restores every action to its declared default shortcut.

Custom storage adapters, multi-device sync, and multi-step shortcut sequences are outside the current scope.

## Provider API

| Prop | Default | Description |
| --- | --- | --- |
| actions | — | Required array of HotkeyAction objects. |
| showFloatingButton | true | Shows the built-in floating trigger. |
| position | bottom-left | Floating trigger position. |
| offset | { x: 24, y: 24 } | Floating trigger edge offset in pixels. |
| zIndex | 1000 | Floating trigger z-index. |
| theme | system | light, dark, or system. |
| locale | en | en or fa. |
| dir | Derived from locale | ltr or rtl. |
| className | — | Class on the provider child wrapper. |
| allowReservedShortcuts | false | Allows recorder assignment of reserved browser/system shortcuts. |

## Accessibility behavior

The settings UI uses a modal dialog with aria-modal and a labelled heading. When opened, focus moves to the dialog. Tab focus stays inside it, Escape closes it when recording is inactive, and focus returns to the element that opened it. The floating trigger and custom trigger are ordinary buttons with accessible labels.

## Development

~~~bash
npm test
npm run build
npm run storybook
~~~

Build a static Storybook bundle:

~~~bash
npm run build-storybook
~~~

## License

[MIT](./LICENSE)
