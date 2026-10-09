# JARVIS OS

An AI-powered, desktop-style assistant that runs in the browser and can be packaged as an Android APK.
Built by **Akarsh AI Labs**.

## What's inside

- **AI Chat** - multi-provider chat with streaming replies and saved conversations
- **Voice Assistant** - holographic orb UI, live voice transcription, hands-free conversation and
  speech output in 20+ Indian languages with automatic language detection
- **Imagine** - AI image generation with a saved cloud gallery
- **Dev Studio** - in-browser editor with an AI coding assistant, code runner and project export
- **Productivity** - Notes, Tasks, Files, Calculator, Clock
- **Personalize** - custom branding, boot animation, themes and accent colours

## Tech stack

React 19, TanStack Start, Tailwind CSS v4, shadcn/ui, and a hosted backend for auth,
database and file storage.

## Run it locally

```bash
bun install
bun run dev
```

## Make an Android APK

```bash
bun add @capacitor/core @capacitor/cli @capacitor/android
bunx cap init "JARVIS OS" com.akarsh.jarvisos --web-dir dist
bunx cap add android
```

In `capacitor.config.ts`, point the app at the hosted site so AI chat, voice and image
generation keep working:

```ts
server: { url: "https://jarvisaiassistantbyakarshai.lovable.app", cleartext: false }
```

Then build:

```bash
bun run build
bunx cap sync
bunx cap open android
```

## Notes

- Chat, voice and image features call the internet, so the packaged app loads the hosted site.
- You can add your own API keys from Settings and they will be used instead of the defaults.
