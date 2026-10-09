import { useEffect, useMemo, useState } from "react";
import { Upload, Download, Trash2, Search, File as FileIcon, FolderOpen, Eye } from "lucide-react";

type StoredFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: number;
  dataUrl: string;
};

const KEY = "jarvis.files.v1";
const MAX_BYTES = 4 * 1024 * 1024; // 4MB per file to be nice to localStorage

function load(): StoredFile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function FilesApp() {
  const [files, setFiles] = useState<StoredFile[]>(() => load());
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<StoredFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(files));
    } catch {
      setError("Storage full — remove files to add more.");
    }
  }, [files]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return files
      .filter((f) => (ql ? f.name.toLowerCase().includes(ql) : true))
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [files, q]);

  const onUpload = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const next: StoredFile[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_BYTES) {
        setError(`${f.name} exceeds 4 MB — skipped.`);
        continue;
      }
      const dataUrl = await readAsDataUrl(f);
      next.push({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type || "application/octet-stream",
        size: f.size,
        addedAt: Date.now(),
        dataUrl,
      });
    }
    if (next.length) setFiles((prev) => [...next, ...prev]);
  };

  const remove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const download = (f: StoredFile) => {
    const a = document.createElement("a");
    a.href = f.dataUrl;
    a.download = f.name;
    a.click();
  };

  const totalBytes = files.reduce((n, f) => n + f.size, 0);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <FolderOpen className="w-4 h-4 text-primary" />
        <div className="text-sm font-semibold flex-1 min-w-0 truncate">
          Files · <span className="text-muted-foreground font-normal">{files.length} · {humanSize(totalBytes)}</span>
        </div>
        <div className="flex items-center gap-2 glass rounded-lg px-2 py-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none text-xs w-28"
          />
        </div>
        <label className="text-xs px-2.5 py-1 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center gap-1 cursor-pointer hover:brightness-110">
          <Upload className="w-3 h-3" /> Upload
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void onUpload(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <div className="mx-3 mt-2 text-xs bg-destructive/10 text-destructive rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 content-start">
        {filtered.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <div>No files yet — upload one to get started.</div>
            <div className="text-[10px]">Files are stored locally in your browser.</div>
          </div>
        )}
        {filtered.map((f) => {
          const isImage = f.type.startsWith("image/");
          return (
            <div key={f.id} className="glass rounded-lg overflow-hidden flex flex-col group">
              <div className="aspect-video bg-white/5 grid place-items-center overflow-hidden">
                {isImage ? (
                  <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <FileIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground">{humanSize(f.size)}</div>
                </div>
                <button
                  onClick={() => setPreview(f)}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Preview file"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => download(f)}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(f.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-destructive"
                  aria-label="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="glass-strong rounded-xl max-w-full max-h-full overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium flex-1 truncate">{preview.name}</div>
              <button onClick={() => setPreview(null)} className="text-xs px-2 py-1 rounded hover:bg-white/10">
                Close
              </button>
            </div>
            {preview.type.startsWith("image/") ? (
              <img src={preview.dataUrl} alt={preview.name} className="max-w-[80vw] max-h-[70vh] rounded" />
            ) : preview.type.startsWith("text/") || preview.type.includes("json") ? (
              <pre className="text-xs whitespace-pre-wrap max-w-[80vw] max-h-[70vh] overflow-auto">
                {atob(preview.dataUrl.split(",")[1] || "")}
              </pre>
            ) : (
              <div className="text-sm text-muted-foreground p-8 text-center">
                Preview not supported for this file type. Use Download.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
