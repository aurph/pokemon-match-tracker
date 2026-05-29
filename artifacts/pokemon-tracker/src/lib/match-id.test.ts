import { describe, it, expect } from "vitest";
import { slugifyEvent, dateStamp, buildMatchId } from "./match-id";

describe("slugifyEvent", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyEvent("League Cup")).toBe("league-cup");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugifyEvent("Online — Tournament!")).toBe("online-tournament");
  });
});

describe("dateStamp", () => {
  it("formats a local YYYYMMDD", () => {
    const ms = new Date(2026, 4, 25, 9, 0, 0).getTime();
    expect(dateStamp(ms)).toBe("20260525");
  });
});

describe("buildMatchId", () => {
  it("joins slug, date, and counter", () => {
    const ms = new Date(2026, 4, 25, 9, 0, 0).getTime();
    expect(buildMatchId("League Cup", ms, 2)).toBe("league-cup-20260525-2");
  });
});
