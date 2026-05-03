import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ImageIcon, Trash2, Users } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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

function Gallery() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [memberFilter, setMemberFilter] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-5xl md:text-6xl font-display font-semibold tracking-tight">
          Our family, <span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in pictures</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Every photo, every memory — together in one place.
        </p>
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
          {sorted.map((p) => (
            <figure key={p.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted" style={{ boxShadow: "var(--shadow-soft)" }}>
              <img
                src={publicUrl(p.file_path)}
                alt={`Uploaded by ${p.uploader_name}`}
                loading="lazy"
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    aria-label="Delete photo"
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the photo uploaded by {p.uploader_name}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const { error: sErr } = await supabase.storage.from(BUCKET).remove([p.file_path]);
                        const { error: dErr } = await supabase.from("photos").delete().eq("id", p.id);
                        if (sErr || dErr) {
                          toast.error("Failed to delete photo");
                          return;
                        }
                        setPhotos((prev) => (prev ?? []).filter((x) => x.id !== p.id));
                        toast.success("Photo deleted");
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition">
                <div className="font-medium">{p.uploader_name}</div>
                <div className="opacity-80">
                  {new Date(p.taken_at ?? p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
