import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { imageUpload } from "../middleware/upload";
import {
  listRoomsForHotel,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  uploadRoomImages,
} from "../controllers/roomController";

// Mounted at /api/hotels/:hotelId/rooms (mergeParams to read hotelId).
export const hotelRoomRoutes = Router({ mergeParams: true });
hotelRoomRoutes.get("/", listRoomsForHotel);
hotelRoomRoutes.post("/", requireAuth, requireRole("HOTEL_OWNER"), createRoom);

// Mounted at /api/rooms/:id for actions on a single room.
export const roomRoutes = Router();
roomRoutes.get("/:id", getRoom);
roomRoutes.patch("/:id", requireAuth, requireRole("HOTEL_OWNER"), updateRoom);
roomRoutes.delete("/:id", requireAuth, requireRole("HOTEL_OWNER"), deleteRoom);
roomRoutes.post("/:id/images", requireAuth, requireRole("HOTEL_OWNER"), imageUpload.array("images", 5), uploadRoomImages);
