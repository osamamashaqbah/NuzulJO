import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Booking } from "../types";

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function refresh() {
    api.get("/bookings/mine").then((res) => setBookings(res.data));
  }
  useEffect(refresh, []);

  async function cancel(id: string) {
    await api.patch(`/bookings/${id}/cancel`);
    refresh();
  }

  async function downloadReceipt(bookingId: string) {
    const res = await api.get(`/bookings/${bookingId}/receipt`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${bookingId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitReview(bookingId: string) {
    await api.post(`/bookings/${bookingId}/review`, { rating, comment: comment || undefined });
    setReviewFor(null);
    setComment("");
    refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">My Bookings</h1>
      <div className="space-y-4">
        {bookings.length === 0 && <p className="text-neutral-500">No bookings yet.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-neutral-100">{b.hotel?.name}</p>
                <p className="text-sm text-neutral-400">
                  {b.room?.type} · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · {b.totalPrice} JOD
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  b.status === "CONFIRMED" || b.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : b.status === "REJECTED" || b.status === "CANCELLED"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {b.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button
                onClick={() => downloadReceipt(b.id)}
                className="rounded-lg border border-white/10 px-3 py-1 text-neutral-300 hover:border-amber-400"
              >
                Download receipt
              </button>
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button onClick={() => cancel(b.id)} className="rounded-lg border border-white/10 px-3 py-1 text-red-400 hover:border-red-400">
                  Cancel
                </button>
              )}
              {b.status === "COMPLETED" && (
                <button onClick={() => setReviewFor(b.id)} className="rounded-lg border border-amber-400/50 px-3 py-1 text-amber-400 hover:bg-amber-400/10">
                  Leave a review
                </button>
              )}
            </div>
            {reviewFor === b.id && (
              <div className="mt-3 rounded-xl border border-white/10 p-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-amber-400" : "text-neutral-600"}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was your stay?"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-900 p-2 text-sm text-neutral-100"
                />
                <button onClick={() => submitReview(b.id)} className="mt-2 rounded-lg bg-amber-500 px-3 py-1 text-sm font-medium text-neutral-950">
                  Submit review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
