# PickMe — Project Changelog

All notable changes to the PickMe platform are documented in this file.
This changelog strictly reflects verified Git history, source commits, and active working-tree modifications.

---

## [Uncommitted Working-Tree State] — Active Development
**Branch:** `phase-2-passenger-booking`
**Focus Area:** Operations Admin Suite & Mock Ride Lifecycle Simulation

### Backend (Node.js / Express / MongoDB)
- **Admin Authentication:**
  - Added dedicated endpoint `POST /api/admin/auth/login` enforcing email allowlist (`prathibanshiva@gmail.com`) and bcrypt hash verification via `ADMIN_PASSWORD_HASH` or stored password.
  - Added protected session verification endpoint `GET /api/admin/me` guarded by `authenticate` and `requireAdmin`.
  - Added script `backend/scripts/set-admin-password.js` for hashing administrative credentials locally.
- **Admin Driver Management:**
  - Added `GET /api/admin/drivers` with status filtering (`pending`, `approved`, `rejected`), search (driver name, phone, vehicle plate), and pagination.
  - Added `GET /api/admin/drivers/:id` returning detailed KYC records and audit info.
  - Added `PUT /api/admin/drivers/:id/approve` with atomic concurrency guard (`{ verificationStatus: "pending" }`), auto-updating user `defaultRole` to `"driver"`.
  - Added `PUT /api/admin/drivers/:id/reject` requiring explicit `rejectionReason` and standardized `rejectionCode` (`dl_unreadable`, `aadhaar_mismatch`, `plate_obscured`, `expired_docs`, `liveness_fail`, `other`).
- **Admin Passenger & User Management:**
  - Added `GET /api/admin/passengers` (and alias `/api/admin/users`) with status filter (`active`, `suspended`, `blocked`), search, and pagination.
  - Added `GET /api/admin/passengers/:id` with dual-profile detection (inspects if passenger has a driver profile).
  - Added `PUT /api/admin/passengers/:id/status` supporting `"block"`, `"unblock"`, `"suspend"`, and `"restore"` with administrative audit attribution and safeguards against mutating the primary admin account.
- **Operations Dashboard Overview:**
  - Added `GET /api/admin/dashboard/overview` aggregating real counts from MongoDB for passengers, drivers, vehicle fleet distribution, and recent activity.
- **Ride Telemetry Stubs (Phase C Bridge):**
  - Added `GET /api/admin/rides` and `GET /api/admin/rides/:id` returning empty persisted sets with explicit service status (`persisted: false`, `phase: "Phase C Scheduled"`).
  - Added `GET /api/admin/scheduled-rides` and `GET /api/admin/scheduled-rides/:id` returning empty scheduled queues with Phase C notices.
- **Model Enhancements:**
  - Updated `User` model with `isBlocked`, `isSuspended`, `defaultRole` enum (`["passenger", "driver", "admin"]`), and conditional `phoneNumber` validation for admin identities.
  - Updated `DriverProfile` model with `rejectionCode`, `verifiedAt`, and `verifiedBy` (ref `User`).

