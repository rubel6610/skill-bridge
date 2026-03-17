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

const getMyBookings = async (userId: number, role: string) => {
  let bookings;
  if (role === "STUDENT") {
    bookings = await prisma.booking.findMany({
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
  } else if (role === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }
    bookings = await prisma.booking.findMany({
      where: { tutorProfileId: tutorProfile.id },
      include:{
        student:{
          select:{
            id:true,
            name:true,
            email:true
          }
        }
      },
      orderBy:{scheduledAt:"desc"}
    });
  }
  return bookings
};

const BookingServices = {
  createBooking,
  getMyBookings,
};

export default BookingServices;
