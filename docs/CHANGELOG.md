# PickMe — Project Changelog

All notable changes to the PickMe platform are documented in this file.
This changelog strictly reflects verified Git history, source commits, and active working-tree modifications.

---

## [Uncommitted Working-Tree State] — Active Development
**Branch:** `phase-c-ride-lifecycle`
**Focus Area:** Phase C — Ride Lifecycle: Persistent Ride Model & Server-Authoritative Ride Lifecycle Foundation

### Backend (Node.js / Express / MongoDB)
- **Persistent Ride Model (`Ride.js`):**
  - Created persistent Mongoose schema in `backend/src/models/Ride.js` with human-readable `rideId` (`PKM-XXXXX`), passenger/driver references, vehicle type (`bike`, `auto`, `car`, `sedan`, `suv`), ride mode (`shared`, `personal`), and requested seats.
  - Enforced canonical vehicle capacity constraints at schema level (Bike 1, Auto 3, Car 4, Sedan 4, SUV 6 max passengers; Auto 1-2, Car 1-3, Sedan 1-3, SUV 1-5 for Shared; Bike strictly prohibited from Shared).
  - Configured 2dsphere geospatial indexes on `pickup.location` and `dropoff.location`, plus compound indexes on `(passengerId, status)`, `(driverId, status)`, and `(status, createdAt)`.
  - Stored lifecycle timestamps (`requestedAt`, `assignedAt`, `arrivedAt`, `startedAt`, `completedAt`, `cancelledAt`), fare breakdown, cancellation attribution, and 4-digit start OTP (`verificationOtp`).
- **Phase C Task 1 Corrective Security & State Machine Fixes:**
  - **P1 — Rate-Limit Trip-Start OTP Verification:** Added `verifyOtpLimiter` (`express-rate-limit`) to `POST /api/rides/:id/verify-otp`, enforcing a maximum of 5 attempts per 15-minute window keyed by user ID and ride ID. Returns HTTP 429 without leaking the expected OTP.
  - **P2 — Complete Admin & Driver OTP Masking:** Excluded `verificationOtp` from `GET /api/admin/rides/:id` via query projection (`-verificationOtp`) and explicit deletion. Restricted `verificationOtp` in `formatRideResponse` strictly to the booking passenger who must present it.
  - **P5 — Atomic OTP Verification Gate:** Enforced atomic OTP check in `verifyRideOtp` by including `verificationOtp: otp.trim()` in the `findOneAndUpdate` conditional filter (`{ _id, driverId, status: "arrived", verificationOtp }`). Prevents TOCTOU race conditions and non-atomic state mutations.
  - **P6 — Cancellation Conflict Handling:** Updated `cancelRide` to inspect the atomic update result. Returns HTTP 409 Conflict if concurrent status change occurs rather than HTTP 200 with null.
  - **Personal Ride Exclusivity Concurrency Guard:** Added post-assignment concurrency check and atomic rollback compensation in `acceptRide` to prevent concurrent assignments from violating Personal Ride dedicated vehicle exclusivity.
  - **Driver Earnings & Fare Integrity:** Ensured driver payout earnings are authoritatively finalized on the server side (`Math.round(finalFare * 0.85)`) upon trip completion rather than trusting client-supplied estimates.
  - **Fail-Closed Test Suite Database Safety:** Enforced strict fail-closed database guards in `backend/test/ride-lifecycle.test.js`, requiring explicit `TEST_MONGODB_URI` and `NODE_ENV === "test"`. Completely prevents automated test suites from executing destructive operations against shared or production MongoDB clusters.