### Admin Dashboard (React 19 / Vite 8 / React Router 7)
- **Application Foundation:**
  - Initialized dedicated web application under `admin-dashboard/` with dark UI theme matching Stitch designs.
  - Configured session management in `sessionStorage` (`pickme_admin_token`) and authenticated fetch client ([admin-dashboard/src/api/client.ts](file:///c:/Projects/PickMe/admin-dashboard/src/api/client.ts)).
- **Pages & Operations Views:**
  - **Login Page (`/login`):** Dedicated admin login form validating credentials against backend.
  - **Dashboard Overview (`/`):** Real metrics cards, driver verification queue, vehicle distribution, and transparent Phase C notices.
  - **Driver Verification (`/drivers`, `/drivers/:id`):** Status tabs, search, document review modal, approve action, and rejection modal with structured reason codes.
  - **Passenger Management (`/passengers`):** Account status badges, multi-attribute search, and status control modal (block/suspend/restore).
  - **Rides Overview (`/rides`):** Telemetry view with honest status display noting that backend ride persistence is scheduled for Phase C.
  - **Scheduled Rides (`/scheduled-rides`):** Pre-booking queue view with Phase C scheduled notices.

### Mobile App (React Native / Expo 57)
- **Shared Mock Ride Lifecycle Singleton:**
  - Implemented [ride-lifecycle.service.ts](file:///c:/Projects/PickMe/mobile-app/src/services/ride-lifecycle.service.ts) to manage in-memory ride states between passenger and driver during local development.
- **Passenger Ride Flow:**
  - Added `FindingRideScreen` (searching animation and timeout handling).
  - Added `RideBookedScreen` (driver matched view, car details, 4-digit verification OTP).
  - Added `LiveRideScreen` (in-trip map tracking, progress meter, emergency contact options).
  - Added `RideCompletedScreen` (trip receipt, fare breakdown, driver rating).
- **Driver Ride Flow:**
  - Added `IncomingRideRequestScreen` (15-second countdown timer, route details, estimated earnings, accept/decline actions).
  - Added `DriverAcceptedScreen` (pickup navigation prep, passenger contact).
  - Added `DriverEnRoutePickupScreen` (turn-by-turn guidance to passenger pickup).
  - Added `DriverArrivedScreen` (arrived notification, 4-digit PIN OTP verification modal).
  - Added `DriverLiveTripScreen` (trip progress to destination, complete trip trigger).
  - Added `DriverTripCompletedScreen` (earnings summary, net payout calculation, return to online state).

---

## [Committed Milestones in Git History]

### 2026-09-24 — OpenStreetMap & MapLibre Migration
- **Commit:** `7fe824d` — *fix(passenger): expand destination dataset, fix stale Google Map comment, improve empty-state UX*
  - Expanded curated Bangalore destination dataset with prominent tech parks, transit hubs, and commercial centers.
  - Cleaned up obsolete comments referencing Google Maps.
- **Commit:** `9fe67ed` — *feat(passenger): migrate passenger map flow from Google Maps to MapLibre and OpenStreetMap*
  - Replaced Google Maps SDK with `@maplibre/maplibre-react-native` and OpenStreetMap raster tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - Implemented zero-cost native reverse geocoding via `expo-location` (`Location.reverseGeocodeAsync`).
  - Eliminated commercial API keys, billing requirements, and vendor lock-in from the mobile mapping stack.

### 2026-09-14 — Initial Passenger Booking Flow
- **Commit:** `3df707e` — *fix(passenger): real Google Maps, Places API proxy, interactive pickup, and navigation fixes*
  - Implemented interactive pickup location pinning and destination selection navigation.
- **Commit:** `3807dae` — *feat(passenger): implement initial passenger ride-booking entry flow*
  - Built initial `PassengerHomeScreen`, `DestinationSearchScreen`, and `VehicleSelectionScreen`.
  - Added vehicle selection UI supporting Bike, Auto, Car, Sedan, and SUV with shared seat selectors.

### 2026-09-05 — Documentation & Architectural Governance
- **Commit:** `83f994e` — *docs: add project blueprint and decision log*
  - Added `docs/PROJECT_BLUEPRINT.md` establishing platform architecture, vehicle capacities, and roadmap.
  - Added `docs/DECISIONS.md` documenting ADR-001 through ADR-007 (removal of Firebase, mobile-first scope, canonical vehicle seating, admin-tunable matching, centralized phone normalization, and 2dsphere indexing).

### 2026-09-02 — Driver Verification Submission Flow
- **Commit:** `890d989` — *Complete driver verification submission flow*
  - Implemented 6-screen driver KYC wizard: Intro, Identity Verification, Vehicle Details, Vehicle Photo, Review & Submit, and Verification Submitted.
  - Wired mobile wizard to backend `PUT /api/driver/profile` endpoint.
  - Stored submission data in `DriverProfile` with initial `verificationStatus: "pending"`.

### 2026-08-17 — Driver Profile Foundation & Persistent Session Routing
- **Commit:** `4bfea71` — *feat(auth): add persistent session launch routing*
  - Added app launch session verification against `GET /api/user/me`.
  - Added automatic role-based routing directing passengers to `PassengerHomeScreen` and drivers to `DriverHomeScreen`.
- **Commit:** `ef138bd` — *feat(driver): add onboarding profile fields*
  - Added vehicle registration and KYC document fields to `DriverProfile` model.
- **Commit:** `64c615f` — *feat(driver): add authenticated driver profile*
  - Implemented `POST /api/driver/profile` to create or retrieve authenticated driver records.

### 2026-08-16 — Mobile Authentication & Secure Session Storage
- **Commit:** `a72577d` — *feat(auth): add protected user session validation*
  - Added protected user session validation on the mobile client.
- **Commit:** `3859d45` — *feat(auth): add secure session persistence*
  - Integrated `expo-secure-store` to persist JWT tokens and user metadata securely on device.
- **Commit:** `6e1c513` — *feat(auth): complete role selection and OTP navigation*
  - Implemented mobile screens for phone number entry, OTP verification, and role selection (Passenger vs Driver).

### 2026-08-04 — Backend Authentication Verification & Polishing
- **Commit:** `f9c4e8b` — *Complete backend authentication with OTP and JWT*
  - Validated complete OTP authentication cycle and token issuance in Node.js backend.

### 2026-08-02 — Backend OTP Authentication Core
- **Commit:** `9cf7195` — *Complete backend OTP authentication with JWT*
  - Implemented `POST /api/auth/send-otp` and `POST /api/auth/verify-otp`.
  - Created `User` and `OTP` Mongoose models with automatic TTL index expiration.
  - Implemented JWT generation utility (`generateToken`) with 7-day expiry.

### 2026-08-01 — Project Inception
- **Commit:** `fcd62d2` — *Initial project setup with Phase 0 and Phase 1 architecture*
  - Created repository structure with `backend/` and `mobile-app/`.
  - Configured initial Express server, MongoDB connection, and Expo React Native workspace.
