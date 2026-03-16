import { describe, it, expect } from "vitest";
import { createSeededRandom, getDailySeed } from "../daily";

describe("createSeededRandom", () => {
  it("produces deterministic sequence from same seed", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences from different seeds", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(54321);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it("returns values between 0 and 1", () => {
    const rng = createSeededRandom(99999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("getDailySeed", () => {
  it("returns same seed for same date", () => {
    const s1 = getDailySeed(new Date("2026-03-16"));
    const s2 = getDailySeed(new Date("2026-03-16"));
    expect(s1).toBe(s2);
  });

  it("returns different seed for different dates", () => {
    const s1 = getDailySeed(new Date("2026-03-16"));
    const s2 = getDailySeed(new Date("2026-03-17"));
    expect(s1).not.toBe(s2);
  });
});
