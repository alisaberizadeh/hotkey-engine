import type { Meta, StoryObj } from "@storybook/react-vite";
import { HotkeyProvider } from "../react/context";
import type { HotkeyAction } from "../core/types";
const actions: HotkeyAction[] = [{ id: "search", label: "Open search", defaultShortcut: "mod+k", editable: true, onTrigger: () => {} }, { id: "save", label: "Save changes", defaultShortcut: "mod+s", editable: true, preventDefault: true, onTrigger: () => {} }];
const meta = { title: "Hotkey/Settings", component: HotkeyProvider, render: () => <HotkeyProvider actions={actions} /> } satisfies Meta<typeof HotkeyProvider>;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const PersianRtl: Story = { render: () => <HotkeyProvider actions={actions} locale="fa" dir="rtl" /> };
