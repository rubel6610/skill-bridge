 import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { BookingService } from "./booking.service";

// ─────────────────────────────────────────
// POST /api/v1/booking
// ─────────────────────────────────────────
const createBooking = async (req: Request, res: Response) => {
   try {
      const userId = Number(req.user?.id);

      if (!userId) {
         return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized user id is missing',
            data: null,
         });
      }

      const result = await BookingService.createBookingIntoDB(userId, req.body);

      sendResponse(res, {
         statusCode: 201,
         success: true,
         message: 'Booking created. Continue to Stripe Checkout to complete payment.',
         data: result,
      });
   } catch (error: any) {
      sendResponse(res, {
         statusCode: 500,
         success: false,
         message: error.message || 'Something went wrong',
         data: null,
      });
   }
};

const createCheckoutForBooking = async (req: Request, res: Response) => {
   try {
      const bookingId = parseInt(req.params.id as string);
      const userId = Number(req.user?.id);

      if (!userId) {
         return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized user id is missing',
            data: null,
         });
      }

      if (isNaN(bookingId)) {
         return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Invalid booking id',
            data: null,
         });
      }

      const result = await BookingService.createCheckoutForBookingFromDB(
         userId,
         bookingId,
      );

      sendResponse(res, {
         statusCode: 200,
         success: true,
         message: 'Stripe checkout created successfully',
         data: result,
      });
   } catch (error: any) {
      sendResponse(res, {
         statusCode: 500,
         success: false,
         message: error.message || 'Something went wrong',
         data: null,
      });
   }
};

// ─────────────────────────────────────────
// GET /api/v1/booking
// ─────────────────────────────────────────
const getMyBookings = async (req: Request, res: Response) => {
   try {
      const userId = Number(req.user?.id);
      const role = String(req.user?.role || '');

      if (!userId) {
         return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized user id is missing',
            data: null,
         });
      }

      const result = await BookingService.getMyBookingsFromDB(userId, role);

      sendResponse(res, {
         statusCode: 200,
         success: true,
         message: 'Bookings fetched successfully',
         data: result,
      });
   } catch (error: any) {
      sendResponse(res, {
         statusCode: 500,
         success: false,
         message: error.message || 'Something went wrong',
         data: null,
      });
   }
};

// ─────────────────────────────────────────
// GET /api/v1/booking/:id
// ─────────────────────────────────────────
const getBookingById = async (req: Request, res: Response) => {
   try {
      const bookingId = parseInt(req.params.id as string);
      const userId = Number(req.user?.id);
      const role = String(req.user?.role || '');

      if (!userId) {
         return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized user id is missing',
            data: null,
         });
      }

      if (isNaN(bookingId)) {
         return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Invalid booking id',
            data: null,
         });
      }

      const result = await BookingService.getBookingByIdFromDB(bookingId, userId, role);

      sendResponse(res, {
         statusCode: 200,
         success: true,
         message: 'Booking fetched successfully',
         data: result,
      });
   } catch (error: any) {
      sendResponse(res, {
         statusCode: 404,
         success: false,
         message: error.message || 'Something went wrong',
         data: null,
      });
   }
};

// ─────────────────────────────────────────
// PATCH /api/v1/booking/:id/status
// ─────────────────────────────────────────
const updateBookingStatus = async (req: Request, res: Response) => {
   try {
      const bookingId = parseInt(req.params.id as string);
      const userId = Number(req.user?.id);
      const role = String(req.user?.role || '');
      const { status } = req.body;

      if (!userId) {
         return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized user id is missing',
            data: null,
         });
      }

      const result = await BookingService.updateBookingStatusIntoDB(
         bookingId,
         userId,
         role,
         status
      );

      sendResponse(res, {
         statusCode: 200,
         success: true,
         message: `Booking ${status.toLowerCase()} successfully`,
         data: result,
      });
   } catch (error: any) {
      sendResponse(res, {
         statusCode: 500,
         success: false,
         message: error.message || 'Something went wrong',
         data: null,
      });
   }
};




export const BookingController = {
   createBooking,
   createCheckoutForBooking,
   getMyBookings,
   getBookingById,
   updateBookingStatus,
};
