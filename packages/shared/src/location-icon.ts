import { z } from "zod";

export const locationIconSchema = z.enum([
  "pin",
  "home",
  "work",
  "food",
  "cafe",
  "shop",
  "park",
  "nature",
  "animals",
  "temple",
  "mosque",
  "landmark",
]);

export type LocationIcon = z.infer<typeof locationIconSchema>;

// Checked in order; the first match wins. Keywords match at the start of a word ("aquari" matches "Aquaria"),
// except "wat" and "eat", which must be whole words so "Water" and "Great" don't match.
const ICON_RULES: ReadonlyArray<readonly [LocationIcon, RegExp]> = [
  ["animals", /\b(?:zoo|aquari|bird park|farm)/i],
  ["mosque", /\b(?:masjid|mosque)/i],
  ["temple", /\b(?:temple|kuil|tokong|church|gereja)|\bwat\b/i],
  ["shop", /\b(?:mall|klcc|pavilion|plaza|market|pasar|shop|store)/i],
  ["cafe", /\b(?:cafe|café|coffee|kopi)/i],
  ["food", /\b(?:restaurant|food|mamak|nasi|kedai|hawker)|\beat\b/i],
  ["park", /\b(?:park|taman|garden|botani)/i],
  ["nature", /\b(?:cave|bukit|hill|gunung|falls|lake|tasik|beach|pantai)/i],
  ["landmark", /\b(?:menara|tower|square|dataran|merdeka|museum|monument|istana|palace|station)/i],
  ["home", /\b(?:home|house|rumah)/i],
  ["work", /\b(?:office|work|pejabat)/i],
];

/** The icon a location's name suggests (DESIGN: Icons), or "pin" when nothing matches. */
export function suggestLocationIcon(name: string): LocationIcon {
  for (const [icon, pattern] of ICON_RULES) {
    if (pattern.test(name)) return icon;
  }

  return "pin";
}
