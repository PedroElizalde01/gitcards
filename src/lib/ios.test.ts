// Run: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { iosMajor } from "./ios.ts";

test("iosMajor: Safari version wins over the frozen OS part", () => {
  const safari = (v: string) => `Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v} Mobile/15E148 Safari/604.1`;
  assert.equal(iosMajor(safari("27.0")), 27);
  assert.equal(iosMajor(safari("26.1")), 26);
  assert.equal(iosMajor("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"), 17);
});

test("iosMajor: other iOS browsers fall back to the OS part; desktops are unknown", () => {
  assert.equal(iosMajor("Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1"), 18);
  assert.equal(iosMajor("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15"), null);
  assert.equal(iosMajor(null), null);
});
