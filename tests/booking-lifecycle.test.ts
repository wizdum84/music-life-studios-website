import { describe, expect, it } from "vitest";
import { getBookingEndTime, hasBookingEnded } from "../server/services/booking-lifecycle";

describe("booking lifecycle timing", () => {
  const booking = {
    date: new Date("2026-11-10T18:00:00.000Z"),
    duration: 120,
  };

  it("uses the scheduled end time instead of the start time", () => {
    expect(getBookingEndTime(booking).toISOString()).toBe("2026-11-10T20:00:00.000Z");
    expect(hasBookingEnded(booking, new Date("2026-11-10T19:59:59.000Z"))).toBe(false);
  });

  it("becomes eligible at the scheduled end time", () => {
    expect(hasBookingEnded(booking, new Date("2026-11-10T20:00:00.000Z"))).toBe(true);
  });
});
