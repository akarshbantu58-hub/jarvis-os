import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, X, Play, Download, Sparkles, FileCode, FilePlus, Trash2,
  FolderPlus, Send, Loader2, Wand2, Bug, FileText, TestTube2, Braces,
  RefreshCw, Smartphone, Package, Terminal,
} from "lucide-react";

type FileNode = { path: string; content: string };
type Project = { name: string; files: FileNode[] };

const LS_KEY = "jarvis.devstudio.project";

const TEMPLATES: Record<string, () => Project> = {
  "blank-html": () => ({
    name: "blank-web",
    files: [
      { path: "index.html", content: `<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8" />\n  <title>My App</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <h1>Hello JARVIS</h1>\n  <button id="btn">Click me</button>\n  <script src="app.js"></script>\n</body>\n</html>\n` },
      { path: "styles.css", content: `body{font-family:system-ui;background:#0b1020;color:#e6f0ff;padding:2rem}\nbutton{padding:.6rem 1rem;border-radius:.5rem;border:1px solid #3b82f6;background:#1e3a8a;color:white;cursor:pointer}\n` },
      { path: "app.js", content: `document.getElementById('btn').addEventListener('click',()=>{\n  console.log('clicked at', new Date().toISOString());\n  alert('Hello from JARVIS Dev Studio!');\n});\n` },
    ],
  }),
  "landing": () => ({
    name: "landing-page",
    files: [
      { path: "index.html", content: `<!doctype html><html><head><meta charset="utf-8"/><title>Landing</title><link rel="stylesheet" href="styles.css"/></head><body>\n<header><h1>Product Name</h1><nav><a href="#f">Features</a> <a href="#p">Pricing</a></nav></header>\n<section class="hero"><h2>Build faster with AI</h2><p>The AI-native dev studio.</p><button>Get started</button></section>\n<section id="f"><h3>Features</h3><ul><li>Fast</li><li>Smart</li><li>Beautiful</li></ul></section>\n</body></html>` },
      { path: "styles.css", content: `*{box-sizing:border-box}body{margin:0;font-family:system-ui;background:#0f172a;color:#e2e8f0}header{display:flex;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid #1e293b}.hero{padding:4rem 2rem;text-align:center;background:linear-gradient(135deg,#1e3a8a,#7c3aed)}.hero h2{font-size:3rem;margin:0}button{margin-top:1rem;padding:.75rem 1.5rem;border-radius:.5rem;border:0;background:#22d3ee;color:#0f172a;font-weight:600;cursor:pointer}section{padding:3rem 2rem}` },
    ],
  }),
  "react-vite": () => ({
    name: "react-vite-app",
    files: [
      { path: "package.json", content: JSON.stringify({ name: "react-vite-app", private: true, type: "module", scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { "@vitejs/plugin-react": "^5.0.0", vite: "^7.0.0" } }, null, 2) },
      { path: "vite.config.js", content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins:[react()] })\n` },
      { path: "index.html", content: `<!doctype html><html><head><meta charset="utf-8"/><title>React App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>` },
      { path: "src/main.jsx", content: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<App/>)\n` },
      { path: "src/App.jsx", content: `export default function App(){\n  return <div style={{padding:'2rem',fontFamily:'system-ui'}}>\n    <h1>Hello from React + Vite</h1>\n  </div>\n}\n` },
      { path: "README.md", content: `# React Vite App\n\nRun: \`npm install && npm run dev\`\n` },
    ],
  }),
  "express-api": () => ({
    name: "express-api",
    files: [
      { path: "package.json", content: JSON.stringify({ name: "express-api", type: "module", scripts: { start: "node server.js" }, dependencies: { express: "^4.21.0" } }, null, 2) },
      { path: "server.js", content: `import express from 'express'\nconst app = express()\napp.use(express.json())\napp.get('/api/health', (_req,res)=>res.json({ok:true}))\napp.listen(3000, ()=>console.log('http://localhost:3000'))\n` },
      { path: "README.md", content: `# Express API\n\nRun: \`npm install && npm start\`\n` },
    ],
  }),
  "python": () => ({
    name: "python-project",
    files: [
      { path: "main.py", content: `def main():\n    print("Hello from JARVIS")\n\nif __name__ == "__main__":\n    main()\n` },
      { path: "requirements.txt", content: `# add dependencies here\n` },
      { path: "README.md", content: `# Python Project\n\nRun: \`python main.py\`\n` },
    ],
  }),
  "portfolio": () => ({
    name: "portfolio",
    files: [
      { path: "index.html", content: `<!doctype html><html><head><meta charset="utf-8"/><title>AKARSH · Portfolio</title><link rel="stylesheet" href="styles.css"/></head><body>\n<main><h1>AKARSH</h1><p>Developer · Designer · Maker</p><section><h2>Projects</h2><ul><li>JARVIS OS</li><li>Dev Studio</li></ul></section></main>\n</body></html>` },
      { path: "styles.css", content: `body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 20%,#1e3a8a,#020617);color:white;font-family:system-ui}main{text-align:center}h1{font-size:4rem;background:linear-gradient(90deg,#22d3ee,#a78bfa);-webkit-background-clip:text;color:transparent}` },
    ],
  }),
};

