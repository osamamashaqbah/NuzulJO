import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  listUsers,
  updateUserRole,
  deleteUser,
  listAllHotels,
  setHotelActive,
  deleteHotelAdmin,
  listAllReviews,
  deleteReview,
  getReports,
} from "../controllers/adminController";

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole("ADMIN"));

adminRoutes.get("/users", listUsers);
adminRoutes.patch("/users/:id/role", updateUserRole);
adminRoutes.delete("/users/:id", deleteUser);

adminRoutes.get("/hotels", listAllHotels);
adminRoutes.patch("/hotels/:id/active", setHotelActive);
adminRoutes.delete("/hotels/:id", deleteHotelAdmin);

adminRoutes.get("/reviews", listAllReviews);
adminRoutes.delete("/reviews/:id", deleteReview);

adminRoutes.get("/reports", getReports);
