import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTheme, setTheme, getUploaderName } from "@/lib/uploader";
import { Moon, Sun, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout() {
  const [theme, setT] = useState<"light" | "dark">("light");
  const [name, setName] = useState<string | null>(null);
  const loc = useLocation();

  useEffect(() => {
    const t = getTheme();
    setT(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setName(getUploaderName());
  }, [loc.pathname]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setT(next);
    setTheme(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header
        className="fixed left-0 right-0 z-40 px-3 sm:px-6"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div className="max-w-6xl mx-auto rounded-2xl border bg-background/75 backdrop-blur-xl px-4 sm:px-5 h-14 flex items-center justify-between shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)]">
          <Link to="/" className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            <span>Family Album</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="px-2.5 sm:px-3 py-1.5 text-sm rounded-md hover:bg-accent" activeProps={{ className: "px-2.5 sm:px-3 py-1.5 text-sm rounded-md bg-accent font-medium" }} activeOptions={{ exact: true }}>
              Gallery
            </Link>
            <Link to="/upload" className="px-2.5 sm:px-3 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-1" activeProps={{ className: "px-2.5 sm:px-3 py-1.5 text-sm rounded-md bg-accent font-medium flex items-center gap-1" }}>
              <Upload className="h-4 w-4" /> <span className="hidden xs:inline">Upload</span>
            </Link>
            {name && <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Hi, {name}</span>}
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="toggle theme" className="h-9 w-9">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </nav>
        </div>
      </header>
      <main
        className="max-w-6xl mx-auto px-6 pb-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 6rem)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
