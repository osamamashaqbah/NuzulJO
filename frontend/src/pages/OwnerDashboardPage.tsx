import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Booking, Hotel } from "../types";

export function OwnerDashboardPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newHotelName, setNewHotelName] = useState("");

  function refreshHotels() {
    api.get("/hotels/mine").then((res) => setHotels(res.data));
  }
  useEffect(refreshHotels, []);

  useEffect(() => {
    if (!selectedHotelId) return;
    api.get(`/bookings/hotel/${selectedHotelId}`).then((res) => setBookings(res.data));
  }, [selectedHotelId]);

  async function createHotel(e: React.FormEvent) {
    e.preventDefault();
    if (!newHotelName.trim()) return;
    await api.post("/hotels", { name: newHotelName });
    setNewHotelName("");
    refreshHotels();
  }

  async function setBookingStatus(id: string, status: "CONFIRMED" | "REJECTED" | "COMPLETED") {
    await api.patch(`/bookings/${id}/status`, { status });
    if (selectedHotelId) api.get(`/bookings/hotel/${selectedHotelId}`).then((res) => setBookings(res.data));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">Owner Dashboard</h1>

      <form onSubmit={createHotel} className="mb-6 flex gap-2">
        <input
          value={newHotelName}
          onChange={(e) => setNewHotelName(e.target.value)}
          placeholder="New hotel name"
          className="flex-1 rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        />
        <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950">
          Add Hotel
        </button>
      </form>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <h2 className="text-sm font-medium text-neutral-400">Your Hotels</h2>
          {hotels.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHotelId(h.id)}
              className={`block w-full rounded-lg border p-3 text-left text-sm ${
                selectedHotelId === h.id ? "border-amber-400 text-amber-400" : "border-white/10 text-neutral-300"
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-2">
          <h2 className="mb-2 text-sm font-medium text-neutral-400">Bookings</h2>
          {!selectedHotelId && <p className="text-sm text-neutral-500">Select a hotel to see its bookings.</p>}
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-neutral-200">
                    {b.room?.type} · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                  </span>
                  <span className="text-amber-400">{b.status}</span>
                </div>
                {b.status === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setBookingStatus(b.id, "CONFIRMED")} className="rounded-lg border border-emerald-400/50 px-3 py-1 text-xs text-emerald-400">
                      Confirm
                    </button>
                    <button onClick={() => setBookingStatus(b.id, "REJECTED")} className="rounded-lg border border-red-400/50 px-3 py-1 text-xs text-red-400">
                      Reject
                    </button>
                  </div>
                )}
                {b.status === "CONFIRMED" && (
                  <button onClick={() => setBookingStatus(b.id, "COMPLETED")} className="mt-2 rounded-lg border border-white/20 px-3 py-1 text-xs text-neutral-300">
                    Mark completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
