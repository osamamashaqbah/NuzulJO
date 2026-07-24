import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { imageUpload } from "../middleware/upload";
import {
  listHotels,
  getHotel,
  listMyHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImages,
} from "../controllers/hotelController";

export const hotelRoutes = Router();

hotelRoutes.get("/", listHotels);
hotelRoutes.get("/mine", requireAuth, requireRole("HOTEL_OWNER"), listMyHotels);
hotelRoutes.get("/:id", getHotel);

hotelRoutes.post("/", requireAuth, requireRole("HOTEL_OWNER"), createHotel);
hotelRoutes.patch("/:id", requireAuth, requireRole("HOTEL_OWNER"), updateHotel);
hotelRoutes.delete("/:id", requireAuth, requireRole("HOTEL_OWNER"), deleteHotel);

hotelRoutes.post(
  "/:id/images",
  requireAuth,
  requireRole("HOTEL_OWNER"),
  imageUpload.array("images", 8),
  uploadHotelImages,
);
