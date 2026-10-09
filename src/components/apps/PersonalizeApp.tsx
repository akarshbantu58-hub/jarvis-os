import { useRef, useState } from "react";
import { usePersonalization, DEFAULT_PROFILE, type BootStyle } from "@/lib/personalization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Play, RotateCcw, Download, Upload, Plus, Trash2 } from "lucide-react";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function PersonalizeApp() {
  const p = usePersonalization();
  const { profile, update, reset, replayBoot } = p;
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-full overflow-y-auto bg-transparent">
      <Tabs defaultValue="branding" className="p-4">
        <TabsList className="glass">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="boot">Boot</TabsTrigger>
          <TabsTrigger value="theme">Theme Studio</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
        </TabsList>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-4 pt-4">
          <div className="glass rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Assistant name">
              <Input value={profile.assistantName} onChange={(e) => update({ assistantName: e.target.value })} />
            </Field>
            <Field label="OS name">
              <Input value={profile.osName} onChange={(e) => update({ osName: e.target.value })} />
            </Field>
            <Field label="User display name">
              <Input value={profile.userName} onChange={(e) => update({ userName: e.target.value })} />
            </Field>
            <Field label="Welcome message">
              <Input value={profile.welcomeMessage} onChange={(e) => update({ welcomeMessage: e.target.value })} />
            </Field>
            <Field label="Greeting text">
              <Input value={profile.greeting} onChange={(e) => update({ greeting: e.target.value })} />
            </Field>
            <Field label="Startup message">
              <Input value={profile.startupMessage} onChange={(e) => update({ startupMessage: e.target.value })} />
            </Field>
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold">Avatar & Wallpaper</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full glass overflow-hidden grid place-items-center">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{profile.userName.charAt(0)}</span>
                  )}
                </div>
                <label className="text-xs cursor-pointer glass px-3 py-1 rounded-lg">
                  Upload avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ avatarUrl: await fileToDataUrl(f) });
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-32 h-20 rounded-lg glass overflow-hidden">
                  {profile.wallpaperUrl && <img src={profile.wallpaperUrl} alt="wallpaper" className="w-full h-full object-cover" />}
                </div>
                <label className="text-xs cursor-pointer glass px-3 py-1 rounded-lg">
                  Upload wallpaper
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ wallpaperUrl: await fileToDataUrl(f) });
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* BOOT */}
        <TabsContent value="boot" className="space-y-4 pt-4">
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Enable boot animation</div>
                <div className="text-xs text-muted-foreground">Plays on every startup</div>
              </div>
              <Switch checked={profile.bootEnabled} onCheckedChange={(v) => update({ bootEnabled: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Boot style">
                <select
                  value={profile.bootStyle}
                  onChange={(e) => update({ bootStyle: e.target.value as BootStyle })}
                  className="glass rounded-md px-2 py-1.5 text-sm"
                >
                  <option value="rings">Holographic Rings</option>
                  <option value="scan">Scan Line</option>
                  <option value="particles">Particles</option>
                  <option value="minimal">Minimal</option>
                </select>
              </Field>
              <Field label="Duration (ms)">
                <Input
                  type="number"
                  min={800}
                  max={12000}
                  step={200}
                  value={profile.bootDurationMs}
                  onChange={(e) => update({ bootDurationMs: Number(e.target.value) })}
                />
              </Field>
              <Field label="Primary boot color">
                <input
                  type="color"
                  value={profile.bootColor}
                  onChange={(e) => update({ bootColor: e.target.value })}
                  className="h-9 w-full rounded-md bg-transparent"
                />
              </Field>
              <div className="flex items-end">
                <label className="text-xs cursor-pointer glass px-3 py-2 rounded-lg w-full text-center">
                  Upload boot logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ bootLogoUrl: await fileToDataUrl(f) });
                    }}
                  />
                </label>
              </div>
              <div className="flex items-end">
                <label className="text-xs cursor-pointer glass px-3 py-2 rounded-lg w-full text-center">
                  Upload boot video (optional)
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ bootVideoUrl: await fileToDataUrl(f) });
                    }}
                  />
                </label>
              </div>
              <div className="flex items-end">
                <label className="text-xs cursor-pointer glass px-3 py-2 rounded-lg w-full text-center">
                  Upload boot sound
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ bootSoundUrl: await fileToDataUrl(f), bootSoundEnabled: true });
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Boot sound enabled</span>
              <Switch checked={profile.bootSoundEnabled} onCheckedChange={(v) => update({ bootSoundEnabled: v })} />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={replayBoot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-primary-foreground"
                style={{ background: `linear-gradient(to right, ${profile.bootColor}, ${profile.accent2})` }}
              >
                <Play className="w-3 h-3" /> Preview / Replay
              </button>
              <button
                onClick={() => {
                  update({
                    bootEnabled: DEFAULT_PROFILE.bootEnabled,
                    bootStyle: DEFAULT_PROFILE.bootStyle,
                    bootDurationMs: DEFAULT_PROFILE.bootDurationMs,
                    bootColor: DEFAULT_PROFILE.bootColor,
                    bootLogoUrl: DEFAULT_PROFILE.bootLogoUrl,
                    bootVideoUrl: null,
                    bootSoundEnabled: false,
                    bootSoundUrl: null,
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass"
              >
                <RotateCcw className="w-3 h-3" /> Restore default
              </button>
            </div>
          </div>
        </TabsContent>

        {/* THEME */}
        <TabsContent value="theme" className="space-y-4 pt-4">
          <div className="glass rounded-xl p-4 grid grid-cols-2 gap-3">
            <Field label="Accent color">
              <input type="color" value={profile.accent} onChange={(e) => update({ accent: e.target.value })} className="h-9 w-full rounded-md bg-transparent" />
            </Field>
            <Field label="Secondary accent">
              <input type="color" value={profile.accent2} onChange={(e) => update({ accent2: e.target.value })} className="h-9 w-full rounded-md bg-transparent" />
            </Field>
            <Field label="Corner radius (px)">
              <Input type="number" min={0} max={40} value={profile.radius} onChange={(e) => update({ radius: Number(e.target.value) })} />
            </Field>
            <Field label="Glass blur (px)">
              <Input type="number" min={0} max={60} value={profile.blur} onChange={(e) => update({ blur: Number(e.target.value) })} />
            </Field>
            <Field label="Transparency">
              <input type="range" min={0.1} max={1} step={0.05} value={profile.transparency} onChange={(e) => update({ transparency: Number(e.target.value) })} />
            </Field>
            <Field label="Font family">
              <select value={profile.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} className="glass rounded-md px-2 py-1.5 text-sm">
                <option value="system">System</option>
                <option value="'SF Pro Display', system-ui">SF Pro</option>
                <option value="'Inter', system-ui">Inter</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="Georgia, serif">Serif</option>
              </select>
            </Field>
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-sm">Particle effects</span>
              <Switch checked={profile.particles} onCheckedChange={(v) => update({ particles: v })} />
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm">Live preview is applied instantly across the OS.</div>
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass">
              <RotateCcw className="w-3 h-3" /> Reset theme
            </button>
          </div>
        </TabsContent>

        {/* PROFILES */}
        <TabsContent value="profiles" className="space-y-4 pt-4">
          <ProfilesPanel importRef={importRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfilesPanel({ importRef }: { importRef: React.RefObject<HTMLInputElement | null> }) {
  const { profiles, activeId, selectProfile, addProfile, deleteProfile, exportProfile, importProfile } = usePersonalization();
  const [newName, setNewName] = useState("");

  return (
    <>
      <div className="glass rounded-xl p-4 space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between glass rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={activeId === p.id}
                onChange={() => selectProfile(p.id)}
              />
              <span className="text-sm">{p.name}</span>
              <span className="text-xs text-muted-foreground">— {p.assistantName}</span>
            </div>
            {profiles.length > 1 && (
              <button onClick={() => deleteProfile(p.id)} className="text-destructive/80 hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4 flex items-center gap-2">
        <Input placeholder="New profile name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button
          onClick={() => { if (newName.trim()) { addProfile(newName.trim()); setNewName(""); } }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-primary text-primary-foreground"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <div className="glass rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            const blob = new Blob([exportProfile()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "profile.json"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass"
        >
          <Download className="w-3 h-3" /> Export
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass"
        >
          <Upload className="w-3 h-3" /> Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            importProfile(text);
          }}
        />
      </div>
    </>
  );
}
