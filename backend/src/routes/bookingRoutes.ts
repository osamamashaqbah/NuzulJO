import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createBooking,
  listMyBookings,
  listHotelBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingReceipt,
} from "../controllers/bookingController";

export const bookingRoutes = Router();

bookingRoutes.post("/", requireAuth, requireRole("CUSTOMER"), createBooking);
bookingRoutes.get("/mine", requireAuth, requireRole("CUSTOMER"), listMyBookings);
bookingRoutes.get("/hotel/:hotelId", requireAuth, requireRole("HOTEL_OWNER"), listHotelBookings);
bookingRoutes.patch("/:id/status", requireAuth, requireRole("HOTEL_OWNER"), updateBookingStatus);
bookingRoutes.patch("/:id/cancel", requireAuth, requireRole("CUSTOMER"), cancelBooking);
bookingRoutes.get("/:id/receipt", requireAuth, getBookingReceipt);
