# OrangeBite - MERN Food Delivery Platform

OrangeBite is a full-stack food delivery application with customer, owner, delivery, and admin portals. It supports real-time order updates, payments, and delivery tracking.

## Project structure

```
mern-food-final/
  Backend/    Node.js + Express API
  Frontend/   React + Vite SPA
```

## Tech stack

Backend:
- Node.js, Express, MongoDB, Mongoose
- JWT auth, bcrypt
- Socket.IO, Razorpay, Nodemailer

Frontend:
- React, Vite, Tailwind CSS
- Redux Toolkit, Axios
- Socket.IO client, Leaflet

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas (or local MongoDB)
- Razorpay account (test mode is fine)
- Gmail account with an App Password for SMTP

## Setup

### Backend

```
cd Backend
npm install
npm start
```

Backend server: http://localhost:5000
API docs: http://localhost:5000/api-docs

### Frontend

```
cd Frontend
npm install
npm run dev
```

Frontend app: http://localhost:5173

## Environment variables

Create Backend/.env:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/FoodApp
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

ACCESS_TOKEN_SECRET=<random_32+_char_secret>
REFRESH_TOKEN_SECRET=<random_32+_char_secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>

SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=OrangeBite <no-reply@orangebite.com>
```

Create Frontend/.env:

```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

## Scripts

Backend:
- npm start (dev server with nodemon)
- npm run start:prod

Frontend:
- npm run dev
- npm run build
- npm run preview
- npm run lint