- **Ride Lifecycle REST API (`/api/rides`):**
  - `POST /api/rides`: Creates and persists booking request after Zod validation (`createRideSchema`) enforcing product capacity limits. Auto-generates cryptographically secure 4-digit start OTP via `crypto.randomInt` and prevents duplicate active bookings for the passenger.
  - `GET /api/rides/active`: Fetches passenger's or driver's current active ride (`requested`, `accepted`, `arrived`, `in_progress`).
  - `GET /api/rides/available`: Allows approved drivers to query nearby/pending `requested` rides matching their vehicle category.
  - `GET /api/rides/:id`: Retrieves full ride document with role-based masking (`verificationOtp` visible exclusively to ride passenger).
  - `GET /api/rides`: Bounded, paginated ride history with status and date filtering.
  - `POST /api/rides/:id/accept`: Driver claims ride with atomic status transition (`requested` -> `accepted`) and validation preventing double-booking if the driver has an active personal ride.
  - `POST /api/rides/:id/arrive`: Driver marks arrival at pickup location (`accepted` -> `arrived`).
  - `POST /api/rides/:id/verify-otp`: Driver submits 4-digit passenger OTP (`verifyOtpSchema`), verifying PIN match before atomically transitioning from `arrived` to `in_progress`.
  - `POST /api/rides/:id/complete`: Driver finishes trip (`in_progress` -> `completed`), setting `completedAt`.
  - `PUT /api/rides/:id/cancel` (and `POST /api/rides/:id/cancel`): Actor-authorized cancellation (`cancelled`), attributing `cancelledBy` (`passenger`, `driver`, `system`) and recording `cancellationReason`.
- **Admin Ride Telemetry Integration:**
  - Upgraded `GET /api/admin/rides` and `GET /api/admin/rides/:id` in `backend/src/controllers/admin/ride.controller.js` to query live MongoDB `Ride` documents with status tab filtering, text search (`rideId`, passenger/driver phone), pagination, and real-time aggregated metrics (`live`, `upcoming`, `completed`, `cancelled`), with strict OTP masking.
  - Updated `GET /api/admin/dashboard/overview` in `backend/src/controllers/admin/dashboard.controller.js` to count real live and completed rides from the `Ride` collection.
- **Driver Profile Read-Only Status & Authorization Guards:**
  - `GET /api/driver/profile`: Read-only endpoint returning caller's current driver verification status without side-effect creation. Returns HTTP 404 with `onboardingRequired: true` when profile does not exist.
  - `requireApprovedDriver` middleware: Protects driver lifecycle routes (`/available`, `/:id/accept`, `/:id/arrive`, `/:id/verify-otp`, `/:id/complete`), verifying driver is approved before permitting action.
  - Added defensive authentication checks preventing unauthenticated requests from producing uncaught runtime exceptions.
  - Added unit test suite `backend/test/driver-onboarding-gate.test.js` with 14 tests covering profile lookup, non-creation on GET, incomplete onboarding detection, fail-closed security policy, and controller-level rejection of unauthorized actions.
- **Automated Test Suite:**
  - Added 28 unit tests in `backend/test/ride-lifecycle.test.js` using Node's native test runner (`node --test`).
  - Covers vehicle capacities, Zod validation, Mongoose schema custom validators, role-based OTP masking for admin & driver, state machine transitions, concurrent driver assignment race conditions, passenger cancellation, and admin ride metrics aggregations.
  - Added `npm test` script to `backend/package.json`.

### Mobile App (React Native / Expo 57)
- **Authoritative Booking Persistence (P3):**
  - Updated `createRide` in `mobile-app/src/services/ride-lifecycle.service.ts` to be fully asynchronous and server-authoritative.
  - Passengers await backend MongoDB persistence before transitioning to `SEARCHING`. Non-2xx and network errors are surfaced honestly via UI alerts without leaving the client in a false searching or booked state.
  - Updated `VehicleSelectionScreen.tsx` to await `createRide` with loading state guard and error messaging.
- **Real Persistent Ride ID & End-to-End Driver Flow (P4):**
  - Replaced hardcoded mock IDs with canonical MongoDB ObjectIds across acceptance, arrival, OTP verification, completion, and cancellation.
  - Removed hardcoded OTP fallback `"7294"`. Driver starts with empty PIN input in `DriverArrivedScreen.tsx`.
  - Integrated `fetchAvailableRides()` with `GET /api/rides/available` so online drivers receive real persisted ride requests.
  - Added backend driver verification approval check (`GET /api/driver/profile`) before permitting driver to toggle online in `DriverHomeScreen.tsx`.
  - Added bounded periodic polling (3s) on active ride screens (`FindingRideScreen`, `RideBookedScreen`, `LiveRideScreen`) to detect driver acceptance, arrival, trip start, and completion in real-time.
  - Added `syncActiveRide()` recovery on mount across passenger and driver home screens, restoring active ride state upon app navigation or restart.
