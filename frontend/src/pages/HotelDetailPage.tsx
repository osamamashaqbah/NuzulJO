import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ImageGallery3D } from "../components/ImageGallery3D";
import type { Hotel, Review, Room } from "../types";

// Default Leaflet marker assets don't resolve correctly through bundlers; point at the CDN copies instead.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/hotels/${id}`).then((res) => setHotel(res.data));
    api.get(`/hotels/${id}/reviews`).then((res) => setReviews(res.data));
  }, [id]);

  async function bookRoom() {
    if (!selectedRoom || !checkIn || !checkOut) return;
    setMessage("");
    try {
      await api.post("/bookings", { roomId: selectedRoom.id, checkIn, checkOut, guests });
      setMessage("Booking requested! Check My Bookings for status.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMessage(typeof msg === "string" ? msg : "Could not book this room.");
    }
  }

  if (!hotel) return <p className="py-20 text-center text-neutral-500">Loading...</p>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-neutral-100">{hotel.name}</h1>
      <p className="mt-1 text-neutral-400">
        {hotel.city?.name} {avgRating && `· ★ ${avgRating} (${reviews.length} reviews)`}
      </p>

      {hotel.images.length > 0 && (
        <div className="mt-6">
          <ImageGallery3D images={hotel.images.map((i) => i.url)} alt={hotel.name} />
        </div>
      )}

      <p className="mt-6 max-w-3xl text-neutral-300">{hotel.description}</p>

      {hotel.amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hotel.amenities.map((a) => (
            <span key={a.amenity.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300">
              {a.amenity.label}
            </span>
          ))}
        </div>
      )}

      {hotel.latitude && hotel.longitude && (
        <div className="mt-8 h-80 overflow-hidden rounded-2xl border border-white/10">
          <MapContainer center={[hotel.latitude, hotel.longitude]} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[hotel.latitude, hotel.longitude]} icon={markerIcon}>
              <Popup>{hotel.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <h2 className="mt-10 text-xl font-semibold text-neutral-100">Rooms</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {hotel.rooms?.map((room) => (
          <div
            key={room.id}
            className={`rounded-2xl border p-4 ${selectedRoom?.id === room.id ? "border-amber-400" : "border-white/10"} ${
              room.status !== "AVAILABLE" ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize text-neutral-100">{room.type.toLowerCase()}</span>
              <span className="text-amber-400">{room.pricePerNight} JOD/night</span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">Up to {room.capacity} guests · {room.status}</p>
            {user?.role === "CUSTOMER" && room.status === "AVAILABLE" && (
              <button
                onClick={() => setSelectedRoom(room)}
                className="mt-3 rounded-lg border border-amber-400/50 px-3 py-1 text-sm text-amber-400 hover:bg-amber-400/10"
              >
                {selectedRoom?.id === room.id ? "Selected" : "Select"}
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h3 className="font-medium text-neutral-100">Book {selectedRoom.type.toLowerCase()} room</h3>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-neutral-400">
              Check-in
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-neutral-100" />
            </label>
            <label className="text-sm text-neutral-400">
              Check-out
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 block rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-neutral-100" />
            </label>
            <label className="text-sm text-neutral-400">
              Guests
              <input
                type="number"
                min={1}
                max={selectedRoom.capacity}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 block w-20 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-neutral-100"
              />
            </label>
            <button onClick={bookRoom} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400">
              Book now
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-neutral-300">{message}</p>}
        </div>
      )}

      {!user && <p className="mt-6 text-sm text-neutral-500">Log in as a guest to book a room.</p>}

      <h2 className="mt-10 text-xl font-semibold text-neutral-100">Reviews</h2>
      <div className="mt-4 space-y-3">
        {reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-200">{r.user.name}</span>
              <span className="text-amber-400">{"★".repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-neutral-400">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
