import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { shouldUse3D } from "../../src/components/Hero3D";

function setViewportWidth(w: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: w });
}
function setHardwareConcurrency(n: number | undefined) {
  Object.defineProperty(navigator, "hardwareConcurrency", { writable: true, configurable: true, value: n });
}
function setReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("shouldUse3D", () => {
  const originalWidth = window.innerWidth;
  const originalConcurrency = navigator.hardwareConcurrency;

  afterEach(() => {
    setViewportWidth(originalWidth);
    setHardwareConcurrency(originalConcurrency);
    setReducedMotion(false);
  });

  beforeEach(() => {
    setReducedMotion(false);
    setHardwareConcurrency(8);
    setViewportWidth(1280);
  });

  it("is true on a capable desktop viewport", () => {
    expect(shouldUse3D()).toBe(true);
  });

  it("is false below the 640px mobile breakpoint", () => {
    setViewportWidth(375);
    expect(shouldUse3D()).toBe(false);
  });

  it("is true right at the 640px boundary", () => {
    setViewportWidth(640);
    expect(shouldUse3D()).toBe(true);
  });

  it("is false on a weak device (fewer than 4 cores)", () => {
    setHardwareConcurrency(2);
    expect(shouldUse3D()).toBe(false);
  });

  it("is false when the user prefers reduced motion", () => {
    setReducedMotion(true);
    expect(shouldUse3D()).toBe(false);
  });
});
