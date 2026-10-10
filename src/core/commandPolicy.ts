export type CommandRisk = "safe" | "sensitive" | "blocked";
const SENSITIVE = /\b(send|purchase|pay|delete|erase|uninstall|share location|post publicly|factory reset)\b/i;
const BLOCKED = /\b(bypass security|steal password|disable antivirus|exfiltrate)\b/i;
export class CommandPolicy {
  classify(command: string): CommandRisk {
    if (BLOCKED.test(command)) return "blocked";
    if (SENSITIVE.test(command)) return "sensitive";
    return "safe";
  }
  requiresConfirmation(command: string): boolean { return this.classify(command) === "sensitive"; }
  mayExecute(command: string, confirmed = false): boolean {
    const risk = this.classify(command);
    return risk === "safe" || (risk === "sensitive" && confirmed);
  }
}
export const commandPolicy = new CommandPolicy();