- **Driver Onboarding Gate & Verification Flow:**
  - Implemented `DriverStatusGate.tsx` which gates all driver entry points based on backend verification status (`GET /api/driver/profile`).
  - Resolved TypeScript type conflicts and corrected theme token references (`Radius.pill`, `Radius.round`, `Radius.lg`, `Radius.md`).
  - Automatically redirects drivers without profiles (`not_found`) to `/driver/verification-intro`.
  - Supports resuming incomplete onboarding (`incomplete`) by prefilling `DriverOnboardingContext` via `populateFromProfile` and navigating directly to the incomplete step (`identity-verification`, `vehicle-details`, `vehicle-photo`, or `review-submit`).
  - Displays persistent "Verification Under Review" state when status is `pending` with "Check Approval Status", "Use as Passenger", and "Sign Out" actions.
  - Displays "Verification Needs Attention" with admin rejection reason and standardized rejection code when status is `rejected`, allowing seamless "Update & Resubmit".
  - Grants access to `DriverHomeScreen` only when driver verification status is authoritatively confirmed as `approved`.
  - Connected `/driver` (`app/driver/index.tsx`) and `/driver/home` (`app/driver/home.tsx`) entry routes through `DriverStatusGate`.
  - Configured `AuthGateScreen.tsx` to mount `DriverStatusGate` for `role === "driver"`. Passenger onboarding remains untouched.
- **Google Maps Migration & Passenger Pickup Selection:**
  - Migrated map rendering from `@maplibre/maplibre-react-native` to `react-native-maps` (`PROVIDER_GOOGLE`) across `PassengerMapPreview.tsx` and `DriverMapPreview.tsx`.
  - Removed obsolete `@maplibre/maplibre-react-native` dependency from `mobile-app/package.json` after confirming zero remaining imports.
  - Added `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` to `AndroidManifest.xml` and configured `react-native-maps` plugin in `app.json` and `app.config.js`.
  - Added secure backend Google Maps proxy (`/api/maps/autocomplete`, `/api/maps/place-details`, `/api/maps/reverse-geocode`) in `backend/src/controllers/maps/maps.controller.js` and `backend/src/routes/maps.routes.js`, secured behind `authenticate` middleware with fail-closed HTTP 503 `MAPS_NOT_CONFIGURED` when `GOOGLE_MAPS_SERVER_API_KEY` is not set.
  - Implemented discriminated union return types in `mobile-app/src/services/location.service.ts` (`GetPickupResult`, `PlacesSearchResult`, `PlaceDetailsResult`) with no silent coordinate fabrications.
  - Wired session token management and 300ms debouncing into `DestinationSearchScreen.tsx` for Google Places Autocomplete.
  - Built interactive center-pin pickup adjustment with animated pin bounce, settling reverse geocoding, and explicit "Confirm Pickup Location" action in `DestinationSearchScreen.tsx`.
  - Integrated recoverable GPS error states and retry mechanism in `PassengerHomeScreen.tsx`.
  - Wired authenticated JWT token synchronization from `auth.store.tsx` to `location.service.ts` with lazy `getAuthSession()` fallback.

### Architecture & Infrastructure Decisions
- **ADR-008:** Server-Authoritative Ride Lifecycle State Machine (atomic `findOneAndUpdate`, role-based field masking, capacity validation).
- **ADR-009:** Cloudflare and Zoho Infrastructure Evaluation (open-source tools vs hosted capabilities, free-tier limits, and hosting constraints).
- **ADR-010:** Migration from MapLibre/OpenStreetMap to Google Maps via react-native-maps & Secure Backend Proxy.

---

## [Phase B Working-Tree State] — Previous Development
**Branch:** `phase-2-passenger-booking`
**Focus Area:** Operations Admin Suite & Mock Ride Lifecycle Simulation

### Backend (Node.js / Express / MongoDB)

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
