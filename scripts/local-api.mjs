import http from "node:http";
import { loadEnvLocal } from "./load-env.mjs";
import { handler } from "../netlify/functions/api.js";

loadEnvLocal({ override: true });

function supabaseProjectRef() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "unknown";
}

const port = Number(process.env.LOCAL_API_PORT || 8787);

const server = http.createServer(async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const result = await handler({
        httpMethod: req.method ?? "GET",
        path: url.pathname,
        headers: req.headers,
        body: body || undefined
      });
      const headers = { ...(result.headers ?? {}) };
      res.writeHead(result.statusCode ?? 500, headers);
      res.end(result.body ?? "");
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ message: error.message || "Local API error" }));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[local-api] http://127.0.0.1:${port}`);
  console.log(`[local-api] Supabase project ref: ${supabaseProjectRef()}`);
});
