# PickMe — Project Blueprint

## Overview
PickMe is an AI-powered, occupancy-first ride-sharing platform targeting the Indian market.
It sits between schedule-based P2P carpooling apps (Quick Ride, sRide) and pure on-demand
aggregators (Ola, Uber) by treating vehicle occupancy as the primary optimization objective
rather than an add-on.

## Architecture

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo), TypeScript, Expo Router |
| Backend API | Node.js, Express, MongoDB (Mongoose) |
| Admin dashboard | React + Vite (separate web app) |
| Auth | Backend-controlled OTP + JWT (no Firebase) |
| File storage | Cloudinary (planned — not yet integrated) |

## Current Branch: `phase-1-auth`

### Implemented Features

#### Authentication (fully working)
- Phone number entry → OTP send → OTP verify → Role selection (Passenger / Driver)
- Backend issues a signed JWT on successful OTP verification; no third-party auth provider.
- Persistent session: JWT stored on device, validated on app launch via `/api/users/me`.
- Models: `User`, `OTP` (MongoDB TTL index auto-expires codes).
- Routes: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`.

#### Driver Onboarding / Verification (fully working)
- 6-screen wizard: Intro → Identity Verification → Vehicle Details → Vehicle Photo →
  Review & Submit → Submitted.
- Driver submits: profile photo, Aadhaar document, driving licence, vehicle type/number/photo.
- **Note:** document/photo fields currently use temporary placeholder values — no real
  camera/gallery capture or Cloudinary upload is wired up yet.
- Backend stores submission in `DriverProfile` model (`verificationStatus`: pending / approved / rejected).
- Approved profiles are locked — cannot be resubmitted without admin reset.

#### Driver Home Screen (fully working)
- Loads `DriverProfile` on mount; routes to verification wizard if not yet submitted,
  shows pending/rejected/approved state otherwise.

#### Passenger Home Screen (stub only)
- File exists (`PassengerHomeScreen.tsx`) but shows placeholder text only.
- No ride-booking UI implemented yet — this is the next phase.

### Not Yet Implemented
- Ride request flow (passenger side)
- Ride matching engine (backend)
- Driver ride-accept / in-trip flow
- Real-time location tracking
- Payments / fare calculation
- Admin approval workflow (dashboard UI + backend approve/reject routes)
- Admin analytics dashboard

## Vehicle Types & Capacities
Passenger capacity (driver excluded):

| Type | Seats |
|---|---|
| Bike | 1 |
| Auto | 3 |
| Car | 4 |
| Sedan | 4 |
| SUV | 6 |

## Matching Engine (planned)
See `RESEARCH_FRAMEWORK.md` for the full algorithm specification.
Default parameters: 2 km matching radius, 15 s driver accept timer (both admin-configurable).
Geospatial queries will use MongoDB 2dsphere indexing.
