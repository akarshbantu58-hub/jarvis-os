import { commandPolicy } from "./commandPolicy";
import { memoryManager } from "./memoryManager";

export type JarvisIntent = { type: "open-app" | "remember" | "forget" | "general"; value: string };
export class IntentEngine {
  parse(input: string): JarvisIntent {
    const text = input.trim();
    const open = text.match(/^open\s+(.+)$/i);
    if (open) return { type: "open-app", value: open[1].trim() };
    if (/^(remember|save this)\b/i.test(text)) return { type: "remember", value: text.replace(/^(remember|save this)\s*/i, "") };
    if (/^(forget|clear memory)\b/i.test(text)) return { type: "forget", value: text.replace(/^(forget|clear memory)\s*/i, "") };
    return { type: "general", value: text };
  }
}
export class ContextManager {
  recent(limit = 12) { return memoryManager.read().slice(-limit); }
}
export class CommandRouter {
  route(input: string, confirmed = false) {
    const risk = commandPolicy.classify(input);
    return { risk, allowed: commandPolicy.mayExecute(input, confirmed), requiresConfirmation: commandPolicy.requiresConfirmation(input) };
  }
}
export class JarvisCoordinator {
  readonly intents = new IntentEngine();
  readonly context = new ContextManager();
  readonly commands = new CommandRouter();
  remember(role: "user" | "assistant", text: string) { return memoryManager.append({ role, text }); }
  clearMemory() { memoryManager.clear(); }
  interpret(input: string) { return this.intents.parse(input); }
}
export const jarvisCoordinator = new JarvisCoordinator();
