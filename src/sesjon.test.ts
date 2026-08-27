import { test } from "node:test";
import assert from "node:assert/strict";
import { signerSesjon, verifiserSesjon } from "./sesjon.js";

test("gyldig sesjon verifiseres og gir riktig payload", async () => {
  const token = await signerSesjon({ rolle: "admin", brukerId: "123" }, "hemmelig", 60);
  const payload = await verifiserSesjon(token, "hemmelig");
  assert.equal(payload?.rolle, "admin");
  assert.equal(payload?.brukerId, "123");
});

test("forfalsket sesjon avvises uten å kaste", async () => {
  const token = await signerSesjon({ rolle: "admin" }, "hemmelig-a", 60);
  const payload = await verifiserSesjon(token, "hemmelig-b");
  assert.equal(payload, null);
});

test("utløpt sesjon avvises", async () => {
  const token = await signerSesjon({ rolle: "admin" }, "hemmelig", -1);
  const payload = await verifiserSesjon(token, "hemmelig");
  assert.equal(payload, null);
});

test("manglende token gir null, ikke krasj", async () => {
  assert.equal(await verifiserSesjon(null, "hemmelig"), null);
  assert.equal(await verifiserSesjon(undefined, "hemmelig"), null);
});
