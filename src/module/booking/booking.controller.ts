import { RequestHandler } from "express";
import sendResponse from "../../utils/sendResponse";
import BookingServices from "./booking.service";

const createBooking: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await BookingServices.createBooking(userId, req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Booking created Successfully",
      data: result,
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error instanceof Error ? error.message : "something went wrong",
      data: null,
    });
  }
};

const BookingController = {
    createBooking
}


export default BookingController;