import { describe, expect, it } from "vitest";
import { categorizeBookings } from "../shared/bookingCategories";

describe("customer booking categories", () => {
  const now = new Date("2026-11-11T12:00:00Z");

  it("moves a completed future-dated booking out of upcoming and into history", () => {
    const futureCompleted = { id: 19, date: "2026-11-12T18:00:00Z", status: "completed" };
    const result = categorizeBookings([futureCompleted], now);
    expect(result.upcoming).toEqual([]);
    expect(result.past).toEqual([futureCompleted]);
    expect(result.completed).toEqual([futureCompleted]);
  });

  it("keeps an active future booking upcoming", () => {
    const futureConfirmed = { id: 20, date: "2026-11-12T18:00:00Z", status: "confirmed" };
    expect(categorizeBookings([futureConfirmed], now).upcoming).toEqual([futureConfirmed]);
  });

  it("keeps cancelled and elapsed bookings out of upcoming", () => {
    const cancelled = { id: 21, date: "2026-11-13T18:00:00Z", status: "cancelled" };
    const elapsed = { id: 22, date: "2026-11-10T18:00:00Z", status: "confirmed" };
    const result = categorizeBookings([cancelled, elapsed], now);
    expect(result.upcoming).toEqual([]);
    expect(result.past.map((booking) => booking.id)).toEqual([21, 22]);
    expect(result.completed).toEqual([]);
  });
});
