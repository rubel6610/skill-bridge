import cors from "cors";
import express from "express";

import config from "./config";
import { stripe } from "./lib/stripe";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import auth, { userRole } from "./middlewares/auth";
import notFound from "./middlewares/notFound";
import { BookingController } from "./module/booking/booking.controller";
import { BookingService } from "./module/booking/booking.service";
import router from "./routes";

const app = express();

type StripeWebhookEvent = ReturnType<typeof stripe.webhooks.constructEvent>;
type CheckoutSessionWebhookObject = {
  id: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id: string } | null;
};
type PaymentIntentWebhookObject = {
  id: string;
  metadata?: Record<string, string> | null;
};

app.use(cors());

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string | undefined;

    if (!signature || !config.stripe_webhook_secret) {
      return res.status(400).send("Stripe webhook signature is missing");
    }

    let event: StripeWebhookEvent;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        config.stripe_webhook_secret,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook verification failed";
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as CheckoutSessionWebhookObject;
          const bookingId = Number(session.metadata?.bookingId);
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          await BookingService.confirmPaidBooking({
            bookingId,
            checkoutSessionId: session.id,
            paymentIntentId,
          });
          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as PaymentIntentWebhookObject;
          const bookingId = Number(paymentIntent.metadata?.bookingId);

          await BookingService.confirmPaidBooking({
            bookingId,
            paymentIntentId: paymentIntent.id,
          });
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as PaymentIntentWebhookObject;
          const bookingId = Number(paymentIntent.metadata?.bookingId);
          await BookingService.markBookingPaymentFailed({
            bookingId,
            paymentIntentId: paymentIntent.id,
          });
          break;
        }

        default:
          break;
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook handler failed";
      return res.status(500).json({ success: false, message });
    }
  },
);

app.use(express.json());

app.post(
  "/api/payment/checkout/:id",
  auth(userRole.STUDENT),
  BookingController.createCheckoutForBooking,
);
app.post(
  "/api/booking/checkout/:id",
  auth(userRole.STUDENT),
  BookingController.createCheckoutForBooking,
);
app.post(
  "/api/booking/:id/checkout",
  auth(userRole.STUDENT),
  BookingController.createCheckoutForBooking,
);

app.use("/api", router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
