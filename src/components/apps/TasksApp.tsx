import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Trash2, Download, Upload, Search, ListTodo } from "lucide-react";

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  dueAt?: number | null;
  priority?: "low" | "med" | "high";
};

const KEY = "jarvis.tasks.v1";

function load(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function TasksApp() {
  const [tasks, setTasks] = useState<Task[]>(() => load());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("med");

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tasks
      .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
      .filter((t) => (ql ? t.title.toLowerCase().includes(ql) : true))
      .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  }, [tasks, q, filter]);

  const add = () => {
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [
      { id: crypto.randomUUID(), title: t, done: false, createdAt: Date.now(), priority },
      ...prev,
    ]);
    setTitle("");
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) setTasks(parsed);
    } catch {
      // ignore
    }
  };

  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <ListTodo className="w-4 h-4 text-primary" />
        <div className="text-sm font-semibold flex-1 min-w-0 truncate">
          Tasks · <span className="text-muted-foreground font-normal">{openCount} open</span>
        </div>
        <button
          onClick={exportJson}
          className="text-xs px-2 py-1 rounded-md glass hover:bg-white/10 flex items-center gap-1"
          title="Export"
        >
          <Download className="w-3 h-3" /> Export
        </button>
        <label className="text-xs px-2 py-1 rounded-md glass hover:bg-white/10 flex items-center gap-1 cursor-pointer">
          <Upload className="w-3 h-3" /> Import
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="p-3 border-b border-white/10 flex flex-wrap gap-2">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 glass rounded-lg px-2 py-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task and press Enter…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task["priority"])}
            className="text-xs bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 outline-none"
          >
            <option className="bg-background" value="low">Low</option>
            <option className="bg-background" value="med">Med</option>
            <option className="bg-background" value="high">High</option>
          </select>
          <button
            onClick={add}
            className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center hover:brightness-110"
            aria-label="Add task"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-2 glass rounded-lg px-2 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none text-sm w-32"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
          {(["all", "open", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 capitalize ${filter === f ? "bg-white/15" : "hover:bg-white/5"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm py-10">
            <ListTodo className="w-10 h-10 opacity-40" />
            <div>No tasks yet — add one above.</div>
          </div>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            className={`glass rounded-lg px-3 py-2 flex items-center gap-3 group transition ${
              t.done ? "opacity-60" : ""
            }`}
          >
            <button
              onClick={() => toggle(t.id)}
              className={`w-5 h-5 rounded-md border grid place-items-center shrink-0 transition ${
                t.done
                  ? "bg-primary border-primary"
                  : "border-white/30 hover:border-white/60"
              }`}
              aria-label={t.done ? "Mark incomplete" : "Mark complete"}
            >
              {t.done && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${t.done ? "line-through" : ""}`}>{t.title}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                {t.priority && (
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      t.priority === "high"
                        ? "bg-red-500/20 text-red-300"
                        : t.priority === "med"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-white/10"
                    }`}
                  >
                    {t.priority}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-1"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {tasks.some((t) => t.done) && (
        <div className="border-t border-white/10 p-2 flex justify-end">
          <button
            onClick={clearDone}
            className="text-xs px-2 py-1 rounded-md hover:bg-white/10 text-muted-foreground"
          >
            Clear completed
          </button>
        </div>
      )}
    </div>
  );
}
