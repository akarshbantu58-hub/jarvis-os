import { MessageSquare, StickyNote, Calculator, Settings, Clock, Info, Sparkles, Mic, Palette, Code2, ListTodo, FolderOpen, ImagePlus } from "lucide-react";
import type { AppId } from "./WindowManager";

export const APPS: { id: AppId; name: string; icon: typeof MessageSquare; color: string }[] = [
  { id: "voice", name: "Voice", icon: Mic, color: "from-cyan-300 to-blue-600" },
  { id: "chat", name: "JARVIS", icon: Sparkles, color: "from-cyan-400 to-blue-600" },
  { id: "imagine", name: "Imagine", icon: ImagePlus, color: "from-yellow-300 to-amber-600" },
  { id: "devstudio", name: "Dev Studio", icon: Code2, color: "from-emerald-400 to-teal-600" },

  { id: "notes", name: "Notes", icon: StickyNote, color: "from-amber-400 to-orange-600" },
  { id: "tasks", name: "Tasks", icon: ListTodo, color: "from-lime-400 to-emerald-600" },
  { id: "files", name: "Files", icon: FolderOpen, color: "from-sky-400 to-indigo-600" },
  { id: "calculator", name: "Calculator", icon: Calculator, color: "from-slate-400 to-slate-700" },
  { id: "clock", name: "Clock", icon: Clock, color: "from-indigo-400 to-purple-600" },
  { id: "personalize", name: "Personalize", icon: Palette, color: "from-pink-400 to-purple-600" },
  { id: "settings", name: "Settings", icon: Settings, color: "from-zinc-400 to-zinc-700" },
  { id: "about", name: "About", icon: Info, color: "from-fuchsia-400 to-pink-600" },
];
