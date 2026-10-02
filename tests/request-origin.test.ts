import test from "node:test";
import assert from "node:assert/strict";
import { verifyRequestOrigin } from "../lib/auth/request-origin.ts";

test("proxy requests accept the configured public deployment and reject forged origins", () => {
  const previous = process.env.URL;
  process.env.URL = "https://tessera.example.com";
  try {
    assert.doesNotThrow(() => verifyRequestOrigin(new Request("http://internal/api/admin", {headers:{origin:"https://tessera.example.com"}})));
    assert.throws(() => verifyRequestOrigin(new Request("http://internal/api/admin", {headers:{origin:"https://attacker.example", "x-forwarded-host":"attacker.example"}})));
    assert.throws(() => verifyRequestOrigin(new Request("http://internal/api/admin")));
  } finally {
    if (previous === undefined) delete process.env.URL; else process.env.URL = previous;
  }
});

