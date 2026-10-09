import { createFileRoute } from "@tanstack/react-router";

type Body = { text?: string; voice?: string; instructions?: string; model?: string };

// Legacy (OpenAI-style) voice names → ElevenLabs voice IDs, so older saved
// preferences keep working after the switch.
const LEGACY_MAP: Record<string, string> = {
  alloy: "JBFqnCBsd6RMkjVDRZzb", // George
  verse: "onwK4e9ZLuTAKqWW03F9", // Daniel
  aria: "EXAVITQu4vr4xnSDxMaL", // Sarah
  sage: "XrExE9yKIg1WjnnlVkGX", // Matilda
  coral: "FGY2WhTYpPnrIDTdsKH5", // Laura
  shimmer: "Xb7hH8MSUJpSbSDYk0k2", // Alice
};
const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice, instructions, model } = (await request.json()) as Body;
        if (!text || typeof text !== "string") {
          return new Response("text is required", { status: 400 });
        }
        const input = text.length > 3500 ? text.slice(0, 3500) : text;

        const elevenKey =
          request.headers.get("x-elevenlabs-key")?.trim() || process.env["ELEVENLABS_API_KEY"];

        if (elevenKey) {
          const voiceId = (voice && LEGACY_MAP[voice]) || voice || DEFAULT_VOICE;
          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
            {
              method: "POST",
              headers: {
                "xi-api-key": elevenKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: input,
                // multilingual v2 handles Indian languages natively
                model_id: model || "eleven_multilingual_v2",
                voice_settings: {
                  stability: 0.45,
                  similarity_boost: 0.8,
                  style: 0.35,
                  use_speaker_boost: true,
                },
              }),
            },
          );
          if (!upstream.ok) {
            const msg = await upstream.text().catch(() => "");
            console.error(`ElevenLabs TTS failed [${upstream.status}]: ${msg}`);
            return new Response(msg || "TTS failed", { status: upstream.status });
          }
          return new Response(upstream.body, {
            headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
          });
        }

        // Fallback: Lovable AI Gateway speech
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("No TTS provider configured", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input,
            voice: voice && LEGACY_MAP[voice] ? voice : "alloy",
            response_format: "mp3",
            instructions:
              instructions ||
              "Detect the language of the input automatically. Speak fluently and naturally in that same language, with correct native pronunciation. If the text is in an Indian language, use authentic Indian pronunciation and prosody. Speak warmly and clearly, like a helpful assistant.",
          }),
        });
        if (!upstream.ok) {
          const msg = await upstream.text().catch(() => "");
          return new Response(msg || "TTS failed", { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
