import { describe, expect, it } from "vitest";
import { normalizeShortcut, parseShortcut, reservedReason, shortcutMatches } from "../src/core/shortcut";

describe("shortcuts", () => {
  it("parses a readable shortcut", () => expect(parseShortcut("mod + shift + k").code).toBe("KeyK"));
  it("normalizes equivalent modifier names", () => expect(normalizeShortcut("control+K")).toBe("ctrl+k"));
  it("matches physical keyboard codes", () => {
    const event = new KeyboardEvent("keydown", { code: "KeyK", ctrlKey: true });
    expect(shortcutMatches(event, "ctrl+k")).toBe(true);
  });
  it("identifies Ctrl+K as a browser-reserved command", () => expect(reservedReason("ctrl+k")).toBeTruthy());
});
