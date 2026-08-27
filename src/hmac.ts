// Generisk HMAC-signert verdi: "data.signatur", timing-safe verifisering.
// Dekker det Bedriftsflyt tidligere løste tre ganger separat (signerSlug,
// signerBooking, signerReset): en verdi som ikke skal kunne forfalskes,
// med eller uten utløpstid.
import crypto from "node:crypto";

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function timingSafeLik(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Signerer en verdi uten utløpstid, f.eks. en slug i en cookie. */
export function signerVerdi(verdi: string, secret: string): string {
  return `${verdi}.${sign(verdi, secret)}`;
}

/** Verifiserer en verdi signert med signerVerdi(). Returnerer null hvis ugyldig. */
export function verifiserVerdi(token: string | null | undefined, secret: string): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const verdi = token.slice(0, i);
  const sig = token.slice(i + 1);
  return timingSafeLik(sig, sign(verdi, secret)) ? verdi : null;
}

/** Signerer en verdi MED utløpstid, f.eks. en lenke for tilbakestilling av passord. */
export function signerVerdiMedUtlop(verdi: string, secret: string, levetidMs: number): string {
  const utlop = Date.now() + levetidMs;
  const data = `${verdi}|${utlop}`;
  const dataB64 = Buffer.from(data).toString("base64url");
  return `${dataB64}.${sign(data, secret)}`;
}

/** Verifiserer en verdi signert med signerVerdiMedUtlop(). Returnerer null hvis ugyldig ELLER utløpt. */
export function verifiserVerdiMedUtlop(token: string | null | undefined, secret: string): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const dataB64 = token.slice(0, i);
  const sig = token.slice(i + 1);
  let data: string;
  try {
    data = Buffer.from(dataB64, "base64url").toString();
  } catch {
    return null;
  }
  if (!timingSafeLik(sig, sign(data, secret))) return null;
  const skille = data.lastIndexOf("|");
  if (skille < 1) return null;
  const verdi = data.slice(0, skille);
  const utlopStr = data.slice(skille + 1);
  if (!utlopStr || Date.now() > Number(utlopStr)) return null;
  return verdi;
}
