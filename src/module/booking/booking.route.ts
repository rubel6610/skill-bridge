import { Router } from "express";
import BookingController from "./booking.controller";
import auth, { userRole } from "../../middleware/auth";

const router = Router();

router.post("/", auth([userRole.STUDENT]), BookingController.createBooking);

export const BookingRoutes = router;
