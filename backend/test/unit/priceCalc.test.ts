// Mirrors the calculation in src/controllers/bookingController.ts createBooking():
// nights = ceil((checkOut - checkIn) / day), totalPrice = pricePerNight * nights.
function calcTotal(pricePerNight: number, checkIn: Date, checkOut: Date) {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return pricePerNight * nights;
}

describe("booking price calculation", () => {
  it("charges one night's price for a single night", () => {
    expect(calcTotal(50, new Date("2026-08-01"), new Date("2026-08-02"))).toBe(50);
  });

  it("charges price * nights for a multi-night stay", () => {
    expect(calcTotal(50, new Date("2026-08-01"), new Date("2026-08-05"))).toBe(200);
  });

  it("rounds up a partial day to a full extra night", () => {
    const checkIn = new Date("2026-08-01T10:00:00Z");
    const checkOut = new Date("2026-08-02T14:00:00Z"); // 1 day 4 hours
    expect(calcTotal(50, checkIn, checkOut)).toBe(100); // ceil(1.16..) = 2 nights
  });
});
