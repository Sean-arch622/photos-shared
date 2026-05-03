const KEY = "family-photos.uploader-name";

export function getUploaderName(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + KEY + "=([^;]+)"));
  if (m) return decodeURIComponent(m[2]);
  return localStorage.getItem(KEY);
}

export function setUploaderName(name: string) {
  const v = encodeURIComponent(name);
  document.cookie = `${KEY}=${v}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; SameSite=Lax`;
  localStorage.setItem(KEY, name);
}

const THEME_KEY = "family-photos.theme";
export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const t = localStorage.getItem(THEME_KEY);
  if (t === "dark" || t === "light") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function setTheme(t: "light" | "dark") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("dark", t === "dark");
}
