import express from 'express';
import { AdminController } from './admin.controller';
import auth, { userRole } from '../../middlewares/auth';

const router = express.Router();

// 🔒   route ADMIN token  
router.use(auth(userRole.ADMIN));

// Users
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id', AdminController.updateUserStatus);

// Categories
router.get('/categories', AdminController.getAllCategories);
router.post('/categories', AdminController.createCategory);
router.delete('/categories/:id', AdminController.deleteCategory);

// Bookings
router.get('/bookings', AdminController.getAllBookings);
router.patch('/bookings/:id/payment', AdminController.updateBookingPaymentStatus);
router.patch('/bookings/:id/payout', AdminController.payoutToTutor);

export const AdminRoutes = router;