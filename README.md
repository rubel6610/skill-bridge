# ⚙️ MentorLink Backend

The robust API engine powering the MentorLink marketplace. Built with **Express.js** and **Prisma**, it provides secure authentication, complex booking logic, and comprehensive user management.

## 🔗 Quick Links

- **Frontend GitHub:** [https://github.com/rubel6610/mentorlink-frontend](https://github.com/rubel6610/mentorlink-frontend)
- **Backend GitHub:** [https://github.com/rubel6610/skill-bridge](https://github.com/rubel6610/skill-bridge)
- **Live Site:** [https://mentorlink-demo.vercel.app](https://mentorlink-frontend-gamma.vercel.app/) (Replace with your actual URL)
- **Backend API:** [Render](https://skill-bridge-zp3v.onrender.com) (Replace with your actual URL)


## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` 

## 🚀 Key Modules

- **Auth System:** JWT-based authentication with role-based access control (Admin, Tutor, Student).
- **Stripe Payments:** Integrated Stripe Checkout for secure student-to-platform transactions.
- **Booking Engine:** Handles session scheduling, status transitions (Pending -> Paid -> Confirmed -> Completed), and prevents double-booking.
- **Tutor Payouts:** Specialized system for admins to track and mark payouts to tutors after successful session completion.
- **Tutor Profiles:** Manages tutor metadata, pricing, and category relationships.
- **Review System:** Allows students to post verified ratings for completed sessions.
- **Admin Oversight:** Comprehensive dashboard endpoints for managing users, categories, bookings, and financial flows.

---

## 💳 Payment & Session Workflow

1.  **Booking:** Student creates a booking (Status: `PENDING`, Payment: `PENDING`).
2.  **Payment:** Student pays via Stripe Checkout. Webhook updates status to `CONFIRMED` and Payment to `PAID`.
3.  **Session:** Tutor and Student conduct the session.
4.  **Completion:** Tutor marks the session as `COMPLETED` (only if paid).
5.  **Payout:** Admin reviews completed sessions and marks them as `PAID` in the `payoutStatus` once funds are transferred to the tutor.

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Payments:** [Stripe](https://stripe.com/)
- **Validation:** [Zod](https://zod.dev/)

---

## 🏗️ Architecture

The project follows a modular architecture:
- **Routes:** Defines API endpoints.
- **Controllers:** Handles request logic.
- **Services:** Contains business logic and database interactions.
- **Middlewares:** Global error handling, authentication, and route protection.

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/rubel6610/skill-bridge.git
cd skill-bridge
npm install
```

### 2. Database Setup
Ensure you have a PostgreSQL instance running, then configure your `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mentorlink?schema=public"
CLIENT_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CURRENCY="usd"
JWT_SECRET="your_secret_key"
PORT=5000
```

### 3. Migrations & Seeding
```bash
# Run migrations
npx prisma migrate dev

# Seed initial data (Admin & Categories)
npm run seed
```

### 4. Run Server
```bash
# Development mode
npm run dev

# Build and start
npm run build
npm start
```

---

## 🛡️ Error Handling
The backend implements a **Centralized Error Handling** system:
- **Global Error Filter:** Catches all unhandled exceptions and returns structured JSON responses.
- **Zod Validation:** Ensures all incoming data meets strict schema requirements before processing.

---

## 📄 License
This project is licensed under the MIT License.
