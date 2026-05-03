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
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            Family Album
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="px-3 py-2 text-sm rounded-md hover:bg-accent" activeProps={{ className: "px-3 py-2 text-sm rounded-md bg-accent font-medium" }} activeOptions={{ exact: true }}>
              Gallery
            </Link>
            <Link to="/upload" className="px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-1" activeProps={{ className: "px-3 py-2 text-sm rounded-md bg-accent font-medium flex items-center gap-1" }}>
              <Upload className="h-4 w-4" /> Upload
            </Link>
            {name && <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Hi, {name}</span>}
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="toggle theme">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
