import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnvLocal } from "./load-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvLocal({ override: true });

const api = spawn("node", ["scripts/local-api.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

const vite = spawn("npx", ["vite", "--host", "0.0.0.0"], {
  cwd: root,
  stdio: "inherit",
  shell: true
});

const shutdown = (signal) => {
  api.kill(signal);
  vite.kill(signal);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

api.on("exit", (code) => {
  if (code && code !== 0) {
    vite.kill("SIGTERM");
    process.exit(code);
  }
});

vite.on("exit", (code) => {
  api.kill("SIGTERM");
  process.exit(code ?? 0);
});