function loadProject(): Project {
  if (typeof window === "undefined") return TEMPLATES["blank-html"]();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return TEMPLATES["blank-html"]();
}

function langOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  return { html: "html", css: "css", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", md: "markdown", py: "python" }[ext ?? ""] ?? "text";
}

function highlight(code: string, lang: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = esc(code);
  if (lang === "html") {
    out = out.replace(/(&lt;\/?[a-zA-Z0-9-]+)/g, '<span style="color:#7dd3fc">$1</span>')
      .replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;)/g, '<span style="color:#fbbf24">$1</span>=<span style="color:#86efac">$2</span>');
  } else if (lang === "css") {
    out = out.replace(/([.#]?[a-zA-Z_-]+)(\s*\{)/g, '<span style="color:#7dd3fc">$1</span>$2')
      .replace(/([a-z-]+)(\s*:)/g, '<span style="color:#fbbf24">$1</span>$2');
  } else if (lang === "javascript" || lang === "typescript") {
    out = out.replace(/\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|new|await|async|=&gt;)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;|`[^`]*?`)/g, '<span style="color:#86efac">$1</span>')
      .replace(/\/\/.*$/gm, (m) => `<span style="color:#64748b">${m}</span>`);
  } else if (lang === "json") {
    out = out.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span style="color:#7dd3fc">$1</span>$2')
      .replace(/:\s*(&quot;[^&]*?&quot;)/g, ': <span style="color:#86efac">$1</span>')
      .replace(/\b(true|false|null|\d+)\b/g, '<span style="color:#fbbf24">$1</span>');
  } else if (lang === "python") {
    out = out.replace(/\b(def|return|if|else|elif|for|while|import|from|class|None|True|False)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;)/g, '<span style="color:#86efac">$1</span>')
      .replace(/#.*$/gm, (m) => `<span style="color:#64748b">${m}</span>`);
  } else if (lang === "markdown") {
    out = out.replace(/^(#{1,6}.*)$/gm, '<span style="color:#7dd3fc">$1</span>');
  }
  return out;
}

export function DevStudioApp() {
  const [project, setProject] = useState<Project>(() => loadProject());
  const [activePath, setActivePath] = useState<string>(() => loadProject().files[0]?.path ?? "");
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const p = loadProject();
    return p.files[0] ? [p.files[0].path] : [];
  });
  const [rightTab, setRightTab] = useState<"preview" | "ai" | "console">("preview");
  const [consoleLog, setConsoleLog] = useState<{ level: string; msg: string }[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(project)); } catch {} }, [project]);

  const active = project.files.find((f) => f.path === activePath);

  const openFile = (path: string) => {
    setActivePath(path);
    setOpenTabs((t) => (t.includes(path) ? t : [...t, path]));
  };
  const closeTab = (path: string) => {
    setOpenTabs((t) => {
      const nt = t.filter((p) => p !== path);
      if (activePath === path) setActivePath(nt[nt.length - 1] ?? "");
      return nt;
    });
  };
  const updateFile = (path: string, content: string) => {
    setProject((p) => ({ ...p, files: p.files.map((f) => (f.path === path ? { ...f, content } : f)) }));
  };
  const addFile = () => {
    const name = prompt("New file path (e.g. src/utils.js):");
    if (!name) return;
    if (project.files.some((f) => f.path === name)) { alert("File exists"); return; }
    setProject((p) => ({ ...p, files: [...p.files, { path: name, content: "" }] }));
    openFile(name);
  };
  const deleteFile = (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    setProject((p) => ({ ...p, files: p.files.filter((f) => f.path !== path) }));
    closeTab(path);
  };
  const loadTemplate = (id: string) => {
    if (!confirm("Replace current project with template?")) return;
    const p = TEMPLATES[id]();
    setProject(p);
    setOpenTabs([p.files[0].path]);
    setActivePath(p.files[0].path);
  };

  // Preview
  const previewSrcDoc = useMemo(() => {
    const html = project.files.find((f) => f.path === "index.html");
    if (!html) return `<html><body style="font-family:system-ui;padding:2rem;color:#94a3b8;background:#0b1020">No <b>index.html</b> in project.</body></html>`;
    let src = html.content;
    // inline css
    src = src.replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/g, (_, p) => {
      const css = project.files.find((f) => f.path === p);
      return css ? `<style>${css.content}</style>` : "";
    });
    // inline js
    src = src.replace(/<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/g, (_, p) => {
      const js = project.files.find((f) => f.path === p);
      return js ? `<script>${js.content}</script>` : "";
    });
    const bridge = `<script>(function(){const send=(level,args)=>parent.postMessage({__jarvis:1,level,msg:args.map(a=>{try{return typeof a==='object'?JSON.stringify(a):String(a)}catch{return String(a)}}).join(' ')},'*');['log','warn','error','info'].forEach(l=>{const o=console[l].bind(console);console[l]=(...a)=>{send(l,a);o(...a)}});window.addEventListener('error',e=>send('error',[e.message]));window.addEventListener('unhandledrejection',e=>send('error',['Unhandled: '+e.reason]));})();</script>`;
    return src.replace("<head>", `<head>${bridge}`).replace(/^(?!.*<head>)/s, bridge);
  }, [project, previewKey]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.__jarvis) setConsoleLog((c) => [...c.slice(-100), { level: e.data.level, msg: e.data.msg }]);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const runPreview = () => { setConsoleLog([]); setPreviewKey((k) => k + 1); };

  // Export as ZIP
  const exportZip = async () => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    project.files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.name}.zip`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAndroid = async () => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    project.files.forEach((f) => zip.file(`www/${f.path}`, f.content));
    zip.file("capacitor.config.json", JSON.stringify({
      appId: `com.jarvis.${project.name.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
      appName: project.name,
      webDir: "www",
      server: { androidScheme: "https" },
    }, null, 2));
    zip.file("package.json", JSON.stringify({
      name: project.name, version: "1.0.0",
      scripts: { "cap:add": "cap add android", "cap:sync": "cap sync", "cap:open": "cap open android" },
      dependencies: { "@capacitor/core": "^6.0.0", "@capacitor/android": "^6.0.0" },
      devDependencies: { "@capacitor/cli": "^6.0.0" },
    }, null, 2));
    zip.file("README.md", `# ${project.name} — Android (Capacitor)\n\n## Steps to build the APK\n\n1. \`npm install\`\n2. \`npx cap add android\`\n3. \`npx cap sync\`\n4. \`npx cap open android\` — opens Android Studio\n5. In Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**\n6. For a signed release AAB: **Build > Generate Signed Bundle / APK** (create a keystore first)\n\n> Note: APK/AAB generation requires Android Studio + JDK on your machine. It cannot be produced in the browser.\n`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.name}-android.zip`; a.click();
    URL.revokeObjectURL(url);
  };

  // AI assistant
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({ id: "devstudio", transport: transport.current });
  const [aiInput, setAiInput] = useState("");

  const buildContext = () => {
    const files = project.files.map((f) => `--- FILE: ${f.path} ---\n${f.content}`).join("\n\n");
    return `You are JARVIS Dev Studio assistant. Help with code generation, refactoring, bug detection, docs, and tests. When proposing file changes, output them as fenced blocks with the header \`FILE: path\` on the line before the code fence. Current project "${project.name}":\n\n${files}`;
  };

  const askAI = (prompt: string) => {
    if (!prompt.trim()) return;
    sendMessage({ text: prompt }, { body: { system: buildContext() } });
    setAiInput("");
    setRightTab("ai");
  };

  const quickAction = (label: string) => {
    if (!active) return;
    askAI(`${label} the file \`${active.path}\`. Return the improved file content in a fenced block with header \`FILE: ${active.path}\`.`);
  };

  // Apply AI-suggested file blocks
  const applyFromMessage = (text: string) => {
    const re = /FILE:\s*([^\n`]+)\s*\n```[a-z]*\n([\s\S]*?)```/g;
    let m; let count = 0;
    const patches: Record<string, string> = {};
    while ((m = re.exec(text)) !== null) { patches[m[1].trim()] = m[2]; count++; }
    if (count === 0) { alert("No FILE: blocks found in reply."); return; }
    setProject((p) => {
      const files = [...p.files];
      for (const [path, content] of Object.entries(patches)) {
        const i = files.findIndex((f) => f.path === path);
        if (i >= 0) files[i] = { ...files[i], content };
        else files.push({ path, content });
      }
      return { ...p, files };
    });
    alert(`Applied ${count} file change(s).`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background/60 text-foreground">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Dev Studio
        </div>
        <span className="text-xs text-muted-foreground">· {project.name}</span>
        <div className="flex-1" />
        <select
          className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1"
          onChange={(e) => { if (e.target.value) { loadTemplate(e.target.value); e.target.value = ""; } }}
          defaultValue=""
        >
          <option value="" disabled>+ Template</option>
          <option value="blank-html">Blank HTML</option>
          <option value="landing">Landing Page</option>
          <option value="portfolio">Portfolio</option>
          <option value="react-vite">React + Vite</option>
          <option value="express-api">Express API</option>
          <option value="python">Python</option>
        </select>
        <button onClick={runPreview} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40">
          <Play className="w-3 h-3" /> Run
        </button>
        <button onClick={exportZip} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10">
          <Download className="w-3 h-3" /> ZIP
        </button>
        <button onClick={exportAndroid} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10" title="Export Capacitor Android project">
          <Smartphone className="w-3 h-3" /> Android
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[180px_1fr_1fr]">
        {/* Sidebar - files */}
        <div className="border-r border-white/10 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground border-b border-white/10">
            <span>FILES</span>
            <div className="flex gap-1">
              <button onClick={addFile} title="New file" className="p-1 hover:bg-white/10 rounded"><FilePlus className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="overflow-auto flex-1 py-1">
            {project.files.map((f) => (
              <div key={f.path} className={`group flex items-center px-2 py-1 text-xs cursor-pointer ${activePath === f.path ? "bg-cyan-500/20" : "hover:bg-white/5"}`} onClick={() => openFile(f.path)}>
                <FileCode className="w-3 h-3 mr-1.5 shrink-0 opacity-70" />
                <span className="truncate flex-1">{f.path}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteFile(f.path); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex flex-col min-h-0 border-r border-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 border-b border-white/10 overflow-x-auto">
            {openTabs.map((p) => (
              <div key={p} className={`flex items-center gap-1 px-2 py-1 text-xs cursor-pointer border-r border-white/10 ${activePath === p ? "bg-white/10 text-white" : "hover:bg-white/5 text-muted-foreground"}`} onClick={() => setActivePath(p)}>
                <span className="truncate max-w-[140px]">{p.split("/").pop()}</span>
                <button onClick={(e) => { e.stopPropagation(); closeTab(p); }} className="hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          {/* Editor body */}
          {active ? (
            <EditorPane file={active} onChange={(c) => updateFile(active.path, c)} />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Open a file to start</div>
          )}
          {active && (
            <div className="flex items-center gap-1 px-2 py-1 border-t border-white/10 text-[10px] text-muted-foreground overflow-x-auto">
              <button onClick={() => quickAction("Refactor and clean up")} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"><Wand2 className="w-3 h-3" /> Refactor</button>
              <button onClick={() => quickAction("Find and explain bugs in")} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"><Bug className="w-3 h-3" /> Debug</button>
              <button onClick={() => quickAction("Add JSDoc / docstring comments to")} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"><FileText className="w-3 h-3" /> Docs</button>
              <button onClick={() => quickAction("Generate unit tests for")} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"><TestTube2 className="w-3 h-3" /> Tests</button>
              <button onClick={() => quickAction("Format")} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"><Braces className="w-3 h-3" /> Format</button>
              <span className="ml-auto">{langOf(active.path)} · {active.content.length} ch</span>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col min-h-0">
          <div className="flex border-b border-white/10 text-xs">
            {(["preview", "ai", "console"] as const).map((t) => (
              <button key={t} onClick={() => setRightTab(t)} className={`flex-1 px-2 py-1.5 capitalize ${rightTab === t ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5"}`}>
                {t === "preview" ? "Preview" : t === "ai" ? "AI Assistant" : `Console (${consoleLog.length})`}
              </button>
            ))}
          </div>
          {rightTab === "preview" && (
            <div className="flex-1 min-h-0 bg-white">
              <iframe key={previewKey} ref={iframeRef} srcDoc={previewSrcDoc} sandbox="allow-scripts allow-modals allow-forms" className="w-full h-full border-0" title="preview" />
            </div>
          )}
          {rightTab === "console" && (
            <div className="flex-1 min-h-0 overflow-auto bg-black/40 font-mono text-[11px] p-2 space-y-0.5">
              {consoleLog.length === 0 && <div className="text-muted-foreground">No output. Click Run.</div>}
              {consoleLog.map((l, i) => (
                <div key={i} className={l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-yellow-300" : "text-slate-200"}>
                  <span className="opacity-50">[{l.level}]</span> {l.msg}
                </div>
              ))}
              <button onClick={() => setConsoleLog([])} className="mt-2 text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"><RefreshCw className="w-3 h-3 inline mr-1" />Clear</button>
            </div>
          )}
          {rightTab === "ai" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-auto p-2 space-y-2 text-xs">
                {messages.length === 0 && (
                  <div className="text-muted-foreground text-center py-6">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                    Ask JARVIS to build, refactor, explain, or debug your code.
                  </div>
                )}
                {messages.map((m) => {
                  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                  return (
                    <div key={m.id} className={`rounded p-2 ${m.role === "user" ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-white/5 border border-white/10"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold opacity-70">{m.role === "user" ? "You" : "JARVIS"}</span>
                        {m.role !== "user" && /FILE:\s*[^\n]+\s*\n```/.test(text) && (
                          <button onClick={() => applyFromMessage(text)} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Apply changes
                          </button>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-sans text-[11px]">{text}</pre>
                    </div>
                  );
                })}
                {status === "streaming" && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
              </div>
              <div className="p-2 border-t border-white/10 flex gap-1">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAI(aiInput); } }}
                  placeholder="Ask JARVIS to build or change code…"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs resize-none h-14"
                />
                <button onClick={() => askAI(aiInput)} disabled={!aiInput.trim() || status === "streaming"} className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorPane({ file, onChange }: { file: FileNode; onChange: (c: string) => void }) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [showFind, setShowFind] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lang = langOf(file.path);
  const lines = file.content.split("\n").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        if (document.activeElement === taRef.current) { e.preventDefault(); setShowFind((s) => !s); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const doReplace = () => {
    if (!find) return;
    onChange(file.content.split(find).join(replace));
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const s = el.selectionStart, en = el.selectionEnd;
      const v = file.content.slice(0, s) + "  " + file.content.slice(en);
      onChange(v);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  };

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      {showFind && (
        <div className="flex gap-1 p-1 border-b border-white/10 bg-black/30 text-xs">
          <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find" className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5" />
          <input value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Replace" className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5" />
          <button onClick={doReplace} className="px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30">Replace all</button>
          <button onClick={() => setShowFind(false)} className="px-2 rounded hover:bg-white/10"><X className="w-3 h-3" /></button>
        </div>
      )}
      <div className="flex-1 min-h-0 relative font-mono text-[12px] leading-[1.5]">
        <pre
          ref={preRef}
          aria-hidden
          className="absolute inset-0 m-0 p-2 pl-10 overflow-auto whitespace-pre pointer-events-none text-slate-200"
          dangerouslySetInnerHTML={{ __html: highlight(file.content + "\n", lang) }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/30 text-right text-[10px] text-slate-500 p-2 pointer-events-none select-none overflow-hidden">
          {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={taRef}
          value={file.content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleTab}
          onScroll={syncScroll}
          spellCheck={false}
          className="absolute inset-0 m-0 p-2 pl-10 bg-transparent text-transparent caret-white outline-none resize-none w-full h-full whitespace-pre overflow-auto"
        />
      </div>
      <div className="flex items-center gap-2 px-2 py-0.5 border-t border-white/10 text-[10px] text-muted-foreground">
        <Terminal className="w-3 h-3" />
        <span>{lines} lines</span>
        <button onClick={() => setShowFind((s) => !s)} className="ml-auto hover:text-white">⌘F Find/Replace</button>
      </div>
    </div>
  );
}
