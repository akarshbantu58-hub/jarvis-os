export type MemoryTurn = { role: "user" | "assistant"; text: string; at: number };
const STORAGE_KEY = "jarvis.conversation-memory.v1";

export class MemoryManager {
  read(): MemoryTurn[] {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.filter((x) => x && (x.role === "user" || x.role === "assistant") && typeof x.text === "string") : [];
    } catch { return []; }
  }
  append(turn: Omit<MemoryTurn, "at">): MemoryTurn[] {
    const next = [...this.read(), { ...turn, at: Date.now() }].slice(-100);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage may be disabled */ }
    return next;
  }
  clear(): void { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }
}
export const memoryManager = new MemoryManager();
