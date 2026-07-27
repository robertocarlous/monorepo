import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import zh from "../../messages/zh.json";

function getLeafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      keys.push(...getLeafKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const locales = { ar, es, fr, zh } as const;
const enKeys = new Set(getLeafKeys(en));

describe("locale key parity with en.json", () => {
  for (const [locale, messages] of Object.entries(locales)) {
    it(`${locale}.json has every key in en.json (no missing keys)`, () => {
      const localeKeys = new Set(getLeafKeys(messages));
      const missing = [...enKeys].filter((k) => !localeKeys.has(k));
      expect(missing).toEqual([]);
    });

    it(`${locale}.json has no keys absent from en.json (no stale keys)`, () => {
      const localeKeys = new Set(getLeafKeys(messages));
      const stale = [...localeKeys].filter((k) => !enKeys.has(k));
      expect(stale).toEqual([]);
    });
  }
});
