import { describe, expect, it } from "vitest";
import { firstFreeSlot, isDancer, isDancerList, labelError, nextLabel, type Dancer } from "./dancers";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const dancer = (n: number, label = String(n)): Dancer => ({ id: id(n), label, gender: "naine" });

describe("isDancer", () => {
  it("accepts a valid dancer", () => {
    expect(isDancer({ id: id(1), label: "A1", gender: "mees" })).toBe(true);
  });

  it("rejects malformed dancers", () => {
    for (const bad of [
      null,
      "x",
      [],
      { label: "1", gender: "naine" },
      { id: "not-a-uuid", label: "1", gender: "naine" },
      { id: id(1), label: "", gender: "naine" },
      { id: id(1), label: "abcd", gender: "naine" },
      { id: id(1), label: " 1", gender: "naine" },
      { id: id(1), label: 1, gender: "naine" },
      { id: id(1), label: "1", gender: "other" },
      { id: id(1), label: "1" },
      { id: id(1), label: "1", gender: "naine", extra: true },
    ]) {
      expect(isDancer(bad)).toBe(false);
    }
  });
});

describe("isDancerList", () => {
  it("accepts an empty list and 30 dancers", () => {
    expect(isDancerList([])).toBe(true);
    expect(isDancerList(Array.from({ length: 30 }, (_, i) => dancer(i + 1)))).toBe(true);
  });

  it("rejects non-arrays, more than 30 dancers and a malformed entry", () => {
    expect(isDancerList({})).toBe(false);
    expect(isDancerList(Array.from({ length: 31 }, (_, i) => dancer(i + 1)))).toBe(false);
    expect(isDancerList([dancer(1), { id: id(2) }])).toBe(false);
  });

  it("rejects duplicate ids and labels that differ only in case", () => {
    expect(isDancerList([dancer(1, "a"), { ...dancer(1, "b") }])).toBe(false);
    expect(isDancerList([dancer(1, "a"), dancer(2, "A")])).toBe(false);
  });
});

describe("labelError", () => {
  const dancers = [dancer(1, "Ab"), dancer(2)];

  it("rejects a label another dancer has, ignoring case", () => {
    expect(labelError("aB", id(2), dancers)).not.toBeNull();
  });

  it("allows keeping or recasing the dancer's own label", () => {
    expect(labelError("AB", id(1), dancers)).toBeNull();
  });

  it("rejects empty and too long labels", () => {
    expect(labelError("", id(1), dancers)).not.toBeNull();
    expect(labelError("abcd", id(1), dancers)).not.toBeNull();
  });
});

describe("nextLabel", () => {
  it("picks the lowest unused number", () => {
    expect(nextLabel([])).toBe("1");
    expect(nextLabel([dancer(1), dancer(3)])).toBe("2");
  });
});

describe("firstFreeSlot", () => {
  it("starts at the top-left cell and skips occupied cells", () => {
    expect(firstFreeSlot([])).toEqual({ x: 1 / 12, y: 0.1 });
    // 0.1 is inside the first cell, so it blocks it
    expect(firstFreeSlot([{ x: 0.1, y: 0.1 }])).toEqual({ x: 3 / 12, y: 0.1 });
  });

  it("treats the far edges as the last cell", () => {
    const allButLast = Array.from({ length: 29 }, (_, i) => ({ x: ((i % 6) + 0.5) / 6, y: (Math.floor(i / 6) + 0.5) / 5 }));
    expect(firstFreeSlot(allButLast)).toEqual({ x: 11 / 12, y: 0.9 });
    expect(firstFreeSlot([{ x: 1, y: 1 }]).x).toBe(1 / 12);
  });
});
