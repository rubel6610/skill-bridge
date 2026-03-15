import { prisma } from "../../lib/prisma";

const createBooking = async (userId: number, payload: any) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: payload.tutorProfile.id },
  });
  if (!tutorProfile) {
    throw new Error("Tutor not Found");
  }
  if (tutorProfile.userId === userId) {
    throw new Error("you can't book yourself");
  }
  const totalPrice = (tutorProfile.hourlyRate / 60) * payload.duration;

  const booking = await prisma.booking.create({
    data: {
      studentId: userId,
      tutorProfileId: payload.tutorProfileId,
      scheduledAt: new Date(payload.scheduledAt),
      duration: payload.duration,
      totalPrice: totalPrice,
      note: payload.note || null,
      status: "CONFIRMED",
    },
    include: {
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
    },
  });
  return booking;
};

const BookingServices = {
  createBooking,
};

export default BookingServices;
