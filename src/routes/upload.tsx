import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import exifr from "exifr";
import { supabase } from "@/integrations/supabase/client";
import { getUploaderName, setUploaderName } from "@/lib/uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({ meta: [{ title: "Upload — Family Album" }] }),
});

const BUCKET = "family-photos";

function UploadPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [hasName, setHasName] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    const existing = getUploaderName();
    if (existing) {
      setName(existing);
      setHasName(true);
    }
  }, []);

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setUploaderName(n);
    setHasName(true);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    let done = 0;
    for (const file of files) {
      try {
        let takenAt: string | null = null;
        try {
          const exif = await exifr.parse(file).catch(() => null);
          const d = exif?.DateTimeOriginal || exif?.CreateDate || exif?.DateTime;
          if (d) takenAt = new Date(d).toISOString();
        } catch {}
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("photos").insert({
          uploader_name: name,
          file_path: path,
          taken_at: takenAt,
        });
        if (dbErr) throw dbErr;
        done++;
        setProgress({ done, total: files.length });
      } catch (err) {
        console.error(err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setBusy(false);
    toast.success(`Uploaded ${done} photo${done === 1 ? "" : "s"}`);
    setFiles([]);
    nav({ to: "/" });
  };

  if (!hasName) {
    return (
      <div className="max-w-md mx-auto py-10">
        <h1 className="text-3xl font-display font-semibold">Who are you?</h1>
        <p className="text-muted-foreground mt-2">We'll remember it on this device so you don't have to type it again.</p>
        <form onSubmit={saveName} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom" autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>Continue</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-display font-semibold">Upload photos</h1>
        <button
          onClick={() => setHasName(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Not {name}?
        </button>
      </div>

      <label className="block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary hover:bg-accent/30 transition">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          disabled={busy}
        />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
        <div className="mt-3 font-medium">
          {files.length ? `${files.length} photo${files.length === 1 ? "" : "s"} selected` : "Click to select photos"}
        </div>
        <div className="text-sm text-muted-foreground mt-1">You can pick multiple at once</div>
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {files.slice(0, 12).map((f, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {files.length > 12 && (
            <div className="aspect-square rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
              +{files.length - 12}
            </div>
          )}
        </div>
      )}

      <Button onClick={handleUpload} disabled={!files.length || busy} className="w-full" size="lg">
        {busy ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading {progress.done}/{progress.total}…</>
        ) : (
          <><CheckCircle2 className="h-4 w-4 mr-2" /> Upload as {name}</>
        )}
      </Button>
    </div>
  );
}
