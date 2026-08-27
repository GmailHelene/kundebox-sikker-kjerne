// Strukturert innloggingssesjon som ekte JWT, signert og verifisert med
// `jose` (fungerer i både vanlig Node og Next.js edge middleware, i
// motsetning til `jsonwebtoken` som krever Node sitt crypto-modul).
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type SesjonsPayload = JWTPayload & {
  rolle?: string;
  [key: string]: unknown;
};

function noekkel(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Signerer en ny sesjon. `levetidSek` er f.eks. 60*60*8 for 8 timer. */
export async function signerSesjon(
  payload: SesjonsPayload,
  secret: string,
  levetidSek: number
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + levetidSek)
    .sign(noekkel(secret));
}

/**
 * Verifiserer en sesjon (ekte signaturkontroll, ikke bare avkoding).
 * Returnerer payload, eller null hvis token mangler, er forfalsket, eller utløpt.
 * Kaster ALDRI — trygt å kalle uten try/catch rundt hvert kall.
 */
export async function verifiserSesjon(
  token: string | null | undefined,
  secret: string
): Promise<SesjonsPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SesjonsPayload>(token, noekkel(secret));
    return payload;
  } catch {
    return null;
  }
}
