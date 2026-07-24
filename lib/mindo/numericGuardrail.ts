// Concrete enforcement of "never invent a statistic": every numeral the model
// writes must already appear somewhere in the facts it was given. A prompt
// instruction alone isn't sufficient — this is the actual backstop.
export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(\.\d+)?/g) ?? [];
  return matches.map(Number);
}

// A rate like 0.86 in the facts is legitimately narrated as "86%" — the digits
// "86" never literally appear in the source value, so the allowed-set has to
// include the percentage-scaled form (and the absolute value, since deltas
// like -1.8 are narrated as "1.8 points lower" without the sign).
function addNumberVariants(allowed: Set<number>, value: number) {
  allowed.add(value);
  allowed.add(Math.abs(value));
  allowed.add(Math.round(value));
  allowed.add(Math.abs(Math.round(value)));
  allowed.add(Math.round(value * 100));
  allowed.add(Math.abs(Math.round(value * 100)));
}

export function collectAllowedNumbers(facts: unknown): Set<number> {
  const allowed = new Set<number>();
  function walk(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
      addNumberVariants(allowed, value);
    } else if (typeof value === "string") {
      for (const n of extractNumbers(value)) allowed.add(n);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  }
  walk(facts);
  return allowed;
}

export function passesNumericGuardrail(text: string, facts: unknown): boolean {
  const allowed = collectAllowedNumbers(facts);
  const found = extractNumbers(text);
  return found.every((n) => allowed.has(n));
}
