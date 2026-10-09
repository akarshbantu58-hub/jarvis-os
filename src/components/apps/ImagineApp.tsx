import { useCallback, useEffect, useRef, useState } from "react";
import { streamImage } from "@/lib/streamImage";
import { ImagePlus, Sparkles, Download, Upload, X, Loader2, Trash2, Cloud } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { deleteImage, listImages, saveImage, type SavedImage } from "@/lib/chatStore";


const PRESETS = [
  "A holographic JARVIS interface glowing in a dark room, cinematic",
  "Neon cyberpunk Mumbai skyline at night, rain, reflections",
  "Minimal 3D glass app icon of a rocket, soft cyan lighting",
  "Portrait of a futuristic AI assistant orb made of liquid light",
];

const MODELS = [
  { id: "openai/gpt-image-2", label: "GPT Image (GPT-5 family)" },
  { id: "google/gemini-3.1-flash-image", label: "Nano Banana 2" },
];

export function ImagineApp() {
  return <ImagineStudio />;
}

function ImagineStudio() {

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(
    () => localStorage.getItem("jarvis.imageModel") || "openai/gpt-image-2",
  );
  const [src, setSrc] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<SavedImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const refreshGallery = useCallback(async () => {
    if (!user) { setGallery([]); return; }
    try { setGallery(await listImages()); } catch (e) { console.error(e); }
  }, [user]);

  useEffect(() => { void refreshGallery(); }, [refreshGallery]);

  const generate = async (p?: string) => {
    const text = (p ?? prompt).trim();
    if (!text || busy) return;
    setPrompt(text);
    setBusy(true);
    setError(null);
    setSrc(null);
    setIsFinal(false);
    try {
      let last = "";
      await streamImage(
        text,
        (dataUrl, final) => {
          last = dataUrl;
          setSrc(dataUrl);
          if (final) setIsFinal(true);
        },
        refImage ?? undefined,
        model,
      );
      if (last && user) {
        try {
          const saved = await saveImage(last, text, model);
          setGallery((g) => [saved, ...g]);
        } catch (e) {
          console.error(e);
          setError("Image created, but saving to your account failed.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };


  const onUpload = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRefImage(String(reader.result));
    reader.readAsDataURL(f);
  };

  const download = (url: string, name = "jarvis-image.png") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Prompt bar */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <select
            value={model}
            onChange={(e) => { setModel(e.target.value); localStorage.setItem("jarvis.imageModel", e.target.value); }}
            className="bg-white/5 border border-white/10 rounded-md px-2 py-1 outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-background">{m.label}</option>
            ))}
          </select>
          <span>{refImage ? "editing uses Nano Banana 2" : "image generation"}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Cloud className="w-3 h-3" />
            {user ? "saved to your account" : "sign in to save"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void generate(); }}
            placeholder={refImage ? "Describe the edit…" : "Describe the image…"}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-cyan-400/40"
          />
          <button
            onClick={() => void generate()}
            disabled={busy || !prompt.trim()}
            className="px-4 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-medium disabled:opacity-40 flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {busy ? "Creating" : "Create"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs flex items-center gap-1 hover:bg-white/10"
          >
            <Upload className="w-3 h-3" /> Reference
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => onUpload(e.target.files?.[0])} />
          {refImage && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-400/10 border border-cyan-400/30 text-xs">
              <img src={refImage} alt="reference" className="w-4 h-4 rounded object-cover" />
              editing
              <button onClick={() => setRefImage(null)}><X className="w-3 h-3" /></button>
            </span>
          )}
          {PRESETS.map((p) => (
            <button key={p} onClick={() => void generate(p)}
              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-muted-foreground hover:bg-white/10 truncate max-w-[180px]">
              {p.split(",")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>
        )}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-square max-w-lg mx-auto flex items-center justify-center">
          {src ? (
            <>
              <img
                src={src}
                alt={prompt}
                className={`w-full h-full object-cover transition-[filter] duration-500 ${isFinal ? "blur-0" : "blur-2xl"}`}
              />
              {isFinal && (
                <button onClick={() => download(src)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg glass-strong text-xs flex items-center gap-1">
                  <Download className="w-3 h-3" /> Save
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground text-xs px-6">
              {busy ? "Rendering your image…" : "Your generated image will appear here"}
            </div>
          )}
        </div>

        {gallery.length > 0 && (
          <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
            {gallery.map((g) => (
              <div key={g.id} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/40">
                <button onClick={() => { setSrc(g.url); setIsFinal(true); setPrompt(g.prompt); }} className="w-full h-full">
                  <img src={g.url} alt={g.prompt} className="w-full h-full object-cover" />
                </button>
                <button
                  onClick={() => { void deleteImage(g).then(() => setGallery((cur) => cur.filter((x) => x.id !== g.id))).catch(console.error); }}
                  className="absolute top-1 right-1 p-1 rounded-md glass-strong opacity-0 group-hover:opacity-100 hover:text-destructive"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
