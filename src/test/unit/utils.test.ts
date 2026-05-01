import { describe, it, expect } from "vitest";
import { truncate, relativeTime } from "@/lib/utils";

describe("truncate", () => {
  it("returns the string unchanged when shorter than n", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns the string unchanged when exactly n characters", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends ... when longer than n", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("truncates last message preview to 60 chars", () => {
    const longMessage = "a".repeat(100);
    const result = truncate(longMessage, 60);
    expect(result).toBe("a".repeat(60) + "...");
  });
});

describe("relativeTime", () => {
  it("returns 'just now' for very recent dates", () => {
    const now = new Date();
    expect(relativeTime(now)).toBe("just now");
  });

  it("returns minutes ago for dates within the last hour", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("returns hours ago for dates within the last day", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(relativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago for dates within the last week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(relativeTime(threeDaysAgo)).toBe("3d ago");
  });

  it("accepts ISO string input", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinutesAgo)).toBe("5m ago");
  });
});
