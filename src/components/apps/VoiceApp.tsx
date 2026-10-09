import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Radio, Square, Settings2, Trash2,
  Zap, Hand, WifiOff, ShieldAlert, Loader2, Sparkle, Captions, Copy, Check,
  Pause, Play, RotateCcw,
} from "lucide-react";
import { usePersonalization } from "@/lib/personalization";
import { keyHeaders } from "@/lib/apiKeys";


type VoiceState =
  | "idle" | "listening" | "wake" | "processing"
  | "thinking" | "speaking" | "success" | "error" | "offline" | "muted";

type Turn = { id: string; role: "user" | "assistant"; text: string; partial?: boolean; confidence?: number };

// ElevenLabs voice IDs (multilingual v2 — great with Indian languages)
const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda" },
  { id: "FGY2WhTYpPnrIDTdsKH5", label: "Laura" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica" },
  { id: "iP95p4xoKVk53GoZ742B", label: "Chris" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily" },
  { id: "N2lVS1w4EtoT3dr4eOWO", label: "Callum" },
];

const LANGS = [
  { id: "auto", label: "Auto" }, { id: "en-IN", label: "English (IN)" },
  { id: "hi-IN", label: "हिन्दी" }, { id: "ta-IN", label: "தமிழ்" },
  { id: "te-IN", label: "తెలుగు" }, { id: "bn-IN", label: "বাংলা" },
  { id: "mr-IN", label: "मराठी" }, { id: "gu-IN", label: "ગુજરાતી" },
  { id: "kn-IN", label: "ಕನ್ನಡ" }, { id: "ml-IN", label: "മലയാളം" },
  { id: "pa-IN", label: "ਪੰਜਾਬੀ" }, { id: "ur-IN", label: "اردو" },
];

const STATE_META: Record<VoiceState, { label: string; hue: number; ring: string; dot: string }> = {
  idle:       { label: "Ready",      hue: 200, ring: "from-cyan-400/40 to-blue-500/20",  dot: "bg-cyan-400" },
  listening:  { label: "Listening…", hue: 190, ring: "from-cyan-300/70 to-sky-500/40",   dot: "bg-cyan-300" },
  wake:       { label: "Wake word",  hue: 160, ring: "from-emerald-300/70 to-cyan-400/40", dot: "bg-emerald-300" },
  processing: { label: "Processing", hue: 260, ring: "from-violet-400/60 to-fuchsia-500/40", dot: "bg-violet-300" },
  thinking:   { label: "Thinking…",  hue: 280, ring: "from-fuchsia-400/60 to-purple-600/40", dot: "bg-fuchsia-300" },
  speaking:   { label: "Speaking",   hue: 210, ring: "from-sky-300/80 to-blue-600/50",   dot: "bg-sky-300" },
  success:    { label: "Done",       hue: 140, ring: "from-emerald-300/70 to-teal-500/40", dot: "bg-emerald-300" },
  error:      { label: "Error",      hue: 0,   ring: "from-rose-400/70 to-red-600/40",   dot: "bg-rose-400" },
  offline:    { label: "Offline",    hue: 30,  ring: "from-amber-400/60 to-orange-600/30", dot: "bg-amber-400" },
  muted:      { label: "Muted",      hue: 220, ring: "from-slate-400/40 to-slate-600/20", dot: "bg-slate-400" },
};

export function VoiceApp() {
  const { profile } = usePersonalization();
  const [voice, setVoice] = useState(() => localStorage.getItem("jarvis.voice") || "alloy");
  const [lang, setLang] = useState(() => localStorage.getItem("jarvis.lang") || "auto");
  const [rate, setRate] = useState(() => Number(localStorage.getItem("jarvis.rate") || 1));
  const [pitch, setPitch] = useState(() => Number(localStorage.getItem("jarvis.pitch") || 1));
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("jarvis.volume") || 1));
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem("jarvis.autoSpeak") !== "0");
  const [greetOnStart, setGreetOnStart] = useState(() => localStorage.getItem("jarvis.greetOnStart") !== "0");
  const [customGreeting, setCustomGreeting] = useState(() => localStorage.getItem("jarvis.customGreeting") || "");
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [handsFree, setHandsFree] = useState(() => localStorage.getItem("jarvis.handsFree") === "1");
  const [liveMode, setLiveMode] = useState(false);
  const [liveFinal, setLiveFinal] = useState("");
  const [liveInterim, setLiveInterim] = useState("");
  const [copied, setCopied] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [lastAssistantText, setLastAssistantText] = useState("");
  const liveModeRef = useRef(liveMode);
  useEffect(() => { liveModeRef.current = liveMode; }, [liveMode]);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => { localStorage.setItem("jarvis.handsFree", handsFree ? "1" : "0"); }, [handsFree]);
  useEffect(() => { localStorage.setItem("jarvis.autoSpeak", autoSpeak ? "1" : "0"); }, [autoSpeak]);
  useEffect(() => { localStorage.setItem("jarvis.greetOnStart", greetOnStart ? "1" : "0"); }, [greetOnStart]);
  useEffect(() => { localStorage.setItem("jarvis.customGreeting", customGreeting); }, [customGreeting]);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => { localStorage.setItem("jarvis.voice", voice); }, [voice]);
  useEffect(() => { localStorage.setItem("jarvis.lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("jarvis.rate", String(rate)); }, [rate]);
  useEffect(() => { localStorage.setItem("jarvis.pitch", String(pitch)); }, [pitch]);
  useEffect(() => { localStorage.setItem("jarvis.volume", String(volume)); }, [volume]);

  // State machine
  const [state, setState] = useState<VoiceState>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [partial, setPartial] = useState<{ text: string; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true), off = () => { setOnline(false); setState("offline"); };
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Speech API
  const SR = typeof window !== "undefined"
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const speechSupported = !!SR;

  // If continuous wake isn't available (it isn't in most browsers), we default to push-to-talk hint.
  useEffect(() => { if (!speechSupported) setPushToTalk(true); }, [speechSupported]);

  const recRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const handsFreeRef = useRef(handsFree);
  const thinkingRef = useRef(false);
  useEffect(() => { turnsRef.current = turns; }, [turns]);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { thinkingRef.current = state === "thinking" || state === "processing"; }, [state]);


  const stopMicAnalyser = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current = null;
  };

  const ensureAudioCtx = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const startMicAnalyser = async () => {
    if (analyserRef.current) return;
    try {
      const ctx = await ensureAudioCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
    } catch (e: any) {
      setError(e?.message || "Microphone unavailable");
      setState("error");
    }
  };

  // --- TTS queue (chunked, sentence-level, low-latency) ---
  const ttsQueueRef = useRef<string[]>([]);
  const ttsPlayingRef = useRef(false);
  const ttsCancelledRef = useRef(false);

  const stopTTS = () => {
    ttsCancelledRef.current = true;
    ttsQueueRef.current = [];
    if (audioElRef.current) { try { audioElRef.current.pause(); } catch {} audioElRef.current.src = ""; }
    ttsAnalyserRef.current = null;
    ttsPlayingRef.current = false;
    setTtsPaused(false);
  };

  const pauseTTS = () => { try { audioElRef.current?.pause(); setTtsPaused(true); } catch {} };
  const resumeTTS = () => { try { audioElRef.current?.play(); setTtsPaused(false); } catch {} };
  const replayLast = () => {
    if (!lastAssistantText.trim()) return;
    stopTTS();
    ttsCancelledRef.current = false;
    enqueueSpeech(lastAssistantText);
  };

  const playOne = async (text: string): Promise<void> => {
    if (ttsCancelledRef.current || speakerMuted || !text.trim()) return;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...keyHeaders() },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) throw new Error("TTS failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volume;
    audio.playbackRate = rate * pitch;
    // preservesPitch=false makes playbackRate also shift pitch, giving a pitch control.
    try { (audio as any).preservesPitch = false; (audio as any).mozPreservesPitch = false; (audio as any).webkitPreservesPitch = false; } catch {}
    audioElRef.current = audio;

    // Best-effort analyser for the orb viz — never block playback if it fails.
    try {
      const ctx = await ensureAudioCtx();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser); analyser.connect(ctx.destination);
      ttsAnalyserRef.current = analyser;
    } catch {/* ignore, plain playback still works */}

    await new Promise<void>((resolve) => {
      const done = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    });
  };

  const drainQueue = async () => {
    if (ttsPlayingRef.current) return;
    ttsPlayingRef.current = true;
    setState("speaking");
    try {
      while (ttsQueueRef.current.length && !ttsCancelledRef.current) {
        const next = ttsQueueRef.current.shift()!;
        await playOne(next);
      }
    } catch (e: any) {
      setError(e?.message || "Speech failed");
    } finally {
      ttsPlayingRef.current = false;
      ttsAnalyserRef.current = null;
      if (!ttsCancelledRef.current) {
        setState("success");
        setTimeout(() => {
          setState((s) => (s === "success" ? "idle" : s));
          if (handsFree && !micMuted && online) void startListeningRef.current?.();
        }, 500);
      }
    }
  };

  const enqueueSpeech = (text: string) => {
    if (speakerMuted || !autoSpeak || !text.trim()) return;
    ttsCancelledRef.current = false;
    ttsQueueRef.current.push(text.trim());
    void drainQueue();
  };

  // Kept for one-shot cases (unused now that streaming chunks it)
  const speakText = (text: string) => enqueueSpeech(text);

  // Split streaming text into speakable sentences as it grows.
  const splitSentences = (buf: string): { chunks: string[]; rest: string } => {
    const re = /[^.!?。！？…\n]+[.!?。！？…]+[\s"')\]]*|[^.!?。！？…\n]+\n+/g;
    const chunks: string[] = [];
    let m: RegExpExecArray | null;
    let lastIdx = 0;
    while ((m = re.exec(buf)) !== null) {
      const c = m[0].trim();
      if (c.length >= 2) chunks.push(c);
      lastIdx = re.lastIndex;
    }
    return { chunks, rest: buf.slice(lastIdx) };
  };

  const sendToAssistant = async (userText: string) => {
    if (!userText.trim()) return;
    stopTTS();
    setState("thinking");
    setError(null);
    const userTurn: Turn = { id: crypto.randomUUID(), role: "user", text: userText };
    const asstTurn: Turn = { id: crypto.randomUUID(), role: "assistant", text: "", partial: true };
    setTurns((t) => [...t, userTurn, asstTurn]);

    try {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      // Send recent conversation so the assistant actually remembers the dialogue.
      const history = turnsRef.current
        .filter((t) => t.text.trim())
        .slice(-10)
        .map((t) => ({
          id: t.id,
          role: t.role,
          parts: [{ type: "text", text: t.text }],
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...keyHeaders() },
        signal: ac.signal,
        body: JSON.stringify({
          id: "jarvis-voice",
          messages: [
            ...history,
            { id: userTurn.id, role: "user", parts: [{ type: "text", text: userText }] },
          ],
          model: "google/gemini-3-flash-preview",
        }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "Chat failed"));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let full = ""; let speakBuf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data);
            let delta = "";
            if (typeof evt?.delta === "string") delta = evt.delta;
            else if (typeof evt?.textDelta === "string") delta = evt.textDelta;
            else if (evt?.type === "text-delta") delta = evt.delta ?? evt.textDelta ?? "";
            if (delta) {
              full += delta;
              speakBuf += delta;
              setTurns((prev) => prev.map((t) => t.id === asstTurn.id ? { ...t, text: full } : t));
              const { chunks, rest } = splitSentences(speakBuf);
              if (chunks.length) {
                speakBuf = rest;
                for (const c of chunks) enqueueSpeech(c);
              }
            }
          } catch {/* ignore */}
        }
      }
      // Flush any tail
      const tail = speakBuf.trim();
      if (tail) enqueueSpeech(tail);
      setTurns((prev) => prev.map((t) => t.id === asstTurn.id ? { ...t, text: full, partial: false } : t));
      if (full.trim()) setLastAssistantText(full);
      if (!full.trim()) { setState("success"); setTimeout(() => setState("idle"), 500); }
    } catch (e: any) {
      if (e?.name !== "AbortError") { setError(e?.message || "Assistant failed"); setState("error"); }
    }
  };

  // Forward ref so drainQueue can restart listening in hands-free mode
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

  const startListening = useCallback(async () => {
    if (!speechSupported || micMuted) return;
    stopTTS();
    setPartial(null);
    setError(null);
    await startMicAnalyser();
    const rec = new SR();
    rec.lang = lang === "auto" ? (navigator.language || "en-IN") : lang;
    rec.interimResults = true;
    rec.continuous = liveModeRef.current;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState("listening");
    rec.onresult = (e: any) => {
      // Barge-in: user started talking → stop the assistant immediately.
      if (ttsPlayingRef.current || ttsQueueRef.current.length) stopTTS();
      if (liveModeRef.current) {
        let interim = "", finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const alt = r[0];
          if (r.isFinal) finalText += alt.transcript;
          else interim += alt.transcript;
        }
        if (finalText) setLiveFinal((prev) => (prev + " " + finalText).replace(/\s+/g, " ").trim() + " ");
        setLiveInterim(interim);
        return;
      }
      let interim = "", finalText = "", conf = 0;
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const alt = r[0];
        if (r.isFinal) { finalText += alt.transcript; conf = alt.confidence || 0; }
        else interim += alt.transcript;
      }
      if (interim) setPartial({ text: interim, confidence: 0.5 });
      if (finalText) {
        setPartial(null);
        rec.stop();
        setState("processing");
        void sendToAssistant(finalText);
      }
    };
    rec.onerror = (ev: any) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        setState((s) => (s === "listening" ? "idle" : s));
        return;
      }
      if (ev.error === "network") {
        setError("Speech service unreachable — retrying…");
        setTimeout(() => { if (!micMuted) void startListeningRef.current?.(); }, 1200);
        return;
      }
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setError("Microphone permission denied. Allow mic access in your browser.");
        setState("error");
        return;
      }
      setError(ev.error || "Recognition error"); setState("error");
    };
    rec.onend = () => {
      setLiveInterim("");
      if (liveModeRef.current && !micMuted) {
        // Auto-restart for continuous live transcription
        try { rec.start(); return; } catch { /* fall through */ }
      }
      setState((s) => (s === "listening" ? "idle" : s));
      // Hands-free: keep the loop alive if nothing was captured.
      if (handsFreeRef.current && !micMuted && !ttsPlayingRef.current && !thinkingRef.current) {
        setTimeout(() => {
          if (handsFreeRef.current && !micMuted && !ttsPlayingRef.current && !thinkingRef.current) {
            void startListeningRef.current?.();
          }
        }, 700);
      }
    };
    recRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  }, [SR, lang, micMuted, speechSupported]);


  const stopListening = useCallback(() => {
    recRef.current?.stop();
    stopMicAnalyser();
  }, []);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const clearConversation = () => { setTurns([]); setPartial(null); setError(null); setState("idle"); };

  // Time-of-day greeting on first mount.
  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    if (!greetOnStart) return;
    const h = new Date().getHours();
    const partOfDay = h < 5 ? "Hello" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Hello";
    const name = profile.userName && profile.userName !== "Operator" ? `, ${profile.userName}` : "";
    const built = `${partOfDay}${name}. ${profile.welcomeMessage || "Welcome back"}. ${profile.greeting || "How can I help you today?"}`;
    const text = (customGreeting.trim() || built).trim();
    const greetTurn: Turn = { id: crypto.randomUUID(), role: "assistant", text };
    setTurns((t) => [...t, greetTurn]);
    setLastAssistantText(text);
    // Speak greeting after a brief delay so audio context can init on user gesture-free page loads.
    const timer = setTimeout(() => {
      if (!speakerMuted && autoSpeak) {
        ttsCancelledRef.current = false;
        ttsQueueRef.current.push(text);
        void drainQueue();
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts: Space = push-to-talk, M = mute, S = stop
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.code === "Space") { e.preventDefault(); if (state !== "listening") startListening(); }
      else if (e.key.toLowerCase() === "m") setMicMuted((v) => !v);
      else if (e.key.toLowerCase() === "s") { stopListening(); stopTTS(); setState("idle"); }
    };
    const up = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.code === "Space" && pushToTalk) stopListening();
    };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [pushToTalk, startListening, stopListening, state]);

  useEffect(() => () => {
    abortRef.current?.abort();
    stopListening(); stopTTS();
    audioCtxRef.current?.close().catch(() => {});
  }, [stopListening]);

  // Derived state indicators
  const effectiveState: VoiceState = !online ? "offline" : micMuted ? "muted" : state;
  const meta = STATE_META[effectiveState];

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent text-foreground">
      {/* Ambient bloom that intensifies with activity */}
      <AmbientBloom state={effectiveState} />

      {/* Stage */}
      <div className="relative h-full w-full flex flex-col items-center">
        {/* Status pill */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
          <span className={`w-2 h-2 rounded-full ${meta.dot} ${effectiveState !== "idle" ? "animate-pulse" : ""}`} />
          <span className="font-medium">{meta.label}</span>
          {!speechSupported && (
            <span className="text-amber-300/90 flex items-center gap-1 ml-1">
              <ShieldAlert className="w-3 h-3" /> Push-to-talk only
            </span>
          )}
        </div>

        {/* Orb */}
        <div className="flex-1 w-full grid place-items-center px-4">
          <Orb
            state={effectiveState}
            reducedMotion={reducedMotion}
            micAnalyser={analyserRef}
            ttsAnalyser={ttsAnalyserRef}
            onPointerDown={() => { if (pushToTalk) startListening(); else state === "listening" ? stopListening() : startListening(); }}
            onPointerUp={() => { if (pushToTalk) stopListening(); }}
          />
        </div>

        {/* Live transcription overlay */}
        <div className="w-full max-w-2xl px-4 pb-3 space-y-2 max-h-[42%] overflow-y-auto">
          {liveMode && (
            <div className="glass-strong rounded-2xl p-4 border border-cyan-400/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200">
                  <Captions className="w-4 h-4" />
                  Live Transcription
                  {state === "listening" && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-300/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" /> REC
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      const text = (liveFinal + liveInterim).trim();
                      if (!text) return;
                      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
                    }}
                    className="text-[10px] px-2 py-1 rounded-md hover:bg-white/10 flex items-center gap-1"
                    title="Copy transcript"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => { setLiveFinal(""); setLiveInterim(""); }}
                    className="text-[10px] px-2 py-1 rounded-md hover:bg-white/10 flex items-center gap-1"
                    title="Clear transcript"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
              <div className="text-base leading-relaxed whitespace-pre-wrap min-h-[3rem] max-h-56 overflow-y-auto">
                <span className="text-foreground">{liveFinal}</span>
                <span className="text-cyan-200/70 italic">{liveInterim}</span>
                {!liveFinal && !liveInterim && (
                  <span className="text-muted-foreground text-sm">Start speaking — your words appear here in real time…</span>
                )}
              </div>
            </div>
          )}
          {!liveMode && turns.slice(-4).map((t) => (
            <div key={t.id} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                t.role === "user" ? "bg-primary/80 text-primary-foreground rounded-br-sm" : "glass rounded-bl-sm"
              }`}>
                {t.text || (t.partial ? "…" : "")}
                {t.partial && <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-300 animate-pulse align-middle" />}
              </div>
            </div>
          ))}
          {!liveMode && partial && (
            <div className="flex justify-end">
              <div className="text-sm rounded-2xl px-3 py-2 max-w-[85%] glass border border-cyan-400/30 text-cyan-100/90 italic">
                {partial.text}
                <span className="ml-2 text-[10px] text-cyan-300/70">~{Math.round(partial.confidence * 100)}%</span>
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive px-3 py-2 rounded-lg bg-destructive/10">{error}</div>
          )}
        </div>


        {/* Floating controls */}
        <div className="w-full pb-4 px-3 flex justify-center">
          <div className="glass-strong rounded-2xl px-2 py-2 flex items-center gap-1 flex-wrap justify-center max-w-full">
            <CtrlButton
              onClick={() => state === "listening" ? stopListening() : startListening()}
              active={state === "listening"}
              label={state === "listening" ? "Stop" : "Talk"}
              disabled={micMuted || !online}
            >
              {state === "listening" ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </CtrlButton>
            <CtrlButton onClick={() => setPushToTalk((v) => !v)} active={pushToTalk} label="Push">
              <Hand className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton onClick={() => setHandsFree((v) => !v)} active={handsFree} label={handsFree ? "Hands-free on" : "Hands-free"}>
              <Radio className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton
              onClick={() => {
                const next = !liveMode;
                setLiveMode(next);
                liveModeRef.current = next;
                if (next) {
                  setLiveFinal(""); setLiveInterim(""); setPartial(null);
                  stopListening();
                  setTimeout(() => { void startListening(); }, 50);
                } else {
                  stopListening();
                }
              }}
              active={liveMode}
              label={liveMode ? "Stop live" : "Live transcribe"}
              disabled={!speechSupported || micMuted || !online}
            >
              <Captions className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton onClick={() => setMicMuted((v) => !v)} active={micMuted} label={micMuted ? "Unmute" : "Mute"}>
              {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </CtrlButton>
            <CtrlButton onClick={() => { setSpeakerMuted((v) => !v); if (!speakerMuted) stopTTS(); }} active={speakerMuted} label={speakerMuted ? "Sound" : "Silent"}>
              {speakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </CtrlButton>
            <CtrlButton
              onClick={() => (ttsPaused ? resumeTTS() : pauseTTS())}
              active={ttsPaused}
              label={ttsPaused ? "Resume" : "Pause"}
              disabled={!ttsPlayingRef.current && !ttsPaused}
            >
              {ttsPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </CtrlButton>
            <CtrlButton onClick={replayLast} label="Replay" disabled={!lastAssistantText}>
              <RotateCcw className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton onClick={() => { stopListening(); stopTTS(); abortRef.current?.abort(); setState("idle"); }} label="Cancel">
              <Zap className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton onClick={clearConversation} label="Clear">
              <Trash2 className="w-4 h-4" />
            </CtrlButton>
            <CtrlButton onClick={() => setShowSettings((v) => !v)} active={showSettings} label="Settings">
              <Settings2 className="w-4 h-4" />
            </CtrlButton>
            {!online && (
              <div className="flex items-center gap-1 text-[10px] text-amber-300/90 px-2">
                <WifiOff className="w-3 h-3" /> Offline
              </div>
            )}
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="absolute inset-x-3 bottom-20 sm:inset-x-auto sm:right-3 sm:w-80 glass-strong rounded-2xl p-4 space-y-3 text-xs z-20">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkle className="w-4 h-4 text-cyan-300" /> Voice Settings
            </div>
            <label className="block">Voice
              <select value={voice} onChange={(e) => setVoice(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 outline-none">
                {VOICES.map((v) => <option key={v.id} value={v.id} className="bg-background">{v.label}</option>)}
              </select>
            </label>
            <label className="block">Language
              <select value={lang} onChange={(e) => setLang(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 outline-none">
                {LANGS.map((l) => <option key={l.id} value={l.id} className="bg-background">{l.label}</option>)}
              </select>
            </label>
            <RangeRow label="Speed" min={0.5} max={2} step={0.05} value={rate} onChange={setRate} />
            <RangeRow label="Pitch" min={0.5} max={1.5} step={0.05} value={pitch} onChange={setPitch} />
            <RangeRow label="Volume" min={0} max={1} step={0.05} value={volume} onChange={setVolume} />
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="accent-primary" />
              Auto-speak responses
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={greetOnStart} onChange={(e) => setGreetOnStart(e.target.checked)} className="accent-primary" />
              Spoken greeting on startup
            </label>
            <label className="block">Custom greeting <span className="text-muted-foreground">(optional)</span>
              <input
                type="text"
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                placeholder="Welcome back. All systems ready."
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} className="accent-primary" />
              Reduced motion
            </label>
            <div className="text-[10px] text-muted-foreground pt-1">
              Shortcuts: <kbd className="px-1 rounded bg-white/10">Space</kbd> talk ·
              <kbd className="px-1 mx-1 rounded bg-white/10">M</kbd> mute ·
              <kbd className="px-1 rounded bg-white/10">S</kbd> stop
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Sub-components ---------------------------- */

function CtrlButton({
  children, onClick, active, disabled, label,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`min-w-11 h-11 px-3 rounded-xl grid place-items-center transition
        ${active ? "bg-cyan-400/25 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                 : "hover:bg-white/10 text-foreground/80"}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function RangeRow({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between"><span>{label}</span><span className="text-muted-foreground">{value.toFixed(2)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 accent-primary" />
    </label>
  );
}

function AmbientBloom({ state }: { state: VoiceState }) {
  const intensity = state === "listening" || state === "speaking" || state === "wake" ? 1
    : state === "thinking" || state === "processing" ? 0.7 : state === "error" ? 0.9 : 0.35;
  const hue = STATE_META[state].hue;
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, hsl(${hue} 90% 60% / ${0.15 * intensity}), transparent 60%)`,
          backdropFilter: state === "listening" || state === "speaking" ? "blur(4px)" : undefined,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen transition-opacity duration-500"
        style={{
          background:
            `radial-gradient(600px 400px at 20% 20%, hsl(${hue} 90% 60% / ${0.12 * intensity}), transparent 60%),
             radial-gradient(500px 400px at 80% 80%, hsl(${(hue + 40) % 360} 90% 60% / ${0.1 * intensity}), transparent 60%)`,
        }}
      />
    </>
  );
}

function Orb({
  state, reducedMotion, micAnalyser, ttsAnalyser, onPointerDown, onPointerUp,
}: {
  state: VoiceState;
  reducedMotion: boolean;
  micAnalyser: React.MutableRefObject<AnalyserNode | null>;
  ttsAnalyser: React.MutableRefObject<AnalyserNode | null>;
  onPointerDown: () => void;
  onPointerUp: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const meta = STATE_META[state];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const bufMic = new Uint8Array(128);
    const bufTts = new Uint8Array(128);
    const particles: { a: number; r: number; sp: number; life: number }[] = [];

    let t = 0;
    const draw = () => {
      t += 0.016;
      const s = stateRef.current;
      const hue = STATE_META[s].hue;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const base = Math.min(W, H) * 0.28;

      ctx.clearRect(0, 0, W, H);

      // Amplitude from mic or tts
      let amp = 0;
      const analyser = s === "speaking" ? ttsAnalyser.current : micAnalyser.current;
      if (analyser) {
        const buf = s === "speaking" ? bufTts : bufMic;
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        amp = sum / (buf.length * 255);
      }
      const activityAmp = s === "listening" || s === "speaking" ? amp : 0;
      const idleBreath = reducedMotion ? 0 : (Math.sin(t * 1.6) * 0.5 + 0.5) * 0.06;
      const scale = 1 + idleBreath + activityAmp * 0.35;

      // Outer glow bloom
      const glow = ctx.createRadialGradient(cx, cy, base * 0.4, cx, cy, base * 2.4);
      glow.addColorStop(0, `hsla(${hue}, 95%, 65%, ${0.35 + activityAmp * 0.4})`);
      glow.addColorStop(0.4, `hsla(${hue}, 95%, 55%, ${0.15 + activityAmp * 0.2})`);
      glow.addColorStop(1, `hsla(${hue}, 95%, 55%, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Equalizer bars around the orb
      if (analyser) {
        const buf = s === "speaking" ? bufTts : bufMic;
        const bars = 96;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * buf.length);
          const v = (buf[idx] || 0) / 255;
          const ang = (i / bars) * Math.PI * 2 + t * 0.1;
          const r1 = base * 1.15;
          const r2 = r1 + 6 * dpr + v * base * 0.55;
          ctx.strokeStyle = `hsla(${hue + i * 0.6}, 100%, 65%, ${0.35 + v * 0.6})`;
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
          ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
          ctx.stroke();
        }
      }

      // Rotating energy rings
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const rot = t * (0.4 + r * 0.25) * (r % 2 === 0 ? 1 : -1);
        const rad = base * (1 + r * 0.08) * scale;
        ctx.strokeStyle = `hsla(${hue + r * 30}, 100%, 70%, ${0.35 - r * 0.08})`;
        ctx.lineWidth = (1.5 + r) * dpr;
        ctx.setLineDash([20 * dpr, 12 * dpr + r * 6]);
        ctx.lineDashOffset = rot * 40;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Circular waveform
      if (analyser) {
        const buf = s === "speaking" ? bufTts : bufMic;
        ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.9)`;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        const N = buf.length;
        for (let i = 0; i <= N; i++) {
          const v = (buf[i % N] || 0) / 255;
          const ang = (i / N) * Math.PI * 2;
          const r = base * (1.02 + v * 0.28);
          const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Core glass sphere
      const core = ctx.createRadialGradient(cx - base * 0.3, cy - base * 0.35, base * 0.05, cx, cy, base * scale);
      core.addColorStop(0, `hsla(${hue}, 100%, 92%, 0.95)`);
      core.addColorStop(0.35, `hsla(${hue}, 95%, 65%, 0.55)`);
      core.addColorStop(1, `hsla(${hue + 20}, 90%, 30%, 0.35)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, base * scale, 0, Math.PI * 2);
      ctx.fill();

      // Inner liquid swirl
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        const rr = base * (0.55 + i * 0.12) * scale;
        const a = t * (0.6 + i * 0.3);
        ctx.strokeStyle = `hsla(${hue + i * 25}, 100%, 75%, ${0.25 - i * 0.05})`;
        ctx.lineWidth = (1 + i) * dpr;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr, rr * (0.6 + i * 0.1), a, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Specular highlight
      const spec = ctx.createRadialGradient(cx - base * 0.4, cy - base * 0.5, 0, cx - base * 0.4, cy - base * 0.5, base * 0.5);
      spec.addColorStop(0, "rgba(255,255,255,0.55)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx, cy, base * scale, 0, Math.PI * 2);
      ctx.fill();

      // Particles
      const emit = s === "listening" ? 3 : s === "speaking" ? 4 : s === "thinking" || s === "processing" ? 2 : 0;
      for (let i = 0; i < emit; i++) {
        particles.push({ a: Math.random() * Math.PI * 2, r: base * 1.05, sp: 0.6 + Math.random() * 1.4, life: 1 });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.r += p.sp * dpr;
        p.life -= 0.012;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${p.life * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (particles.length > 220) particles.splice(0, particles.length - 220);

      // Ripple on state change (wake / success)
      if (s === "wake" || s === "success") {
        const pulse = (t * 1.5) % 1;
        ctx.strokeStyle = `hsla(${hue}, 100%, 75%, ${1 - pulse})`;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, base * (1 + pulse * 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [micAnalyser, ttsAnalyser, reducedMotion]);

  return (
    <div className="relative w-full max-w-[min(80vh,520px)] aspect-square select-none">
      <canvas
        ref={canvasRef}
        role="button"
        aria-label={`Voice orb, ${meta.label}. Tap to talk.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPointerDown(); } }}
        onKeyUp={(e) => { if (e.key === " ") onPointerUp(); }}
        className="w-full h-full cursor-pointer touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-full"
        style={{ willChange: "transform, filter" }}
      />
    </div>
  );
}
