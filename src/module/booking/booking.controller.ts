import { RequestHandler } from "express";
import sendResponse from "../../utils/sendResponse";
import BookingServices from "./booking.service";

const createBookings: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await BookingServices.createBooking(userId, req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Booking created Successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      data: null,
    });
  }
};

const getMyBookings: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await BookingServices.getMyBookings(userId, role);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Fetched Bookings successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      data: null,
    });
  }
};

const BookingController = {
  createBookings,
  getMyBookings,
};

export default BookingController;
