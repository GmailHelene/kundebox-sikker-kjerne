import { test } from "node:test";
import assert from "node:assert/strict";
import { signerVerdi, verifiserVerdi, signerVerdiMedUtlop, verifiserVerdiMedUtlop } from "./hmac.js";

test("signert verdi verifiseres riktig", () => {
  const token = signerVerdi("min-slug", "hemmelig");
  assert.equal(verifiserVerdi(token, "hemmelig"), "min-slug");
});

test("forfalsket verdi avvises", () => {
  const token = signerVerdi("min-slug", "hemmelig");
  const forfalsket = token.replace("min-slug", "annen-slug");
  assert.equal(verifiserVerdi(forfalsket, "hemmelig"), null);
});

test("feil hemmelighet avvises", () => {
  const token = signerVerdi("min-slug", "hemmelig-a");
  assert.equal(verifiserVerdi(token, "hemmelig-b"), null);
});

test("verdi med utløp fungerer innenfor levetiden", () => {
  const token = signerVerdiMedUtlop("min-slug", "hemmelig", 60_000);
  assert.equal(verifiserVerdiMedUtlop(token, "hemmelig"), "min-slug");
});

test("verdi med utløp avvises etter levetiden", () => {
  const token = signerVerdiMedUtlop("min-slug", "hemmelig", -1);
  assert.equal(verifiserVerdiMedUtlop(token, "hemmelig"), null);
});
