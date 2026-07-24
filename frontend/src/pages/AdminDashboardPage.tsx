import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Hotel, Review, User } from "../types";

interface Reports {
  userCount: number;
  hotelCount: number;
  bookingCount: number;
  totalRevenue: number;
  bookingsByStatus: Record<string, number>;
}

export function AdminDashboardPage() {
  const [tab, setTab] = useState<"reports" | "users" | "hotels" | "reviews">("reports");
  const [reports, setReports] = useState<Reports | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (tab === "reports") api.get("/admin/reports").then((r) => setReports(r.data));
    if (tab === "users") api.get("/admin/users").then((r) => setUsers(r.data));
    if (tab === "hotels") api.get("/admin/hotels").then((r) => setHotels(r.data));
    if (tab === "reviews") api.get("/admin/reviews").then((r) => setReviews(r.data));
  }, [tab]);

  async function toggleHotelActive(hotel: Hotel) {
    await api.patch(`/admin/hotels/${hotel.id}/active`, { isActive: !hotel.isActive });
    api.get("/admin/hotels").then((r) => setHotels(r.data));
  }

  async function deleteReview(id: string) {
    await api.delete(`/admin/reviews/${id}`);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">Admin Dashboard</h1>
      <div className="mb-6 flex gap-2 text-sm">
        {(["reports", "users", "hotels", "reviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1 capitalize ${tab === t ? "border-amber-400 text-amber-400" : "border-white/10 text-neutral-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "reports" && reports && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Users", reports.userCount],
            ["Hotels", reports.hotelCount],
            ["Bookings", reports.bookingCount],
            ["Revenue (JOD)", reports.totalRevenue],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">{value}</p>
              <p className="text-sm text-neutral-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm">
              <span className="text-neutral-200">
                {u.name} <span className="text-neutral-500">({u.email})</span>
              </span>
              <span className="text-amber-400">{u.role}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "hotels" && (
        <div className="space-y-2">
          {hotels.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm">
              <span className="text-neutral-200">{h.name}</span>
              <button
                onClick={() => toggleHotelActive(h)}
                className={`rounded-lg border px-3 py-1 text-xs ${h.isActive ? "border-emerald-400/50 text-emerald-400" : "border-red-400/50 text-red-400"}`}
              >
                {h.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm">
              <span className="text-neutral-200">
                {r.user.name}: {"★".repeat(r.rating)} {r.comment}
              </span>
              <button onClick={() => deleteReview(r.id)} className="rounded-lg border border-red-400/50 px-3 py-1 text-xs text-red-400">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
