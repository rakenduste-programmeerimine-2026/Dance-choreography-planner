import { describe, expect, it } from "vitest";
import { isUuid, parseChoreographyInput } from "./choreography-input";

describe("parseChoreographyInput", () => {
  it("accepts valid input and trims the title", () => {
    expect(parseChoreographyInput("  Valss ", "10", "8")).toEqual({
      ok: true,
      value: { title: "Valss", stageWidthM: 10, stageDepthM: 8 },
    });
  });

  it("rejects empty, whitespace-only and too long titles", () => {
    expect(parseChoreographyInput("", "10", "8").ok).toBe(false);
    expect(parseChoreographyInput("   ", "10", "8").ok).toBe(false);
    expect(parseChoreographyInput("a".repeat(101), "10", "8").ok).toBe(false);
    expect(parseChoreographyInput("a".repeat(100), "10", "8").ok).toBe(true);
  });

  it("rejects non-string input", () => {
    expect(parseChoreographyInput(null, "10", "8").ok).toBe(false);
    expect(parseChoreographyInput("x", null, "8").ok).toBe(false);
    expect(parseChoreographyInput("x", "10", 8).ok).toBe(false);
  });

  it("rejects stage sizes outside 1–50, empty or not numbers", () => {
    for (const bad of ["0.9", "51", "", " ", "abc", "NaN", "Infinity"]) {
      expect(parseChoreographyInput("x", bad, "8").ok).toBe(false);
      expect(parseChoreographyInput("x", "10", bad).ok).toBe(false);
    }
    expect(parseChoreographyInput("x", "1", "50").ok).toBe(true);
  });
});

describe("isUuid", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(isUuid("3f2b8c1e-5d4a-4e6b-9a7c-1b2d3e4f5a6b")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
