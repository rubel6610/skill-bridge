import { Router } from "express";
import { AuthRoutes } from "./../module/auth/auth.route";
import { BookingRoutes } from "../module/booking/booking.route";

const router = Router();

const routerManager = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/bookings",
    route: BookingRoutes,
  },
];

routerManager.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
