import { createFileRoute } from "@tanstack/react-router";
import { JarvisOS } from "@/components/os/JarvisOS";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS Ultimate · AI Workspace" },
      { name: "description", content: "A visionOS-inspired AI-powered desktop workspace with saved chats, generated images, notes, and productivity tools." },
      { property: "og:title", content: "JARVIS Ultimate · AI Workspace" },
      { property: "og:description", content: "A visionOS-inspired AI-powered desktop workspace with saved chats and generated images." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return <JarvisOS />;
}
