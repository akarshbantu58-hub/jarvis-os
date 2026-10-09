import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

export type Thread = {
  id: string;
  title: string;
  updated_at: string;
};

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/* ---------------- chat threads ---------------- */

export async function listThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createThread(title = "New chat"): Promise<Thread> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id, title })
    .select("id, title, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function renameThread(id: string, title: string) {
  const { error } = await supabase.from("chat_threads").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function touchThread(id: string) {
  const { error } = await supabase
    .from("chat_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("touchThread", error);
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("chat_threads").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- chat messages ---------------- */

export async function loadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, client_message_id, role, message")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const m = row.message as unknown as UIMessage;
    return { ...m, id: row.client_message_id || row.id, role: row.role as UIMessage["role"] };
  });
}

export async function saveMessage(threadId: string, message: UIMessage) {
  const user_id = await requireUserId();
  const { error } = await supabase.from("chat_messages").upsert(
    {
      thread_id: threadId,
      user_id,
      client_message_id: message.id,
      role: message.role,
      message: JSON.parse(JSON.stringify(message)),
    },
    { onConflict: "thread_id,client_message_id" },
  );
  if (error) console.error("saveMessage failed", error);
}

/* ---------------- generated images ---------------- */

export type SavedImage = {
  id: string;
  prompt: string;
  model: string | null;
  storage_path: string;
  url: string;
};

const BUCKET = "generated-images";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header ?? "")?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function saveImage(dataUrl: string, prompt: string, model?: string): Promise<SavedImage> {
  const user_id = await requireUserId();
  const path = `${user_id}/${crypto.randomUUID()}.png`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, dataUrlToBlob(dataUrl), { contentType: "image/png" });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from("generated_images")
    .insert({ user_id, prompt, model: model ?? null, storage_path: path })
    .select("id, prompt, model, storage_path")
    .single();
  if (error) throw error;
  return { ...data, url: dataUrl };
}

export async function listImages(): Promise<SavedImage[]> {
  const { data, error } = await supabase
    .from("generated_images")
    .select("id, prompt, model, storage_path")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 60 * 60);
  return rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" }));
}

export async function deleteImage(img: SavedImage) {
  await supabase.storage.from(BUCKET).remove([img.storage_path]);
  const { error } = await supabase.from("generated_images").delete().eq("id", img.id);
  if (error) throw error;
}
