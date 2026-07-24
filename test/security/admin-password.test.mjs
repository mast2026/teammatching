import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("netlify/functions/api.js", "utf8");

test("admin authentication has no hardcoded numeric fallback", () => {
  assert.doesNotMatch(source, /adminPassword:[^\n]*["']123456["']/);
});

test("admin authentication fails closed when environment configuration is absent", () => {
  assert.match(
    source,
    /adminPassword:\s*requiredEnv\("ADMIN_PASSWORD",\s*"REPLIT_ADMIN_PASSWORD"\)/,
  );
  assert.match(source, /throw new Error\(`Missing \$\{names\.join/);
});
