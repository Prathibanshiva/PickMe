# PickMe — Implementation Roadmap

**Current Active Phase:** Phase 2 (Passenger Booking & Ride Foundation)
**Upcoming Milestone:** Phase 3 (Persistent Server-Side Ride Lifecycle & Dispatch Engine)
**Governance Principle:** Functional correctness and persistent server-side state take absolute priority over superficial UI polish. The existence of client-side screens does not constitute completed backend functionality.

---

## 1. Status Legend

- **Completed & Verified:** Implemented in code, tested, and verified against functional criteria.
- **Implemented (Needs Additional Verification):** Code is written and functioning locally, but requires automated test coverage, load verification, or edge-case testing.
- **In Progress:** Partially implemented; active work in the current branch or working tree.
- **Not Started:** Architected or planned, but no implementation exists yet.
- **Blocked by Dependencies:** Cannot proceed until prerequisite tasks are completed.

---

## 2. Milestone Overview Matrix

| Module | Feature Area | Status | Priority | Core Dependencies |
|---|---|---|---|---|
| **Auth** | Phone OTP & JWT Issuance | **Completed & Verified** | Core | None |
| **Auth** | Mobile Session Persistence & Routing | **Completed & Verified** | Core | Backend Auth API |
| **Driver** | 6-Screen KYC Onboarding Wizard | **Completed & Verified** | Core | Mobile Navigation |
| **Driver** | Profile Submission & KYC Persistence | **Completed & Verified** | Core | MongoDB `DriverProfile` |
| **Driver** | Status Gate & Onboarding Resumption | **Completed & Verified** | Core | DriverProfile, Auth API |
| **Admin** | Dedicated Login & Whitelist RBAC | **Completed & Verified** | High | User Model, Bcrypt |
| **Admin** | Driver Verification & Rejection Codes | **Completed & Verified** | High | Admin API, DriverProfile |
| **Admin** | Passenger Block / Suspend / Restore | **Completed & Verified** | High | Admin API, User Model |
| **Mapping** | Google Maps & Places Integration | **Completed & Verified** | Core | react-native-maps, Places Proxy |
| **Admin** | Operations Overview Metrics | **Needs Verification** | Medium | MongoDB Aggregation |
| **Storage** | Cloudinary Document Uploads | **Needs Verification** | Medium | Cloudinary SDK, Multer |
| **Lifecycle** | Mobile Mock Ride Lifecycle (In-Memory) | **In Progress** | Medium | Mobile Screens |
| **Backend** | Persistent Server-Side Ride Models (`Ride`) | **Completed & Verified** | Core | MongoDB Connection |
| **Lifecycle** | Server-Side Ride Booking & Dispatch REST API | **Completed & Verified** | Core | Persistent Ride Models |
| **Lifecycle** | Trip Progression (Arrived, OTP Verify, Complete) | **Completed & Verified** | Core | Persistent Ride Models |
| **Lifecycle** | Ride Cancellation & State Machine Guards | **Completed & Verified** | Core | Persistent Ride Models |
| **Realtime** | WebSocket / Socket.io Bi-Directional Sync | **Not Started** | **CRITICAL** | Backend Server, JWT Auth |
| **Matching** | Occupancy-First Shared Ride Matching Engine | **Not Started** | High | Persistent Rides, 2dsphere |
| **Queue** | Scheduled Rides Persistence & Queue Dispatch | **Not Started** | Medium | Persistent Ride Models |
| **Admin** | Live Ride Telemetry & Operations Dashboard | **Needs Verification** | Medium | Persistent Rides, Admin API |
| **QA / Ops** | End-to-End Test Suite & Deployment Pipeline | **Needs Verification** | Medium | Core Lifecycle Completion |

---

## 3. Detailed Work Breakdown & Deliverables

### Category A: Completed & Verified

