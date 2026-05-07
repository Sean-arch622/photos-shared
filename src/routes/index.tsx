import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ImageIcon, Trash2, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Photo = {
  id: string;
  uploader_name: string;
  file_path: string;
  taken_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/")({
  component: Gallery,
  head: () => ({ meta: [{ title: "Gallery — Family Album" }] }),
});

const BUCKET = "family-photos";

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
function thumbUrl(path: string, width = 600) {
  return supabase.storage.from(BUCKET).getPublicUrl(path, {
    transform: { width, height: width, resize: "cover", quality: 70 },
  }).data.publicUrl;
}

function Gallery() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState<null | { from: number; dir: 1 | -1 }>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("photos").select("*");
      setPhotos((data as Photo[]) ?? []);
    })();
  }, []);

  const members = Array.from(new Set((photos ?? []).map((p) => p.uploader_name))).sort();
  const sorted = (photos ?? [])
    .filter((p) => !memberFilter || p.uploader_name === memberFilter)
    .slice()
    .sort((a, b) => {
      const da = new Date(a.taken_at ?? a.created_at).getTime();
      const db = new Date(b.taken_at ?? b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });

  const closeViewer = () => setViewerIndex(null);
  const animateTo = (dir: 1 | -1) => {
    if (viewerIndex === null || sorted.length < 2) return;
    setAnimating({ from: viewerIndex, dir });
  };
  const prev = () => animateTo(-1);
  const next = () => animateTo(1);
  const openViewer = (idx: number) => {
    setOpening(true);
    setViewerIndex(idx);
    setDragX(0);
    setAnimating(null);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpening(false)));
  };

  // When animation ends, commit the index change without a visible snap.
  // We mark `dragging` true for the swap frame so the transform reset
  // (translate back to center with the new current photo) does not animate.
  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => {
      setDragging(true);
      setViewerIndex((i) => {
        if (i === null) return null;
        const n = sorted.length;
        return (i + animating.dir + n) % n;
      });
      setDragX(0);
      setAnimating(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDragging(false));
      });
    }, 320);
    return () => clearTimeout(t);
  }, [animating, sorted.length]);

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewerIndex, sorted.length]);

  const handleDelete = async (p: Photo) => {
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([p.file_path]);
    const { error: dErr } = await supabase.from("photos").delete().eq("id", p.id);
    if (sErr || dErr) {
      toast.error("Failed to delete photo");
      return;
    }
    setPhotos((prev) => (prev ?? []).filter((x) => x.id !== p.id));
    toast.success("Photo deleted");
    setViewerIndex((i) => {
      if (i === null) return null;
      const newLen = sorted.length - 1;
      if (newLen <= 0) return null;
      return Math.min(i, newLen - 1);
    });
  };

  const dragStartX = useRef<number | null>(null);
  const viewportW = useRef<number>(typeof window !== "undefined" ? window.innerWidth : 1);
  const onPointerDown = (e: React.PointerEvent) => {
    if (animating) return;
    dragStartX.current = e.clientX;
    viewportW.current = window.innerWidth;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    setDragX(e.clientX - dragStartX.current);
  };
  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    const threshold = viewportW.current * 0.18;
    const dx = dragX;
    dragStartX.current = null;
    setDragging(false);
    if (dx <= -threshold) animateTo(1);
    else if (dx >= threshold) animateTo(-1);
    else setDragX(0);
  };

  const current = viewerIndex !== null ? sorted[viewerIndex] : null;

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-5xl md:text-6xl font-display font-semibold tracking-tight">
          <span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Family Photos</span>
        </h1>
      </section>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setSort("newest")}
              className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition ${sort === "newest" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              <ArrowDownNarrowWide className="h-4 w-4" /> Newest
            </button>
            <button
              onClick={() => setSort("oldest")}
              className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition ${sort === "oldest" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              <ArrowUpNarrowWide className="h-4 w-4" /> Oldest
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition border ${memberFilter ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Users className="h-4 w-4" />
                {memberFilter ?? "Sort by member"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by uploader</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={memberFilter === null}
                onCheckedChange={() => setMemberFilter(null)}
              >
                Everyone
              </DropdownMenuCheckboxItem>
              {members.length === 0 ? (
                <DropdownMenuItem disabled>No members yet</DropdownMenuItem>
              ) : (
                members.map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m}
                    checked={memberFilter === m}
                    onCheckedChange={() => setMemberFilter(memberFilter === m ? null : m)}
                  >
                    {m}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="text-sm text-muted-foreground">{sorted.length} photo{sorted.length === 1 ? "" : "s"}</span>
      </div>

      {photos === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No photos yet.</p>
          <Link to="/upload" className="inline-block mt-4 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
            Upload the first one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => openViewer(idx)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted text-left"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <img
                src={thumbUrl(p.file_path, 600)}
                alt={`Uploaded by ${p.uploader_name}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition">
                <div className="font-medium">{p.uploader_name}</div>
                <div className="opacity-80">
                  {new Date(p.taken_at ?? p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {current && (() => {
        const n = sorted.length;
        const prevPhoto = n > 1 ? sorted[(viewerIndex! - 1 + n) % n] : null;
        const nextPhoto = n > 1 ? sorted[(viewerIndex! + 1) % n] : null;
        const animOffsetVw = animating ? -animating.dir * 100 : 0;
        const translate = `translate3d(calc(-100vw + ${animOffsetVw}vw + ${dragX}px), 0, 0)`;
        const transition = dragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
        return (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden animate-viewer-backdrop"
        >
          <button
            onClick={closeViewer}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 text-white text-sm z-10">
            <div className="font-medium">{current.uploader_name}</div>
            <div className="opacity-70 text-xs">
              {new Date(current.taken_at ?? current.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete photo"
                className="absolute bottom-4 right-4 p-3 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 z-10"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the photo uploaded by {current.uploader_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(current)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-2 md:left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-2 md:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <div
            className="absolute inset-0 flex items-center touch-pan-y"
            style={{ transform: translate, transition, willChange: "transform" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {[prevPhoto, current, nextPhoto].map((p, i) => (
              <div key={i} className="w-screen h-full flex-shrink-0 flex items-center justify-center px-4">
                {p && (
                  <img
                    src={publicUrl(p.file_path)}
                    alt=""
                    className={`max-w-full max-h-full object-contain select-none ${i === 1 && opening ? "animate-viewer-zoom" : ""}`}
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
            {(viewerIndex ?? 0) + 1} / {sorted.length}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
