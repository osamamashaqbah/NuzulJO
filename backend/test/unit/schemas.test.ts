import { createBookingSchema } from "../../src/controllers/bookingController";
import { registerSchema } from "../../src/controllers/authController";

describe("createBookingSchema", () => {
  it("accepts a valid future date range", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const result = createBookingSchema.safeParse({
      roomId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      checkIn: tomorrow.toISOString(),
      checkOut: dayAfter.toISOString(),
      guests: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects checkOut before or equal to checkIn", () => {
    const result = createBookingSchema.safeParse({
      roomId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      checkIn: "2026-09-05",
      checkOut: "2026-09-05",
      guests: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a checkIn date in the past", () => {
    const result = createBookingSchema.safeParse({
      roomId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      checkIn: "2020-01-01",
      checkOut: "2020-01-02",
      guests: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ name: "A B", email: "a@b.com", password: "short", role: "CUSTOMER" });
    expect(result.success).toBe(false);
  });

  it("rejects an attempt to self-register as ADMIN", () => {
    const result = registerSchema.safeParse({ name: "A B", email: "a@b.com", password: "password123", role: "ADMIN" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid CUSTOMER registration", () => {
    const result = registerSchema.safeParse({ name: "A B", email: "a@b.com", password: "password123", role: "CUSTOMER" });
    expect(result.success).toBe(true);
  });
});
