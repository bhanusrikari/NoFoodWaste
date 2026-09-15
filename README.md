# NoFoodWaste - Food Donation & Redistribution Management System

## Overview
NoFoodWaste is a MERN stack application designed to streamline food donation and redistribution.

## Architecture
The repository strictly enforces a physical separation between the frontend and backend:
- `client/`: React + Vite frontend ONLY.
- `server/`: Node.js / Express backend ONLY.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### Setup & Installation

#### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Update .env with your MONGODB_URI, JWT_SECRET, etc.
npm run dev # or npm start
```
The backend server runs on `http://localhost:5000`.

#### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend application runs on `http://localhost:5173`.

## Authentication & Authorization (Phase 1)
Supported Roles:
- `DONOR`
- `VOLUNTEER`
- `ADMIN`

Endpoints:
- `POST /api/auth/register` - Register a new user (DONOR / VOLUNTEER)
- `POST /api/auth/login` - User login & JWT retrieval
- `GET /api/auth/me` - Fetch currently authenticated user
- `GET /api/donor/test` - Test route for DONOR role
- `GET /api/volunteer/test` - Test route for VOLUNTEER role
- `GET /api/admin/test` - Test route for ADMIN role
