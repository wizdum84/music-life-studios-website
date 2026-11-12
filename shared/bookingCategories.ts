type CategorizedBooking = { date: Date | string; status: string };

export function categorizeBookings<T extends CategorizedBooking>(bookings: T[], now = new Date()) {
  const isFinished = (booking: T) =>
    booking.status === "completed" || booking.status === "cancelled" || new Date(booking.date) < now;

  return {
    upcoming: bookings
      .filter((booking) => !isFinished(booking))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    past: bookings
      .filter(isFinished)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    completed: bookings
      .filter((booking) => booking.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}
