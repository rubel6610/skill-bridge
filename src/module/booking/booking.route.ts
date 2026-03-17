import { Router } from "express";
import BookingController from "./booking.controller";
import auth, { userRole } from "../../middleware/auth";

const router = Router();

router.post("/", auth([userRole.STUDENT]), BookingController.createBookings);
router.get("/",auth([userRole.STUDENT]), BookingController.getMyBookings)

export const BookingRoutes = router;
