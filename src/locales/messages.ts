import type { Direction } from "../core/types";

export type Locale = "en" | "fa";
export const messages = {
  en: { settings: "Shortcut settings", search: "Search shortcuts", edit: "Edit", disable: "Disable", reset: "Reset", resetAll: "Reset all", save: "Save", cancel: "Cancel", close: "Close", recording: "Press a shortcut", disabled: "Disabled", conflict: "This shortcut is already used by", reserved: "This shortcut is reserved by your browser or operating system. Please choose another shortcut.", unavailable: "Shortcut unavailable", resetConfirm: "Reset all shortcuts to their defaults?", confirm: "Confirm", floatingLabel: "Keyboard shortcut settings" },
  fa: { settings: "تنظیمات میانبرها", search: "جستجوی میانبرها", edit: "ویرایش", disable: "غیرفعال‌سازی", reset: "بازنشانی", resetAll: "بازنشانی همه", save: "ذخیره", cancel: "لغو", close: "بستن", recording: "یک میانبر را فشار دهید", disabled: "غیرفعال", conflict: "این میانبر هم‌اکنون استفاده می‌شود توسط", reserved: "این میانبر توسط مرورگر یا سیستم‌عامل رزرو شده است؛ لطفاً میانبر دیگری انتخاب کنید.", unavailable: "این میانبر در دسترس نیست", resetConfirm: "همهٔ میانبرها به حالت پیش‌فرض برگردند؟", confirm: "تأیید", floatingLabel: "تنظیمات میانبرهای کیبورد" }
} as const;
export function defaultDir(locale: Locale): Direction { return locale === "fa" ? "rtl" : "ltr"; }