#### TASK-A1: Backend Phone Authentication Foundation
- **Objective:** Provide secure, passwordless phone number authentication via 6-digit OTP and JWT issuance without third-party vendor dependencies (e.g., Firebase).
- **Deliverables:** `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `User` model, `OTP` model with automated MongoDB TTL index, JWT signing utility.
- **Acceptance Criteria:** Valid OTP issues signed JWT with 7-day expiration; expired or reused OTPs are rejected; phone numbers are stored uniquely.
- **Status:** **Completed & Verified**.

#### TASK-A2: Mobile Authentication & Launch Session Routing
- **Objective:** Enable passengers and drivers to authenticate on mobile, securely store session tokens, and route automatically based on persistent session state.
- **Deliverables:** Phone input screen, OTP screen, role selection screen, `expo-secure-store` integration, splash screen session validation against `GET /api/user/me`.
- **Acceptance Criteria:** App automatically routes returning authenticated users to their respective home screen (`PassengerHomeScreen` vs `DriverHomeScreen`); unauthenticated launches display phone login.
- **Status:** **Completed & Verified**.

#### TASK-A3: Driver KYC Onboarding & Profile Submission
- **Objective:** Allow drivers to register personal identity and vehicle details, saving KYC data in MongoDB for administrative review.
- **Deliverables:** 6-screen mobile wizard, `DriverProfile` Mongoose model, `POST /api/driver/profile`, `PUT /api/driver/profile`.
- **Acceptance Criteria:** Driver can complete onboarding wizard; submission locks the profile in `verificationStatus: "pending"`; approved profiles cannot be edited without admin reset.
- **Status:** **Completed & Verified**.

#### TASK-A4: Administrative Authentication & Access Control
- **Objective:** Secure administrative endpoints with a dedicated login mechanism, strict identity allowlisting, and server-side RBAC middleware.
- **Deliverables:** `POST /api/admin/auth/login`, `GET /api/admin/me`, `requireAdmin` middleware, `ADMIN_PASSWORD_HASH` environment variable, password hashing utility script.
- **Acceptance Criteria:** Only requests from the explicitly allowlisted email (`prathibanshiva@gmail.com`) with valid bcrypt credentials receive admin tokens; all admin endpoints reject non-admin callers with HTTP 403.
- **Status:** **Completed & Verified**.

#### TASK-A5: Administrative Driver Verification Operations
- **Objective:** Allow operations personnel to inspect submitted driver KYC applications, approve verified drivers, or reject fraudulent/incomplete submissions with clear reason codes.
- **Deliverables:** `GET /api/admin/drivers`, `GET /api/admin/drivers/:id`, `PUT /api/admin/drivers/:id/approve`, `PUT /api/admin/drivers/:id/reject`, React Admin Dashboard UI.
- **Acceptance Criteria:** Approving a driver transitions status to `"approved"` and updates `User.defaultRole` to `"driver"`; rejecting requires a non-empty reason and standardized code; atomic updates prevent race conditions.
- **Status:** **Completed & Verified**.

#### TASK-A6: Passenger Account Access Management
- **Objective:** Provide administrators the ability to suspend or block disruptive users and restore accounts upon review.
- **Deliverables:** `GET /api/admin/passengers`, `GET /api/admin/passengers/:id`, `PUT /api/admin/passengers/:id/status`, Admin Dashboard UI.
- **Acceptance Criteria:** Blocked and suspended users are rejected by `authenticate` middleware with HTTP 403; primary administrator account is safeguarded against modification; status updates log admin audit records.
- **Status:** **Completed & Verified**.

#### TASK-A7: Google Maps Migration & Reliable Passenger Pickup Selection
- **Objective:** Replace MapLibre/OpenStreetMap with Google Maps (`react-native-maps`) and provide address autocomplete, manual pin selection, and reliable pickup coordinate persistence via secure server proxy.
- **Deliverables:** `react-native-maps` (`PROVIDER_GOOGLE`) mobile migration, backend Google Maps proxy (`/api/maps/autocomplete`, `/api/maps/place-details`, `/api/maps/reverse-geocode`) in `backend/src/controllers/maps/maps.controller.js`, debounced Google Places Autocomplete with session token billing grouping, interactive center-pin pickup adjustment with animated pin bounce and settling reverse geocoding, explicit "Confirm Pickup Location" action, non-fabricating discriminated error handling in `location.service.ts` and `PassengerHomeScreen.tsx`.
- **Acceptance Criteria:** Map renders smooth Google Maps tiles; GPS automatically populates pickup; permission denial/GPS timeout displays recoverable manual select/retry options without arbitrary coordinates; Places Autocomplete searches addresses; selecting a place resolves coordinates and moves map; manual center-pin selection allows dragging map beneath fixed pin and clicking "Confirm Pickup"; confirmed coordinates persist through vehicle selection and booking; server API key is never exposed to mobile bundle.
- **Status:** **Completed & Verified**.

#### TASK-A8: Driver Onboarding Gate & Verification Enforcement
- **Objective:** Enforce end-to-end verification gating across mobile driver routes and backend APIs so unapproved drivers cannot access duty controls, view offers, or accept rides.
- **Deliverables:** `DriverStatusGate.tsx` mobile component, `GET /api/driver/profile` read-only status endpoint, `requireApprovedDriver` backend authorization middleware, onboarding resumption with prefill in `DriverOnboardingContext`, unit test suite in `backend/test/driver-onboarding-gate.test.js`.
- **Acceptance Criteria:** Unauthenticated callers receive 401; users without driver profiles are redirected to onboarding intro; incomplete applications resume at the appropriate step; pending submissions display review card with refresh and passenger fallback; rejected submissions display clear reason and resubmission; approved profiles access `DriverHomeScreen`; backend rejects unapproved actions with 403; passenger onboarding is unaffected.
- **Status:** **Completed & Verified**.

---

### Category B: Implemented (Needs Additional Verification)

#### TASK-B1: Operations Overview Metrics Aggregation
- **Objective:** Provide platform health and queue counts on the admin dashboard overview.
- **Deliverables:** `GET /api/admin/dashboard/overview`, React Dashboard overview cards.
- **Verification Needed:** Validate aggregation performance under high user volume; add automated tests verifying metrics reflect concurrent database mutations.
- **Status:** **Implemented (Needs Additional Verification)**.

#### TASK-B2: Real Cloudinary File Upload Integration
- **Objective:** Replace placeholder document strings with actual cloud file uploads for driver KYC documents and photos.
- **Deliverables:** Backend Multer + Cloudinary storage configuration, mobile image picker camera/gallery capture, authenticated upload endpoint.
- **Verification Needed:** Cloudinary credentials and upload pipelines are defined in `package.json` dependencies but upload endpoints have not yet been wired to replace local placeholder values.
- **Status:** **Implemented (Needs Additional Verification)**.

---

### Category C: In Progress

#### TASK-C1: Mobile In-Memory Ride Lifecycle Simulation
- **Objective:** Allow end-to-end testing of passenger booking and driver trip handling on a single device or paired devices during local development.
- **Deliverables:** `ride-lifecycle.service.ts` singleton; Passenger screens (`FindingRideScreen`, `RideBookedScreen`, `LiveRideScreen`, `RideCompletedScreen`); Driver screens (`IncomingRideRequestScreen`, `DriverAcceptedScreen`, `DriverEnRoutePickupScreen`, `DriverArrivedScreen`, `DriverLiveTripScreen`, `DriverTripCompletedScreen`).
- **Acceptance Criteria:** Passenger booking generates an offer observable by driver screens; driver acceptance updates passenger state; OTP code (`7294`) completes pickup; trip completion calculates earnings.
- **Current Limitation:** State exists entirely in client-side RAM; resetting the app clears all active ride data; no persistence in MongoDB.
- **Status:** **In Progress**.

---

### Category D: Not Started (High Priority — Phase 3)

#### TASK-D1: Persistent Server-Side Ride Models
- **Objective:** Establish the foundational MongoDB models for rides, passenger bookings, and driver assignments.
- **Dependencies:** Task-A1, Task-A3.
- **Deliverables:** `Ride` Mongoose model (`backend/src/models/Ride.js`) with canonical capacity validation, geospatial 2dsphere indexing on pickup and destination, compound query indexes, human-readable `rideId` generator (`PKM-XXXXX`), pricing attributes, lifecycle timestamps, and cancellation metadata.
- **Acceptance Criteria:** Model compiles and passes schema constraints; enforces canonical vehicle rules (Bike 1, Auto 3, Car 4, Sedan 4, SUV 6); validates shared seat limits (1 to capacity - 1); 2dsphere indexes enable geospatial queries.
- **Status:** **Completed & Verified**.

#### TASK-D2: Backend Ride Booking & Dispatch REST API
- **Objective:** Replace mobile in-memory ride creation with authenticated, server-authoritative REST endpoints.
- **Dependencies:** Task-D1.
- **Deliverables:** `POST /api/rides` (create request), `GET /api/rides/active` (active ride lookup), `GET /api/rides/available` (driver offer inspection), `GET /api/rides/:id` (detail inspection with role-based OTP masking), `GET /api/rides` (paginated history), `POST /api/rides/:id/accept` (atomic driver assignment), `POST /api/rides/:id/arrive` (arrived transition), `POST /api/rides/:id/verify-otp` (server-side PIN verification), `POST /api/rides/:id/complete` (trip settlement), `PUT /api/rides/:id/cancel` (lifecycle cancellation). Admin `/api/admin/rides` and dashboard overview updated with real MongoDB aggregations.
- **Acceptance Criteria:** Complete request-to-completion lifecycle executes via verified HTTP requests and updates MongoDB records with atomic race condition guards.
- **Status:** **Completed & Verified**.

#### TASK-D3: Real-Time Synchronization via WebSockets / Socket.io
- **Objective:** Enable instantaneous state synchronization between passenger, driver, and operations admin without client polling.
- **Dependencies:** Task-D2.
- **Main Expected Deliverables:**
  - Socket.io server integrated into Express backend with JWT handshake authentication.
  - Rooms partitioned by `rideId`, `userId`, and `admin:operations`.
  - Event schemas: `ride:requested`, `ride:offered`, `ride:accepted`, `driver:location_update`, `driver:arrived`, `trip:started`, `trip:completed`, `ride:cancelled`.
  - Mobile client Socket.io manager with automatic reconnection and offline recovery.
- **Acceptance Criteria:** Driver accepting a request updates passenger UI within < 500ms over local network without manual refresh.
- **Status:** **Not Started**.

#### TASK-D4: Occupancy-First Shared Ride Matching Engine
- **Objective:** Implement the core PickMe matching algorithm according to the Research & Academic Framework.
- **Dependencies:** Task-D1, Task-D2.
- **Main Expected Deliverables:**
  - Candidate generation via MongoDB 2dsphere geospatial search (default 2 km radius).
  - Corridor route similarity calculation comparing passenger origin/destination with driver active path.
  - Hard constraint evaluation: remaining vehicle seats ≥ requested seats; detour time ≤ threshold.
  - Multi-factor scoring function: `Score = w1·RouteSimilarity + w2·OccupancyGain - w3·DetourTime - w4·WaitingTime`.
  - 15-second driver acceptance timer with cascade to next-best candidate on timeout.
- **Acceptance Criteria:** Algorithm successfully identifies an active vehicle with spare capacity and assigns shared passengers while enforcing canonical capacity limits.
- **Status:** **Not Started**.

#### TASK-D5: Trip Cancellation, Timeout & Error Recovery
- **Objective:** Handle edge cases including driver cancellation, passenger cancellation, driver no-show, and network disconnections.
- **Dependencies:** Task-D2, Task-D3.
- **Main Expected Deliverables:**
  - State machine transitions for cancellation at each lifecycle stage (pre-dispatch, en-route, arrived).
  - Automatic rematching queue when driver declines or request times out.
  - Driver release logic ensuring vehicles on cancelled personal rides become instantly available.
- **Acceptance Criteria:** A cancelled ride cleanly resets passenger and driver client states and restores vehicle seat allocations in the database.
- **Status:** **Not Started**.

#### TASK-D6: Scheduled Ride Pre-Booking & Queue Persistence
- **Objective:** Enable passengers to pre-book rides for future departure times with automated scheduled dispatch.
- **Dependencies:** Task-D1, Task-D4.
- **Main Expected Deliverables:**
  - `ScheduledRide` Mongoose model (`scheduledDepartureTime`, `windowMinutes`, `status`).
  - `POST /api/rides/scheduled` endpoint with future timestamp validation.
  - Background scheduler (node-cron or agenda) scanning for departures within T-15 minutes and injecting them into the active matching engine.
- **Acceptance Criteria:** Pre-booked rides are persisted in MongoDB; scheduler dispatches ride requests to available drivers at the target departure window.
- **Status:** **Not Started**.

---

### Category E: Blocked by Dependencies

#### TASK-E1: Live Admin Ride Telemetry & Operations Dashboard
- **Objective:** Stream real-time vehicle positions, active corridors, and fleet occupancy to the React Admin Dashboard.
- **Blocked By:** Task-D1 (Persistent Ride Models), Task-D3 (WebSocket Integration).
- **Deliverables:** Connect existing Admin `/rides` and `/scheduled-rides` views to real database queries and live WebSocket feeds.
- **Status:** **Blocked by Dependencies**.

#### TASK-E2: Dynamic Corridor Balancing & Fleet Repositioning
- **Objective:** Provide automated suggestions to idle drivers to relocate to high-demand corridor buffers.
- **Blocked By:** Task-D4 (Matching Engine), Task-E1 (Live Telemetry).
- **Status:** **Blocked by Dependencies**.

---

## 4. Implementation Priorities & Next Action

With **TASK-D1: Persistent Server-Side Ride Models** and **TASK-D2: Backend Ride Booking & Dispatch REST API** completed and verified with MongoDB-backed persistence and atomic state machines, the single highest-priority task for the platform is now **TASK-D3: Real-Time Synchronization via WebSockets / Socket.io**, immediately followed by **TASK-D4: Occupancy-First Shared Ride Matching Engine**.

The persistent database foundation is active, and client-side lifecycle operations now connect to backend REST endpoints. Live bi-directional dispatch and telemetry streaming are the immediate next architectural requirements.
