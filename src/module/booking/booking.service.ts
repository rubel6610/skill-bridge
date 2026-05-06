import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

type CreateBookingPayload = {
  tutorProfileId: number;
  scheduledAt: string;
  duration: number;
  note?: string;
};

const includeBookingDetails = {
  student: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  tutorProfile: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

const createStripeCheckoutForBooking = async (booking: {
  id: number;
  studentId: number;
  tutorProfileId: number;
  duration: number;
  totalPrice: number;
  currency: string;
  student: {
    email: string;
  };
  tutorProfile: {
    user: {
      name: string;
    };
  };
}) => {
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.student.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency,
          unit_amount: Math.round(booking.totalPrice * 100),
          product_data: {
            name: `Session with ${booking.tutorProfile.user.name}`,
            description: `${booking.duration} minute tutoring session`,
          },
        },
      },
    ],
    metadata: {
      bookingId: String(booking.id),
      studentId: String(booking.studentId),
      tutorProfileId: String(booking.tutorProfileId),
    },
    payment_intent_data: {
      metadata: {
        bookingId: String(booking.id),
        studentId: String(booking.studentId),
        tutorProfileId: String(booking.tutorProfileId),
      },
    },
    success_url: `${config.client_url}/student/bookings?payment=success&bookingId=${booking.id}`,
    cancel_url: `${config.client_url}/tutors/${booking.tutorProfileId}?payment=cancelled&bookingId=${booking.id}`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return checkoutSession;
};

const createBookingIntoDB = async (
  userId: number,
  payload: CreateBookingPayload,
) => {
  if (!payload.tutorProfileId || !payload.scheduledAt || !payload.duration) {
    throw new Error("Tutor, schedule time, and duration are required");
  }

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: Number(payload.tutorProfileId) },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!tutorProfile) {
    throw new Error("Tutor not found");
  }

  if (tutorProfile.userId === userId) {
    throw new Error("You cannot book yourself");
  }

  const totalPrice = Number(
    ((tutorProfile.hourlyRate / 60) * Number(payload.duration)).toFixed(2),
  );
  const currency = (config.stripe_currency || "usd").toLowerCase();

  const booking = await prisma.booking.create({
    data: {
      studentId: userId,
      tutorProfileId: Number(payload.tutorProfileId),
      scheduledAt: new Date(payload.scheduledAt),
      duration: Number(payload.duration),
      totalPrice,
      currency,
      note: payload.note?.trim() || null,
      status: "PENDING",
      paymentStatus: "PENDING",
    },
    include: includeBookingDetails,
  });

  const checkoutSession = await createStripeCheckoutForBooking(booking);

  const bookingWithPayment = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      stripeCheckoutSessionId: checkoutSession.id,
    },
    include: includeBookingDetails,
  });

  return {
    booking: bookingWithPayment,
    checkoutUrl: checkoutSession.url,
    paymentUrl: checkoutSession.url,
  };
};

const createCheckoutForBookingFromDB = async (
  userId: number,
  bookingId: number,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: includeBookingDetails,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.studentId !== userId) {
    throw new Error("You are not authorized to pay for this booking");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("Cancelled bookings cannot be paid");
  }

  if (booking.paymentStatus === "PAID") {
    throw new Error("This booking is already paid");
  }

  // Ensure currency is set if missing (for legacy data)
  if (!booking.currency) {
     const currency = (config.stripe_currency || "usd").toLowerCase();
     await prisma.booking.update({
        where: { id: booking.id },
        data: { currency }
     });
     (booking as any).currency = currency;
  }

  const checkoutSession = await createStripeCheckoutForBooking(booking as any);

  const bookingWithPayment = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      stripeCheckoutSessionId: checkoutSession.id,
      paymentStatus: "PENDING",
      status: "PENDING",
    },
    include: includeBookingDetails,
  });

  return {
    booking: bookingWithPayment,
    checkoutUrl: checkoutSession.url,
    paymentUrl: checkoutSession.url,
  };
};

const confirmPaidBooking = async (params: {
  bookingId?: number;
  checkoutSessionId?: string;
  paymentIntentId?: string;
}) => {
  if (!params.bookingId && !params.checkoutSessionId && !params.paymentIntentId) {
    return null;
  }

  return prisma.booking.update({
    where: params.bookingId
      ? { id: params.bookingId }
      : params.checkoutSessionId
        ? { stripeCheckoutSessionId: params.checkoutSessionId }
        : { stripePaymentIntentId: params.paymentIntentId! },
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      stripeCheckoutSessionId: params.checkoutSessionId,
      stripePaymentIntentId: params.paymentIntentId,
      paidAt: new Date(),
    },
  });
};

const markBookingPaymentFailed = async (params: {
  bookingId?: number;
  paymentIntentId: string;
}) => {
  return prisma.booking.updateMany({
    where: params.bookingId
      ? { id: params.bookingId }
      : { stripePaymentIntentId: params.paymentIntentId },
    data: {
      paymentStatus: "FAILED",
      status: "CANCELLED",
    },
  });
};

const getMyBookingsFromDB = async (userId: number, role: string) => {
  if (role === "STUDENT") {
    return prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  if (role === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    return prisma.booking.findMany({
      where: {
        tutorProfileId: tutorProfile.id,
        paymentStatus: "PAID",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  return [];
};

const getBookingByIdFromDB = async (
  bookingId: number,
  userId: number,
  role: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: includeBookingDetails,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (role === "STUDENT" && booking.studentId !== userId) {
    throw new Error("You are not authorized to view this booking");
  }

  if (role === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!tutorProfile || booking.tutorProfileId !== tutorProfile.id) {
      throw new Error("You are not authorized to view this booking");
    }
  }

  return booking;
};

const updateBookingStatusIntoDB = async (
  bookingId: number,
  userId: number,
  role: string,
  status: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (status === "COMPLETED" && role !== "TUTOR") {
    throw new Error("Only tutor can mark booking as completed");
  }

  if (status === "CANCELLED" && role !== "STUDENT") {
    throw new Error("Only student can cancel booking");
  }

  if (booking.paymentStatus !== "PAID" && status === "COMPLETED") {
    throw new Error("Only paid bookings can be completed");
  }

  if (!["CONFIRMED", "PENDING"].includes(booking.status)) {
    throw new Error(`Booking is already ${booking.status}`);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as any },
  });
};

export const BookingService = {
  createBookingIntoDB,
  createCheckoutForBookingFromDB,
  confirmPaidBooking,
  markBookingPaymentFailed,
  getMyBookingsFromDB,
  getBookingByIdFromDB,
  updateBookingStatusIntoDB,
};
