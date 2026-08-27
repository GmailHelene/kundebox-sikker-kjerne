// Rate-limiting med hardt tak via Upstash Redis når konfigurert (delt på tvers
// av server-instanser), ellers best-effort i minnet per instans. Samme mønster
// Bedriftsflyt allerede brukte, nå delt slik alle produkter får det gratis.
//
// Upstash-avhengighetene er valgfrie (optionalDependencies i package.json).
// Uten dem, eller uten UPSTASH_REDIS_REST_URL/TOKEN satt, brukes minnefallback.

type Limiter = { limit: (id: string) => Promise<{ success: boolean }> };

let limiter: Limiter | null = null;
let forsokt = false;

async function hentLimiter(prefix: string): Promise<Limiter | null> {
  if (forsokt) return limiter;
  forsokt = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(12, "1 m"),
      prefix,
    }) as unknown as Limiter;
  } catch {
    // Upstash-pakkene er ikke installert i dette prosjektet — bruk minnefallback.
    limiter = null;
  }
  return limiter;
}

const bucket = new Map<string, { count: number; resetAt: number }>();

function minnebasertGrense(id: string, grense: number, vindusMs: number): boolean {
  const now = Date.now();
  const e = bucket.get(id);
  if (!e || now > e.resetAt) {
    bucket.set(id, { count: 1, resetAt: now + vindusMs });
    return false;
  }
  e.count += 1;
  return e.count > grense;
}

/**
 * Returnerer true hvis `id` (f.eks. "login:"+ip eller "login:"+epost) har
 * gjort for mange forsøk. Standard: 12 forsøk per minutt. Kall dette FØRST i
 * enhver rute som håndterer innlogging, betaling, eller andre ting noen kan
 * misbruke ved å prøve mange ganger raskt.
 */
export async function erRateLimited(
  id: string,
  opts: { grense?: number; vindusMs?: number; prefix?: string } = {}
): Promise<boolean> {
  const grense = opts.grense ?? 12;
  const vindusMs = opts.vindusMs ?? 60_000;
  const l = await hentLimiter(opts.prefix ?? "kbx");
  if (l) {
    const { success } = await l.limit(id);
    return !success;
  }
  return minnebasertGrense(id, grense, vindusMs);
}
