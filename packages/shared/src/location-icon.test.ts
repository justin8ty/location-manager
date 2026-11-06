import { describe, expect, it } from "vitest";
import { type LocationIcon, suggestLocationIcon } from "./location-icon";

describe("suggestLocationIcon", () => {
  it.each<[string, LocationIcon]>([
    // Earlier rules win when several match.
    ["Bird Park", "animals"],
    // Case doesn't matter.
    ["SURIA KLCC", "shop"],
    // Keywords match at the start of a word, not inside one.
    ["Aquaria KLCC", "animals"],
    ["Small World", "pin"],
    // "wat" and "eat" must be whole words.
    ["Wat Phra Kaew", "temple"],
    ["Water Garden", "park"],
    ["Eat Street", "food"],
    ["Great Wall", "pin"],
  ])("suggests %s → %s", (name, icon) => {
    expect(suggestLocationIcon(name)).toBe(icon);
  });
});
