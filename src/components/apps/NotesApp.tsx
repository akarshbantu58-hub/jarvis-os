import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Note = { id: string; title: string; body: string; updated: number };

const KEY = "jarvis.notes.v1";

function load(): Note[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(() => load());
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(notes)); }, [notes]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const create = () => {
    const n: Note = { id: crypto.randomUUID(), title: "New note", body: "", updated: Date.now() };
    setNotes((p) => [n, ...p]);
    setActiveId(n.id);
  };

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((p) => p.map((n) => (n.id === active.id ? { ...n, ...patch, updated: Date.now() } : n)));
  };

  const remove = (id: string) => {
    setNotes((p) => p.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="h-full flex">
      <div className="w-48 border-r border-white/10 bg-white/5 flex flex-col">
        <button onClick={create} className="m-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-110">
          <Plus className="w-3.5 h-3.5" /> New note
        </button>
        <div className="flex-1 overflow-y-auto">
          {notes.map((n) => (
            <div
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`group px-3 py-2 cursor-pointer text-xs flex items-center gap-2 border-l-2 ${activeId === n.id ? "border-primary bg-white/5" : "border-transparent hover:bg-white/5"}`}
            >
              <div className="flex-1 truncate">{n.title || "Untitled"}</div>
              <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {notes.length === 0 && <div className="p-4 text-xs text-muted-foreground text-center">No notes yet</div>}
        </div>
      </div>
      <div className="flex-1 flex flex-col p-3">
        {active ? (
          <>
            <input
              value={active.title}
              onChange={(e) => update({ title: e.target.value })}
              className="bg-transparent outline-none text-lg font-semibold mb-2 border-b border-white/10 pb-1"
            />
            <textarea
              value={active.body}
              onChange={(e) => update({ body: e.target.value })}
              placeholder="Start writing…"
              className="flex-1 bg-transparent outline-none text-sm resize-none leading-relaxed"
            />
          </>
        ) : (
          <div className="m-auto text-sm text-muted-foreground">Select or create a note</div>
        )}
      </div>
    </div>
  );
}
