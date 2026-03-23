# Library Student Management System

A complete MERN stack library management platform with JWT authentication, real-time seat reservation, attendance tracking, auto seat release, admin analytics, QR attendance cards, and optional email notifications.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Realtime: Socket.io
- Authentication: JWT

## Features

- Student signup and login with profile photo upload
- Admin login with protected dashboard
- Automatic student ID generation
- Seat creation and bulk generation for Regular, AC, Silent, and Group seats
- Real-time seat reservation with live status sync
- Booking durations for 1 hour, 2 hours, 4 hours, and full day
- Auto-release cron job that frees expired seats every minute
- Attendance check-in/check-out with total hours tracking
- No-show penalty support on expired reserved bookings
- Booking history and attendance history
- Admin analytics for occupancy and peak attendance hours
- QR code generation for attendance identity
- Optional email notifications when SMTP credentials are configured

## Project Structure

\`\`\`
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  socket/
  utils/
  uploads/
  server.js

client/
  src/
    components/
    context/
    layouts/
    pages/
    services/
    utils/
    App.jsx
\`\`\`

## Setup Guide

### 1. Install dependencies

Dependencies are already installed in this workspace. If you need to reinstall:

\`\`\`bash
cd server
npm install

cd ../client
npm install
\`\`\`

### 2. Configure environment variables

Server env is stored in \`server/.env\`.

Important values:

- \`MONGO_URI\`: MongoDB connection string
- \`JWT_SECRET\`: JWT signing secret
- \`PORT\`: backend port
- \`CLIENT_URL\`: frontend URL for CORS and Socket.io
- \`ADMIN_EMAIL\` / \`ADMIN_PASSWORD\`: default admin login
- \`NO_SHOW_PENALTY\`: penalty charged for expired reserved bookings
- \`SMTP_*\`: optional email configuration

Frontend env is stored in \`client/.env\`.

- \`VITE_API_BASE_URL\`: backend API base URL

### 3. Update MongoDB password

The current \`MONGO_URI\` still contains \`YOUR_PASSWORD\`. Replace it with your real MongoDB Atlas password before starting the backend.

### 4. Start the backend

\`\`\`bash
cd server
npm run dev
\`\`\`

The API runs on \`http://localhost:5000\`.

### 5. Start the frontend

Open a second terminal:

\`\`\`bash
cd client
npm run dev
\`\`\`

The frontend runs on \`http://localhost:5173\`.

## Default Admin Login

- Email: \`admin@library.com\`
- Password: \`Admin@123\`

Change these in \`server/.env\` for production.

## Main API Endpoints

- \`POST /api/auth/student/signup\`
- \`POST /api/auth/student/login\`
- \`POST /api/auth/admin/login\`
- \`GET /api/auth/me\`
- \`GET /api/students\`
- \`GET /api/seats\`
- \`POST /api/seats\`
- \`POST /api/seats/bulk\`
- \`GET /api/bookings\`
- \`POST /api/bookings\`
- \`PATCH /api/bookings/:id/cancel\`
- \`GET /api/attendance\`
- \`POST /api/attendance/check-in\`
- \`POST /api/attendance/check-out\`
- \`GET /api/attendance/qr/me\`
- \`GET /api/dashboard/student\`
- \`GET /api/dashboard/admin\`

## Production Notes

- Replace default secrets and admin credentials before deployment.
- Use a managed file store instead of local uploads for production.
- Configure a real SMTP provider to enable outgoing emails.
- Serve the frontend from a production build or reverse proxy.
- Add HTTPS and stronger operational monitoring for live deployment.
