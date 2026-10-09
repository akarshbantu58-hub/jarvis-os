import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; model?: string; system?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const userOpenAiKey = request.headers.get("x-openai-key")?.trim();
        const key = process.env.LOVABLE_API_KEY;
        if (!key && !userOpenAiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let modelId = body.model || "google/gemini-3-flash-preview";
        let gateway;
        if (userOpenAiKey && modelId.startsWith("openai/")) {
          // Use the user's own OpenAI key directly.
          gateway = createOpenAICompatible({
            name: "lovable",
            baseURL: "https://api.openai.com/v1",
            headers: { Authorization: `Bearer ${userOpenAiKey}` },
          });
          modelId = modelId.replace(/^openai\//, "");
        } else {
          gateway = createLovableAiGatewayProvider(key!);
        }


        try {
          const result = streamText({
            model: gateway(modelId),
            system:
              body.system ||
              "You are JARVIS, an advanced AI assistant inspired by Tony Stark's assistant. You are precise, helpful, witty, and speak with confident sophistication.\n\nLANGUAGE POLICY (very important):\n- Automatically detect the language the user is writing in.\n- ALWAYS reply in the SAME language and script the user used. Do not switch languages unless the user explicitly asks.\n- You natively support all major Indian languages including Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), Urdu (اردو), Odia (ଓଡ଼ିଆ), Assamese (অসমীয়া), Sanskrit (संस्कृतम्), Konkani, Kashmiri, Sindhi, Nepali, Maithili, Bhojpuri, Dogri, Manipuri, Santali, and English.\n- If the user writes in Hinglish or Romanized Indian script, reply in the same style.\n- Use markdown when useful. Keep replies concise unless depth is asked for.",
            messages: await convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (err) {
          console.error("chat error", err);
          return new Response("AI request failed", { status: 500 });
        }
      },
    },
  },
});
