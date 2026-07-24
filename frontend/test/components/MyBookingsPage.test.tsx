import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyBookingsPage } from "../../src/pages/MyBookingsPage";
import { api } from "../../src/api/client";

vi.mock("../../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../../src/api/client")>("../../src/api/client");
  return { ...actual, api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() } };
});

const pendingBooking = {
  id: "b1",
  status: "PENDING",
  checkIn: "2027-01-10",
  checkOut: "2027-01-12",
  totalPrice: "100",
  hotel: { name: "Test Hotel" },
  room: { type: "DOUBLE" },
};

describe("MyBookingsPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it("clicking Cancel calls PATCH /bookings/:id/cancel and refreshes the list to show CANCELLED", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [pendingBooking] })
      .mockResolvedValueOnce({ data: [{ ...pendingBooking, status: "CANCELLED" }] });
    vi.mocked(api.patch).mockResolvedValue({ data: {} });

    render(<MyBookingsPage />);

    await waitFor(() => expect(screen.getByText("PENDING")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(api.patch).toHaveBeenCalledWith("/bookings/b1/cancel");
    await waitFor(() => expect(screen.getByText("CANCELLED")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no bookings", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    render(<MyBookingsPage />);
    await waitFor(() => expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument());
  });
});
