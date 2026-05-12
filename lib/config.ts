import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_PATH = path.join(os.homedir(), ".drawer", "config.json");

type Config = {
  anthropicApiKey?: string;
};

function readConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Config;
  } catch {
    return {};
  }
}

export function resolveApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const cfg = readConfig();
  if (typeof cfg.anthropicApiKey === "string" && cfg.anthropicApiKey.trim()) {
    return cfg.anthropicApiKey.trim();
  }
  return undefined;
}

export function writeApiKey(key: string): void {
  const cfg = readConfig();
  cfg.anthropicApiKey = key.trim();
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function clearApiKey(): void {
  const cfg = readConfig();
  delete cfg.anthropicApiKey;
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}
