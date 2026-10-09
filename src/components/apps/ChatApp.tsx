import { keyHeaders } from "@/lib/apiKeys";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Send, Loader2, Sparkles, Volume2, Square, Mic, MicOff, Search, Bookmark, BookmarkPlus, X, RotateCcw, Plus, MessageSquare, Trash2, PanelLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouteThreadId } from "@/components/os/JarvisOS";
import {
  createThread,
  deleteThread,
  listThreads,
  loadMessages,
  renameThread,
  saveMessage,
  touchThread,
  type Thread,
} from "@/lib/chatStore";

// ElevenLabs voice IDs (multilingual v2)
const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda" },
  { id: "FGY2WhTYpPnrIDTdsKH5", label: "Laura" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily" },
];

const MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
  { id: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { id: "openai/gpt-5", label: "GPT-5" },
];

const textOf = (m: UIMessage) =>
  m.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";

export function ChatApp() {
  const { user, loading } = useAuth();
  const routeThreadId = useRouteThreadId();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bootstrapping = useRef(false);

  const refreshThreads = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch (e) {
      console.error(e);
    } finally {
      setThreadsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setThreads([]);
      setThreadsLoaded(false);
      return;
    }
    void refreshThreads();
  }, [user, refreshThreads]);

  // Pick or create a thread when the URL has none.
  useEffect(() => {
    if (!user || !threadsLoaded || routeThreadId || bootstrapping.current) return;
    bootstrapping.current = true;
    void (async () => {
      try {
        const target = threads[0] ?? (await createThread());
        await navigate({ to: "/c/$threadId", params: { threadId: target.id } });
      } catch (e) {
        console.error(e);
        bootstrapping.current = false;
      }
    })();
  }, [user, threadsLoaded, routeThreadId, threads, navigate]);

  const newChat = async () => {
    const t = await createThread();
    setThreads((cur) => [t, ...cur]);
    await navigate({ to: "/c/$threadId", params: { threadId: t.id } });
  };

  const removeThread = async (id: string) => {
    await deleteThread(id);
    const rest = threads.filter((t) => t.id !== id);
    setThreads(rest);
    if (id === routeThreadId) {
      const next = rest[0];
      if (next) await navigate({ to: "/c/$threadId", params: { threadId: next.id } });
      else await newChat();
    }
  };

  if (loading) {
    return (
      <div className="h-full grid place-items-center text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full grid place-items-center p-6 text-center">
        <div className="space-y-3 max-w-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center animate-pulse-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-sm font-semibold">Sign in to save your chats</h2>
          <p className="text-xs text-muted-foreground">
            Your conversations and generated images are stored in your account and follow you across devices.
          </p>
          <button
            onClick={() => void navigate({ to: "/auth" })}
            className="px-4 py-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-sm font-medium"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {showSidebar && (
        <aside className="w-44 shrink-0 border-r border-white/10 bg-white/5 flex flex-col">
          <div className="p-2">
            <button
              onClick={() => void newChat()}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-1">
            {threads.length === 0 && (
              <p className="text-[10px] text-muted-foreground px-2 py-3">No saved chats yet.</p>
            )}
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-lg px-1.5 ${
                  t.id === routeThreadId ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <button
                  onClick={() => void navigate({ to: "/c/$threadId", params: { threadId: t.id } })}
                  className="flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-left"
                  title={t.title}
                >
                  <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground" />
                  <span className="text-[11px] truncate">{t.title}</span>
                </button>
                <button
                  onClick={() => void removeThread(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                  aria-label={`Delete ${t.title}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0">
        {routeThreadId ? (
          <Conversation
            key={routeThreadId}
            threadId={routeThreadId}
            onToggleSidebar={() => setShowSidebar((v) => !v)}
            onTitle={(title) => {
              setThreads((cur) => cur.map((t) => (t.id === routeThreadId ? { ...t, title } : t)));
            }}
          />
        ) : (
          <div className="h-full grid place-items-center text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function Conversation({
  threadId,
  onTitle,
  onToggleSidebar,
}: {
  threadId: string;
  onTitle: (title: string) => void;
  onToggleSidebar: () => void;
}) {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    let alive = true;
    void loadMessages(threadId)
      .then((m) => alive && setInitial(m))
      .catch((e) => {
        console.error(e);
        if (alive) setInitial([]);
      });
    return () => {
      alive = false;
    };
  }, [threadId]);

  if (!initial) {
    return (
      <div className="h-full grid place-items-center text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }
  return (
    <ChatWindow
      threadId={threadId}
      initialMessages={initial}
      onTitle={onTitle}
      onToggleSidebar={onToggleSidebar}
    />
  );
}

function ChatWindow({
  threadId,
  initialMessages,
  onTitle,
  onToggleSidebar,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onTitle: (title: string) => void;
  onToggleSidebar: () => void;
}) {
  const [model, setModel] = useState(MODELS[0].id);
  const [input, setInput] = useState("");
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: transport.current,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages to the cloud
  const savedRef = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const titledRef = useRef(initialMessages.length > 0);
  useEffect(() => {
    if (status !== "ready") return;
    const pending = messages.filter((m) => !savedRef.current.has(m.id) && textOf(m).trim());
    if (pending.length === 0) return;
    pending.forEach((m) => savedRef.current.add(m.id));
    void (async () => {
      for (const m of pending) await saveMessage(threadId, m);
      await touchThread(threadId);
      if (!titledRef.current) {
        const firstUser = pending.find((m) => m.role === "user");
        if (firstUser) {
          titledRef.current = true;
          const title = textOf(firstUser).slice(0, 60) || "New chat";
          await renameThread(threadId, title).catch(console.error);
          onTitle(title);
        }
      }
    })();
  }, [messages, status, threadId, onTitle]);

  // Voice / TTS
  const [voice, setVoice] = useState<string>(() =>
    (typeof window !== "undefined" && localStorage.getItem("jarvis.voice")) || VOICES[0].id,
  );
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem("jarvis.autoSpeak") === "1",
  );
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spokenRef = useRef<Set<string>>(new Set());

  useEffect(() => { localStorage.setItem("jarvis.voice", voice); }, [voice]);
  useEffect(() => { localStorage.setItem("jarvis.autoSpeak", autoSpeak ? "1" : "0"); }, [autoSpeak]);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setSpeakingId(null);
  };

  const speak = async (id: string, text: string) => {
    if (!text.trim()) return;
    stopSpeaking();
    setSpeakingId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...keyHeaders() },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "TTS failed"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId((cur) => (cur === id ? null : cur)); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeakingId((cur) => (cur === id ? null : cur)); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      console.error(e);
      setSpeakingId(null);
    }
  };

  // Voice input (Web Speech API)
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const speechSupported = typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleListen = () => {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = navigator.language || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => { inputRef.current?.focus(); }, [threadId]);
  useEffect(() => { if (status === "ready") inputRef.current?.focus(); }, [status]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Auto-speak newly completed assistant messages
  useEffect(() => {
    if (!autoSpeak || status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (spokenRef.current.has(last.id)) return;
    const text = textOf(last);
    if (!text.trim()) return;
    spokenRef.current.add(last.id);
    void speak(last.id, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status, autoSpeak]);

  // Saved prompts + search
  const [savedPrompts, setSavedPrompts] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("jarvis.savedPrompts") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("jarvis.savedPrompts", JSON.stringify(savedPrompts)); }, [savedPrompts]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const savePrompt = () => {
    const t = input.trim();
    if (!t || savedPrompts.includes(t)) return;
    setSavedPrompts((p) => [t, ...p].slice(0, 30));
  };
  const removePrompt = (p: string) => setSavedPrompts((cur) => cur.filter((x) => x !== p));

  const filteredMessages = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => textOf(m).toLowerCase().includes(q));
  }, [messages, searchQ]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text }, { body: { model } });
    setInput("");
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || busy) return;
    const text = textOf(lastUser);
    if (text) sendMessage({ text }, { body: { model } });
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-md grid place-items-center hover:bg-white/10"
          title="Toggle chat list"
          aria-label="Toggle chat list"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center animate-pulse-glow">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">JARVIS</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {busy ? "Thinking…" : "Saved to your account · हिन्दी · தமிழ் · বাংলা · English"}
          </div>
        </div>
        <button
          onClick={() => setShowSearch((v) => !v)}
          className={`w-8 h-8 rounded-md grid place-items-center transition ${showSearch ? "bg-white/15" : "hover:bg-white/10"}`}
          title="Search conversation"
          aria-label="Search conversation"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowLibrary((v) => !v)}
          className={`w-8 h-8 rounded-md grid place-items-center transition ${showLibrary ? "bg-white/15" : "hover:bg-white/10"}`}
          title="Saved prompts"
          aria-label="Saved prompts"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={retryLast}
          disabled={busy || !messages.some((m) => m.role === "user")}
          className="w-8 h-8 rounded-md grid place-items-center hover:bg-white/10 disabled:opacity-40 transition"
          title="Retry last message"
          aria-label="Retry last message"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground select-none cursor-pointer">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            className="accent-primary"
          />
          Auto-speak
        </label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 outline-none"
          title="Voice"
        >
          {VOICES.map((v) => (
            <option key={v.id} value={v.id} className="bg-background">{v.label}</option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 outline-none"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-background">{m.label}</option>
          ))}
        </select>
      </div>

      {showSearch && (
        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search this conversation…"
            className="flex-1 bg-transparent outline-none text-xs"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="p-1 rounded hover:bg-white/10" aria-label="Clear search">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {showLibrary && (
        <div className="px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-3.5 h-3.5 text-primary" />
            <div className="text-xs font-semibold flex-1">Saved prompts</div>
            <button
              onClick={savePrompt}
              disabled={!input.trim()}
              className="text-[10px] px-2 py-1 rounded glass hover:bg-white/10 flex items-center gap-1 disabled:opacity-40"
            >
              <BookmarkPlus className="w-3 h-3" /> Save current
            </button>
          </div>
          {savedPrompts.length === 0 ? (
            <div className="text-[10px] text-muted-foreground py-2">No saved prompts yet. Type a prompt and click "Save current".</div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {savedPrompts.map((p) => (
                <div key={p} className="group flex items-center gap-1 glass rounded-md pl-2 pr-1 py-0.5">
                  <button
                    onClick={() => { setInput(p); setShowLibrary(false); }}
                    className="text-[11px] max-w-[220px] truncate hover:text-primary"
                    title={p}
                  >
                    {p}
                  </button>
                  <button
                    onClick={() => removePrompt(p)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive"
                    aria-label="Remove saved prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-sm max-w-xs">
              Good day. Namaste. வணக்கம். নমস্কার. I'm JARVIS — write in any Indian language and I'll reply in the same.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-sm">
              {[
                "मुझे भारत के बारे में तीन रोचक तथ्य बताओ",
                "தமிழில் ஒரு சிறு கவிதை எழுது",
                "আজকের আবহাওয়া কেমন হতে পারে?",
                "Explain black holes simply",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { sendMessage({ text: s }, { body: { model } }); }}
                  className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredMessages.map((m) => {
          const text = textOf(m);
          const isUser = m.role === "user";
          const isSpeaking = speakingId === m.id;
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] flex flex-col gap-1">
                <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "glass text-foreground rounded-bl-sm"
                }`}>
                  {text || (m.role === "assistant" && busy ? "…" : "")}
                </div>
                {!isUser && text && (
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      onClick={() => (isSpeaking ? stopSpeaking() : speak(m.id, text))}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition"
                      title={isSpeaking ? "Stop" : "Speak"}
                    >
                      {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {isSpeaking ? "Stop" : "Speak"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive px-3 py-2 rounded-lg bg-destructive/10">
            {error.message || "Something went wrong."}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex items-end gap-2 glass rounded-xl p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            placeholder="Ask in any language — हिन्दी, தமிழ், বাংলা, English…"
            className="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 py-1.5 px-2"
          />
          {speechSupported && (
            <button
              onClick={toggleListen}
              className={`w-9 h-9 rounded-lg grid place-items-center transition ${
                listening ? "bg-destructive text-destructive-foreground animate-pulse" : "glass hover:bg-white/10"
              }`}
              aria-label={listening ? "Stop listening" : "Speak"}
              title={listening ? "Stop listening" : "Voice input"}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={submit}
            disabled={busy || !input.trim()}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            aria-label="Send"
          >
            {busy ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
