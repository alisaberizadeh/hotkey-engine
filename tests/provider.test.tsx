import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HotkeyProvider, HotkeySettingsTrigger, useHotkeyLocale, useHotkeyScope } from "../src";

const baseAction = { id: "search", label: "Open search", defaultShortcut: "ctrl+k", onTrigger: vi.fn(), editable: true };
function Scope() { useHotkeyScope("modal"); return null; }
function LocaleSwitch() { const { setLocale } = useHotkeyLocale(); return <button onClick={() => setLocale("fa")}>Persian</button>; }
describe("HotkeyProvider", () => {
  it("runs a matching action and ignores editable targets by default", () => {
    const fn = vi.fn(); render(<HotkeyProvider actions={[{ ...baseAction, onTrigger: fn }]}><input aria-label="input" /></HotkeyProvider>);
    fireEvent.keyDown(window, { code: "KeyK", ctrlKey: true }); expect(fn).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByLabelText("input"), { code: "KeyK", ctrlKey: true }); expect(fn).toHaveBeenCalledOnce();
  });
  it("opens the settings dialog from a custom trigger", () => {
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("opens the settings dialog from the default floating button", () => {
    render(<HotkeyProvider actions={[baseAction]} />);
    fireEvent.click(screen.getByLabelText("Keyboard shortcut settings"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("closes with Escape and restores focus to the trigger", () => {
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    const trigger = screen.getByText("Open"); trigger.focus(); fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("applies an explicit dark theme to the portalled settings dialog", () => {
    render(<HotkeyProvider actions={[baseAction]} theme="dark"><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); expect(screen.getByRole("dialog")).toHaveAttribute("data-hotkey-theme", "dark");
  });
  it("switches the portalled modal to Persian RTL at runtime", () => {
    render(<HotkeyProvider actions={[baseAction]}><LocaleSwitch /><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Persian")); fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toHaveAttribute("dir", "rtl"); expect(screen.getByText("تنظیمات میانبرها")).toBeInTheDocument();
  });
  it("persists a user-disabled shortcut", () => {
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); fireEvent.click(screen.getByText("Disable"));
    expect(JSON.parse(window.localStorage.getItem("hotkey-engine:v1")!).shortcuts.search).toBeNull();
  });
  it("resets all shortcuts immediately from the header icon", () => {
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); fireEvent.click(screen.getByText("Disable"));
    fireEvent.click(screen.getByLabelText("Reset all")); expect(screen.getByText("Ctrl + K")).toBeInTheDocument();
  });
  it("keeps persisted settings after a provider remount", () => {
    const first = render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); fireEvent.click(screen.getByText("Disable")); first.unmount();
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open again</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open again")); expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
  it("explains why a reserved shortcut cannot be saved by default", () => {
    render(<HotkeyProvider actions={[baseAction]}><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.keyDown(window, { code: "KeyK", ctrlKey: true });
    expect(screen.getByText("Ctrl + K is reserved. Choose another shortcut.")).toBeInTheDocument();
  });
  it("allows a reserved shortcut after explicit developer opt-in", () => {
    render(<HotkeyProvider actions={[baseAction]} allowReservedShortcuts><HotkeySettingsTrigger>Open</HotkeySettingsTrigger></HotkeyProvider>);
    fireEvent.click(screen.getByText("Open")); fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.keyDown(window, { code: "KeyK", ctrlKey: true });
    expect(screen.getByText("Ctrl + K")).toBeInTheDocument();
  });
  it("gives the active scope precedence", () => {
    const global = vi.fn(), modal = vi.fn(); render(<HotkeyProvider actions={[{ ...baseAction, onTrigger: global }, { ...baseAction, id: "modal", scope: "modal", onTrigger: modal }]}><Scope /></HotkeyProvider>);
    fireEvent.keyDown(window, { code: "KeyK", ctrlKey: true }); expect(modal).toHaveBeenCalledOnce(); expect(global).not.toHaveBeenCalled();
  });
});
