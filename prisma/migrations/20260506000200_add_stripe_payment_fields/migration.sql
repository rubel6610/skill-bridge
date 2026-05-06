CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

ALTER TABLE "Booking"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';

UPDATE "Booking"
SET "paymentStatus" = 'PAID',
    "paidAt" = "createdAt"
WHERE "status" IN ('CONFIRMED', 'COMPLETED');

CREATE UNIQUE INDEX "Booking_stripeCheckoutSessionId_key" ON "Booking"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");
