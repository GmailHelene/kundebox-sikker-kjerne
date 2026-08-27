# kundebox-sikker-kjerne

Delt innloggings- og sikkerhetskjerne for Kundebox-produkter (Bedriftsflyt, ByggPilot Proff, og fremtidige produkter). Skrevet én gang, testet én gang, brukt flere steder — i stedet for at hvert produkt bygger sin egen passordhashing, sesjonshåndtering og rate-limiting fra bunnen.

## Hvorfor dette finnes

I august 2026 ble tre reelle sikkerhetshull funnet i to forskjellige produkter, alle i håndrullet innloggings-/sesjonskode: en JWT som ble lest uten signaturverifisering, manglende rate-limiting på innlogging, og en glemt "dev-innlogging"-bakdør. Alle tre var av samme type feil, gjort uavhengig i to kodebaser. Denne pakken finnes for at den typen feil skal rettes én gang, ikke gjentas neste gang det bygges et nytt produkt.

## Installasjon i et produkt

```bash
npm install github:GmailHelene/kundebox-sikker-kjerne
```

`npm install` fra GitHub bygger pakken automatisk (se `prepare`-scriptet), så du trenger ikke publisere til npm.

## Bruk

```ts
import { hashPassord, verifiserPassord, signerSesjon, verifiserSesjon, erRateLimited } from "@gronbergtech/kundebox-sikker-kjerne";

// Passord
const hash = hashPassord("hemmelig123");
verifiserPassord("hemmelig123", hash); // true

// Sesjon (JWT, fungerer i Node OG i Next.js edge middleware)
const token = await signerSesjon({ brukerId: "abc", rolle: "admin" }, process.env.SESSION_SECRET!, 60 * 60 * 8);
const payload = await verifiserSesjon(token, process.env.SESSION_SECRET!); // null hvis forfalsket/utløpt

// Rate-limiting (bruk Upstash hvis UPSTASH_REDIS_REST_URL/TOKEN er satt, ellers minnefallback)
if (await erRateLimited("login:" + epost)) {
  // avvis forsøket
}

// Enkle signerte verdier uten full JWT (f.eks. en cookie med bare en slug, eller en e-postlenke)
import { signerVerdi, verifiserVerdi, signerVerdiMedUtlop, verifiserVerdiMedUtlop } from "@gronbergtech/kundebox-sikker-kjerne";
const cookieVerdi = signerVerdi("bedrift-slug", process.env.SESSION_SECRET!);
const resetLenke = signerVerdiMedUtlop("bedrift-slug", process.env.SESSION_SECRET!, 1000 * 60 * 60); // 1 time
```

## Hva denne pakken IKKE gjør

Den lager ikke felles innlogging på tvers av produkter (ingen delt brukerdatabase, ingen SSO). Hvert produkt har fortsatt sine egne brukere og sin egen database. Denne pakken deler kun *hvordan* passord og sesjoner sikres teknisk, ikke *hvem* som er logget inn hvor.

## Oppdatere et produkt til en ny versjon

```bash
npm update @gronbergtech/kundebox-sikker-kjerne
```

Siden pakken installeres direkte fra GitHub (`main`-branchen), henter dette siste versjon fra dette repoet.
