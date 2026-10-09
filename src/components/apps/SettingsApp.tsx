import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { loadApiKeys, saveApiKeys, type ApiKeys } from "@/lib/apiKeys";

function KeyField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <button onClick={() => setShow((s) => !s)} className="text-muted-foreground">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
      />
    </div>
  );
}

export function SettingsApp() {
  const [keys, setKeys] = useState<ApiKeys>(() => loadApiKeys());
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-transparent">
      <div>
        <h2 className="text-lg font-semibold mb-2">Appearance</h2>
        <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
          Liquid Glass theme active. Additional themes coming soon.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">AI</h2>
        <div className="glass rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between"><span>Provider</span><span className="text-muted-foreground">Lovable AI Gateway</span></div>
          <div className="flex justify-between"><span>Chat model</span><span className="text-muted-foreground">Gemini 3 Flash</span></div>
          <div className="flex justify-between"><span>Image model</span><span className="text-muted-foreground">GPT Image / Nano Banana 2</span></div>
          <div className="flex justify-between"><span>Streaming</span><span className="text-primary">Enabled</span></div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Your API keys</h2>
        <div className="glass rounded-xl p-4 text-sm space-y-4">
          <p className="text-xs text-muted-foreground">
            Optional. Keys stay in this browser and are sent only with your own requests. Leave
            blank to use the built-in JARVIS provider.
          </p>
          <KeyField
            label="OpenAI (chat + GPT image)"
            hint="sk-..."
            value={keys.openai}
            onChange={(v) => setKeys((k) => ({ ...k, openai: v }))}
          />
          <KeyField
            label="ElevenLabs (voice)"
            hint="sk_..."
            value={keys.elevenlabs}
            onChange={(v) => setKeys((k) => ({ ...k, elevenlabs: v }))}
          />
          <div className="flex items-center gap-3">
            <button onClick={save} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs">
              Save keys
            </button>
            <button
              onClick={() => { setKeys({ openai: "", elevenlabs: "" }); saveApiKeys({ openai: "", elevenlabs: "" }); }}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs"
            >
              Clear
            </button>
            {saved && (
              <span className="text-xs text-primary flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>
            )}
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Data</h2>
        <div className="glass rounded-xl p-4 text-sm space-y-3">
          <div className="text-muted-foreground">Notes and preferences are stored locally in your browser.</div>
          <button
            onClick={() => { if (confirm("Clear all local data?")) { localStorage.clear(); location.reload(); } }}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs"
          >
            Clear local data
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">About</h2>
        <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
          JARVIS Ultimate v2 · Built on Lovable
        </div>
      </div>
    </div>
  );
}
