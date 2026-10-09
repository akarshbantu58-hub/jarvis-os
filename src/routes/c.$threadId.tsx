import { createFileRoute, useParams } from "@tanstack/react-router";
import { JarvisOS } from "@/components/os/JarvisOS";

export const Route = createFileRoute("/c/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat · JARVIS Ultimate" },
      { name: "description", content: "Continue a saved JARVIS conversation, synced to your account." },
      { property: "og:title", content: "Chat · JARVIS Ultimate" },
      { property: "og:description", content: "Continue a saved JARVIS conversation, synced to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = useParams({ from: "/c/$threadId" });
  return <JarvisOS threadId={threadId} />;
}
