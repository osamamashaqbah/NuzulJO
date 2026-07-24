export type Role = "CUSTOMER" | "HOTEL_OWNER" | "ADMIN";
export type RoomType = "SINGLE" | "DOUBLE" | "SUITE" | "FAMILY";
export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export interface City {
  id: string;
  name: string;
  nameAr?: string | null;
}

export interface HotelImage {
  id: string;
  url: string;
  position: number;
}

export interface Amenity {
  id: string;
  key: string;
  label: string;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starRating?: number | null;
  isActive: boolean;
  city?: City | null;
  images: HotelImage[];
  amenities?: { amenity: Amenity }[]; // omitted from list endpoints (search grid, owner list) — only getHotel includes it
  rooms?: Room[];
}

export interface Room {
  id: string;
  hotelId: string;
  type: RoomType;
  name?: string | null;
  pricePerNight: string;
  capacity: number;
  status: RoomStatus;
  description?: string | null;
  images: { id: string; url: string; position: number }[];
}

export interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: string;
  status: BookingStatus;
  hotel?: Hotel;
  room?: Room;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { id: string; name: string };
}
