import { createFileRoute } from "@tanstack/react-router";

type Body = { prompt?: string; image?: string; model?: string; size?: string; quality?: string };

const GEMINI_MODEL = "google/gemini-3.1-flash-image";
const GPT_MODEL = "openai/gpt-image-2";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, image, model, size, quality } = (await request.json()) as Body;
        if (!prompt || !prompt.trim()) {
          return new Response("prompt is required", { status: 400 });
        }

        const userOpenAiKey = request.headers.get("x-openai-key")?.trim();

        // Reference-image editing is only supported on the Gemini chat-shape model.
        const chosen = image ? GEMINI_MODEL : model === GEMINI_MODEL ? GEMINI_MODEL : GPT_MODEL;
        const isGpt = chosen === GPT_MODEL;

        let url: string;
        let headers: Record<string, string>;
        let body: Record<string, unknown>;

        if (isGpt && userOpenAiKey) {
          // Direct OpenAI with the user's own key.
          url = "https://api.openai.com/v1/images/generations";
          headers = {
            Authorization: `Bearer ${userOpenAiKey}`,
            "Content-Type": "application/json",
          };
          body = {
            model: "gpt-image-2",
            prompt,
            size: size || "1024x1024",
            quality: quality || "medium",
            n: 1,
            stream: true,
            partial_images: 2,
          };
        } else {
          const key = process.env["LOVABLE_API_KEY"];
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          url = "https://ai.gateway.lovable.dev/v1/images/generations";
          headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
          body = isGpt
            ? {
                model: GPT_MODEL,
                prompt,
                size: size || "1024x1024",
                quality: quality || "medium",
                n: 1,
                stream: true,
                partial_images: 2,
              }
            : {
                model: GEMINI_MODEL,
                messages: [
                  {
                    role: "user",
                    content: image
                      ? [
                          { type: "text", text: prompt },
                          { type: "image_url", image_url: { url: image } },
                        ]
                      : prompt,
                  },
                ],
                modalities: ["image", "text"],
                stream: true,
              };
        }

        const upstream = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!upstream.ok || !upstream.body) {
          const msg = await upstream.text().catch(() => "");
          console.error(`Image generation failed [${upstream.status}]: ${msg}`);
          return new Response(msg || "Image generation failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
