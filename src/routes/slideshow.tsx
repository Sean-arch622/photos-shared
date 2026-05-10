import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

type Photo = { id: string; file_path: string; taken_at: string | null; created_at: string };

export const Route = createFileRoute("/slideshow")({
  component: Slideshow,
  head: () => ({ meta: [{ title: "Slideshow — Family Album" }] }),
});

const BUCKET = "family-photos";
const INTERVAL_MS = 4500;
const FADE_MS = 1400;

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function Slideshow() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [index, setIndex] = useState(0);
  // toggle which "slot" holds the current image so we can crossfade
  const [slot, setSlot] = useState(0);
  const [urls, setUrls] = useState<[string | null, string | null]>([null, null]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: true });
      const list = (data as Photo[]) ?? [];
      setPhotos(list);
      if (list.length > 0) {
        setUrls([publicUrl(list[0].file_path), null]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!photos || photos.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % photos.length;
        const nextUrl = publicUrl(photos[next].file_path);
        setSlot((s) => {
          const newSlot = s === 0 ? 1 : 0;
          setUrls((prev) => {
            const arr: [string | null, string | null] = [...prev] as any;
            arr[newSlot] = nextUrl;
            return arr;
          });
          return newSlot;
        });
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [photos]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate({ to: "/" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <button
        onClick={() => navigate({ to: "/" })}
        aria-label="Exit slideshow"
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur"
      >
        <X className="h-6 w-6" />
      </button>

      {photos && photos.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          No photos yet.
        </div>
      )}

      {[0, 1].map((i) => {
        const url = urls[i];
        if (!url) return null;
        const visible = slot === i;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
            }}
          >
            {/* blurred background fill for letterboxing */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(40px) saturate(1.4)",
                transform: "scale(1.15)",
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={url}
                alt=""
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        );
      })}

      {/* preload upcoming */}
      {photos && photos.length > 1 && (
        <link rel="preload" as="image" href={publicUrl(photos[(index + 1) % photos.length].file_path)} />
      )}
    </div>
  );
}
