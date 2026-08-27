import { test } from "node:test";
import assert from "node:assert/strict";
import { erRateLimited } from "./ratelimit.js";

test("under grensen slipper gjennom", async () => {
  const id = "test-under-" + Math.random();
  for (let i = 0; i < 5; i++) {
    assert.equal(await erRateLimited(id, { grense: 12 }), false);
  }
});

test("over grensen stoppes", async () => {
  const id = "test-over-" + Math.random();
  for (let i = 0; i < 12; i++) {
    await erRateLimited(id, { grense: 12 });
  }
  assert.equal(await erRateLimited(id, { grense: 12 }), true);
});
