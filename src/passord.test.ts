import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassord, verifiserPassord } from "./passord.js";

test("riktig passord verifiseres", () => {
  const hash = hashPassord("hemmelig123");
  assert.equal(verifiserPassord("hemmelig123", hash), true);
});

test("feil passord avvises", () => {
  const hash = hashPassord("hemmelig123");
  assert.equal(verifiserPassord("feil-passord", hash), false);
});

test("manglende hash avvises uten å kaste", () => {
  assert.equal(verifiserPassord("hemmelig123", null), false);
  assert.equal(verifiserPassord("hemmelig123", undefined), false);
});
