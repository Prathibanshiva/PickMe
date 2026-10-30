# PickMe — Comprehensive Project Context & AI Handoff Document

**Document Version:** 1.0.0
**Current Date:** October 2026
**Primary Purpose:** Complete, self-contained handoff document allowing any AI assistant or developer in a completely fresh session (without prior conversation context) to immediately understand PickMe, its architecture, implemented functionality, technical decisions, current status, known limitations, and strict development rules.

---

## A. Project Identity & Product Vision

### 1. The Core Problem
In the Indian urban mobility landscape, commuters are forced to choose between two polarized options:
1. **Schedule-Based P2P Carpooling (Quick Ride, sRide, BlaBlaCar):** Highly cost-effective and socially acceptable, but fundamentally static. They rely on fixed office commuter routes posted hours in advance. They have no fleet dispatch, no real-time on-demand matching, and cannot dynamically absorb spontaneous passenger requests into vehicles already en route.
2. **On-Demand Taxi Aggregators (Ola, Uber, Rapido, Namma Yatri):** Purely on-demand and proximity-based. Dispatch focuses almost exclusively on "find the closest available solo vehicle." When pooling has existed (e.g., UberPool / Uber Share), it has relied on short-sighted greedy insertion rather than systematic fleet occupancy optimization.

### 2. PickMe's Product Concept
**PickMe is an AI-powered, occupancy-first shared mobility platform designed specifically for Indian urban corridors.**

Instead of treating vehicle occupancy as an optional feature bolted onto solo taxis, PickMe treats **occupancy as the primary optimization objective**:
- For every incoming trip request, the matching engine determines whether an already-active or about-to-depart vehicle traveling in a compatible corridor can absorb the passenger with minimal detour *before* dispatching a solo vehicle.
- Transportation research demonstrates private passenger vehicle occupancy in Indian metros averages only ~1.2 people per car. Effective dynamic pooling can raise per-kilometer occupancy by up to **48%**, significantly reducing congestion, emissions, and per-passenger travel costs while maximizing driver earnings per trip hour.

### 3. Shared vs. Personal Rides
PickMe offers two explicit booking modes with strict operational distinctions:
- **Shared Ride:** Passengers book individual seats (from 1 up to `capacity - 1`). The vehicle is part of the dynamic corridor pooling pool. Passengers receive reduced fares in exchange for accepting minimal detours (< 10–15% travel time impact). Bike is strictly excluded from shared rides.
- **Personal Ride:** The passenger reserves the entire vehicle exclusively. No shared-seat selector is shown. The driver is dedicated solely to that trip. **A driver with an active personal ride must never receive additional ride requests until the current trip is completed or cancelled.**

---

## B. Repository Structure

The PickMe workspace is organized as a modular monorepo containing three core applications, shared definitions, documentation, and testing collections:

```
c:\Projects\PickMe\
├── docs/                           # Central architectural and system documentation
│   ├── API_DOCUMENTATION.md        # Comprehensive backend HTTP route catalog
│   ├── CHANGELOG.md                # Chronological milestone history and uncommitted changes
│   ├── CONTEXT.md                  # This file: primary AI handoff document
│   ├── DATABASE_SCHEMA.md          # Active Mongoose models, indexes, and persistence boundaries
│   ├── DECISIONS.md                # Architecture Decision Records (ADR-001 through ADR-007)
│   ├── PROJECT_BLUEPRINT.md        # Architectural blueprint and initial milestone scope
│   └── ROADMAP.md                  # Current implementation status, tasks, and priorities
├── backend/                        # Node.js + Express + MongoDB REST API
│   ├── scripts/                    # Maintenance scripts (e.g. set-admin-password.js)
│   ├── src/
│   │   ├── app.js                  # Express application setup, global middleware, /api mount
│   │   ├── index.js                # Server entry point (starts HTTP listener on PORT)
│   │   ├── config/                 # Database connection (MongoDB via Mongoose)
│   │   ├── controllers/            # Route controllers (admin, auth, driver, user)
│   │   ├── middleware/             # auth.middleware.js, roles/admin.middleware.js
│   │   ├── models/                 # Mongoose schemas: User.js, DriverProfile.js, OTP.js
│   │   ├── routes/                 # Express routers (index.js, admin, auth, driver, user)
│   │   ├── services/               # Internal business services (otp.service.js)
│   │   └── utils/                  # Utility functions (jwt.js, otpGenerator.js)
│   ├── package.json                # Backend dependencies and run scripts
│   └── .env.example                # Template for required environment variables
├── mobile-app/                     # React Native / Expo passenger and driver client
│   ├── src/
│   │   ├── app/                    # Expo Router route definitions (file-based navigation)
│   │   │   ├── driver/             # Driver flow routes (home, incoming, accepted, live-trip, etc.)
│   │   │   └── passenger/          # Passenger flow routes (finding, booked, live, completed)
│   │   ├── components/             # Reusable UI widgets (PassengerMapPreview, etc.)
│   │   ├── screens/                # Core application screens
│   │   │   ├── driver/             # DriverHomeScreen, verification wizard, trip screens
│   │   │   └── passenger/          # PassengerHomeScreen, search, vehicle select, trip screens
│   │   ├── services/               # Client services (api, auth, driver, map, ride-lifecycle)
│   │   ├── types/                  # TypeScript interfaces (auth, driver, ride)
│   │   └── theme/                  # Design tokens, color palette, typography
│   └── package.json                # Mobile application dependencies
├── admin-dashboard/                # Dedicated React 19 + Vite 8 web application
│   ├── src/
│   │   ├── api/                    # Authenticated HTTP client and endpoint wrappers
│   │   ├── components/             # Admin UI widgets, layout, navigation, modals
│   │   ├── context/                # Admin auth context and session state
│   │   ├── pages/                  # Dashboard, Drivers, Passengers, Rides, ScheduledRides
│   │   ├── routes/                 # Protected web route definitions
│   │   └── types/                  # Admin TypeScript contracts
│   └── package.json                # Admin web application dependencies
├── shared/                         # Shared JavaScript constants and utilities
│   └── constants/
│       └── vehicles.js             # Canonical vehicle capacities and request validator
├── postman/                        # API collections and environment configurations
├── stitch_designs/                 # Stitch UI design exports and HTML references
├── RESEARCH_FRAMEWORK.md           # Academic & competitive research framework on AI matching
└── AGENTS.md                       # Root AI instructions and persistent documentation rule
```

---

## C. Technology Stack & Actual Dependency Versions

### 1. Backend Application (`backend/`)
- **Runtime & Framework:** Node.js (CommonJS), Express `5.2.1`
- **Database & ODM:** MongoDB Server (v7+), Mongoose `9.9.1`
- **Authentication & Cryptography:** JSON Web Token (`jsonwebtoken` `9.0.3`), `bcryptjs` `3.0.3`
- **Security & Utilities:** `helmet` `8.3.0`, `cors` `2.8.6`, `cookie-parser` `1.4.7`, `morgan` `1.11.0`
- **File Handling Dependencies:** `cloudinary` `2.10.0`, `multer` `2.2.0`, `multer-storage-cloudinary` `2.2.1` (installed, upload routes pending activation)
- **Validation:** `zod` `4.4.3`
- **Dev Tooling:** `nodemon` `3.1.14`

### 2. Mobile Application (`mobile-app/`)
- **Framework & Core:** React Native `0.86.0`, React `19.2.3`, Expo SDK `~57.0.8`
- **Navigation:** Expo Router `~57.0.8` (file-based routing via `mobile-app/src/app`)
- **Mapping & Geolocation:**
  - `react-native-maps` `1.27.2` (`PROVIDER_GOOGLE` native client canvas for Android and iOS)
  - Backend Google Maps Proxy (`/api/maps/autocomplete`, `/api/maps/place-details`, `/api/maps/reverse-geocode`)
  - Google Places API (New) & Google Geocoding API via server-side key (`GOOGLE_MAPS_SERVER_API_KEY`)
  - `expo-location` `~57.0.17` (Device GPS detection and native offline reverse geocoding fallback)
  - Zero server API keys in mobile bundle; mobile uses app-restricted SDK keys
- **Secure Storage:** `expo-secure-store` `~57.0.1` (persistent JWT and session caching)
- **UI & Animations:** `react-native-reanimated` `4.5.0`, `react-native-gesture-handler` `~2.32.0`, `react-native-screens` `~4.26.0`, `@expo/vector-icons` `^15.0.2`
- **Language:** TypeScript `~6.0.3`

### 3. Admin Web Dashboard (`admin-dashboard/`)
- **Framework & Bundler:** React `^19.2.7`, React DOM `^19.2.7`, Vite `^8.1.1`
- **Routing:** React Router DOM `^7.18.4`
- **Styling:** Curated Vanilla CSS Design System with dark mode, high-contrast badges, and glassmorphism ([admin-dashboard/src/index.css](file:///c:/Projects/PickMe/admin-dashboard/src/index.css))
- **Language:** TypeScript `^7.0.2`

---

## D. Product Rules & Canonical Constraints

These rules are established in [shared/constants/vehicles.js](file:///c:/Projects/PickMe/shared/constants/vehicles.js) and [docs/DECISIONS.md](file:///c:/Projects/PickMe/docs/DECISIONS.md). They must never be altered or hardcoded arbitrarily.

### 1. Canonical Vehicle Capacities (Driver Excluded)
Passenger capacities refer strictly to passenger seats:
- **Bike:** 1 seat
- **Auto:** 3 seats
- **Car:** 4 seats
- **Sedan:** 4 seats
- **SUV:** 6 seats

### 2. Shared Ride Seating Constraints
- **Bike is strictly unavailable for Shared Rides.**
- For all other vehicle categories, the maximum requested seats in a shared ride cannot exceed `capacity - 1`:
  - **Auto:** 1 to 2 seats
  - **Car:** 1 to 3 seats
  - **Sedan:** 1 to 3 seats
  - **SUV:** 1 to 5 seats
- **Rationale:** An occupancy-first shared ride must always preserve at least 1 seat for dynamic corridor pooling. Booking all seats is categorized as a Personal Ride.

### 3. Personal Ride Constraints
- All vehicle categories (Bike, Auto, Car, Sedan, SUV) support Personal Rides.
- Personal Rides reserve the entire vehicle exclusively.
- The UI must **never** expose a shared-seat selector when Personal Ride is selected.
- **Driver Exclusivity:** A driver actively fulfilling a Personal Ride must be excluded from the dispatch candidate pool until the trip is completed or cancelled.

### 4. Matching Engine Parameters (Configurable)
- **Default Matching Radius:** 2.0 kilometers around passenger pickup.
- **Driver Accept Timer:** 15 seconds. If the driver does not accept within 15 seconds, the offer cascades to the next best candidate.
- Neither parameter may be permanently hardcoded in production; both must remain admin-tunable without redeploying code.

---

## E. Authentication & Security Architecture

### 1. Passenger & Driver Authentication Flow
- Completely backend-controlled passwordless phone auth. **No Firebase Authentication.**
- **Step 1:** Client submits 10-digit phone number to `POST /api/auth/send-otp`.
- **Step 2:** Backend generates 6-digit OTP, stores it in `OTP` collection with TTL expiry (5 minutes), and logs code in development.
- **Step 3:** Client submits OTP to `POST /api/auth/verify-otp`.
- **Step 4:** Backend validates single-use OTP, creates `User` if new, verifies account is not blocked or suspended, and issues a 7-day signed JWT.
- **Step 5:** Client stores token securely via `expo-secure-store` and routes user to role selection (Passenger or Driver).
- **Session Validation:** On app launch, client checks `GET /api/user/me`. Returning users are routed directly to their home dashboard.

### 2. Admin Authentication Flow
- Admin access uses email and password via `POST /api/admin/auth/login`.
- **Single Authorized Email Whitelist:** `prathibanshiva@gmail.com`. Any other email receives HTTP `403 Forbidden` (`GATE-AUTH-403`).
- Password validation evaluates `bcrypt.compare` against `ADMIN_PASSWORD_HASH` in `.env` (or stored hashed password on User record). Passwords are created using `npm run admin:set-password` in `backend/`.
- Issues a standard JWT with `defaultRole: "admin"`.
- Admin web client stores token in `sessionStorage` (`pickme_admin_token`) and validates it on page refresh via `GET /api/admin/me`.

### 3. Access Control & Account Blocking
- Every protected route passes through [authenticate](file:///c:/Projects/PickMe/backend/src/middleware/auth.middleware.js).
- Middleware checks `user.isBlocked` and `user.isSuspended`:
  - If `isBlocked === true` → HTTP `403 Forbidden` (`"Your account has been blocked"`).
  - If `isSuspended === true` → HTTP `403 Forbidden` (`"Your account has been suspended"`).
- Admin routes also pass through [requireAdmin](file:///c:/Projects/PickMe/backend/src/middleware/roles/admin.middleware.js) verifying admin role and email whitelist.

### 4. Known Security Gaps
- SMS OTP delivery is in development mode (logged to console; real SMS gateway provider not yet wired).
- Refresh token rotation (`JWT_REFRESH_SECRET`) is defined in `.env.example` but token renewal endpoints are not yet implemented; sessions rely on 7-day access tokens.
- Never commit `.env` files or expose credentials.

---

## F. Passenger Mobile Application

### 1. Booking Flow & Navigation
- **Home (`PassengerHomeScreen`):** Displays MapLibre map, recent Bangalore destination quick-chips, interactive pickup location pin, and search bar.
- **Search (`DestinationSearchScreen`):** Search curated destinations across major Bengaluru hubs (Koramangala, Indiranagar, Whitefield, HSR Layout, Electronic City, Kempegowda Airport, etc.).
- **Vehicle Selection (`VehicleSelectionScreen`):**
  - Toggle between **Personal** and **Shared** ride modes.
  - Interactive vehicle carousel (Bike, Auto, Car, Sedan, SUV) displaying dynamic fare estimates, arrival ETAs, and seat capacities.
  - When "Shared" is selected: renders seat selector (1 to `capacity - 1`). Bike is disabled with an explanatory badge.
  - When "Personal" is selected: whole vehicle is booked; seat selector is hidden.
  - Confirms booking with payment method selector (Cash, UPI, Wallet).
- **Ride Lifecycle Screens:**
  - `FindingRideScreen`: Animated radar finding nearby drivers; connects to in-memory lifecycle.
  - `RideBookedScreen`: Driver assigned banner, vehicle details, driver rating, and 4-digit verification OTP (`7294`).
  - `LiveRideScreen`: In-trip map navigation, route progress indicator, safety emergency button.
  - `RideCompletedScreen`: Trip completion receipt, final fare breakdown, driver rating input.

### 2. Mapping & Geocoding Architecture
- Map rendered via `react-native-maps` (`PROVIDER_GOOGLE`) on both Android and iOS with custom styled markers and animated camera transitions.
- Interactive Center-Pin Pickup Selection: Passengers can adjust pickup location by dragging the map beneath a bouncing center pin, with settling reverse-geocoding and an explicit "Confirm Pickup" action.
- Places Search & Autocomplete: Proxied through backend (`/api/maps/autocomplete` and `/api/maps/place-details`) using Google Places API (New) with session token billing grouping and 300ms client debouncing.
- Reverse geocoding performed through backend Google Geocoding proxy with device-native `expo-location` fallback.
- Default center: Bengaluru urban coordinates (`12.9352° N, 77.6245° E`).
- Key segregation: Server key kept strictly in backend `.env` (`GOOGLE_MAPS_SERVER_API_KEY`); mobile client uses app-restricted SDK keys only. Returns HTTP 503 `MAPS_NOT_CONFIGURED` if key is not configured (no fake fallbacks).

---

## G. Driver Mobile Application

### 1. Onboarding & KYC Wizard
- Triggered if `DriverProfile` has not been submitted.
- 6-screen wizard:
  1. `DriverVerificationIntroScreen`: Explains verification requirements.
  2. `IdentityVerificationScreen`: Name, profile photo, Aadhaar document.
  3. `VehicleDetailsScreen`: Vehicle type selection and registration plate number.
  4. `VehiclePhotoScreen`: Vehicle photo upload.
  5. `ReviewSubmitScreen`: Summary of entered data before submission.
  6. `VerificationSubmittedScreen`: Success confirmation showing `pending` status.
- Once submitted, `DriverProfile.verificationStatus` is `"pending"`. Drivers cannot accept rides until approved.

### 2. Driver Home & Ride Lifecycle Screens
- **`DriverHomeScreen`:** Header status toggle (Online / Offline / Busy), earnings summary card, map view, incoming request trigger.
- **`IncomingRideRequestScreen`:** 15-second radial countdown timer, passenger pickup/destination, route distance, net driver earnings (85% payout), Accept and Decline buttons.
- **`DriverAcceptedScreen`:** Navigation to pickup location, passenger contact options.
- **`DriverEnRoutePickupScreen`:** Driving guidance towards passenger pickup.
- **`DriverArrivedScreen`:** Arrived notification, 4-digit PIN OTP verification modal. Entering `"7294"` unlocks the trip.
- **`DriverLiveTripScreen`:** In-trip navigation to drop-off location, Complete Trip button.
- **`DriverTripCompletedScreen`:** Summary of earnings, total trips count, return to online dashboard.

---

## H. Backend Implementation & Persistence Boundary

### 1. Registered Route Architecture
All endpoints mounted at `/api` in [backend/src/app.js](file:///c:/Projects/PickMe/backend/src/app.js):
- `/api/auth/send-otp` (POST, Public)
- `/api/auth/verify-otp` (POST, Public)
- `/api/auth/test` (GET, Public)
- `/api/user/me` (GET, Authenticated)
- `/api/driver/profile` (POST, Authenticated - Create/Get)
- `/api/driver/profile` (PUT, Authenticated - Submit KYC)
- `/api/admin/auth/login` (POST, Public Admin Login)
- `/api/admin/me` (GET, Authenticated Admin Session Check)
- `/api/admin/dashboard/overview` (GET, Authenticated Admin Overview)
- `/api/admin/drivers` (GET, Authenticated Admin Driver List)
- `/api/admin/drivers/:id` (GET, Authenticated Admin Driver Detail)
- `/api/admin/drivers/:id/approve` (PUT, Authenticated Admin Approve)
- `/api/admin/drivers/:id/reject` (PUT, Authenticated Admin Reject)
- `/api/admin/passengers` (GET, Authenticated Admin Passenger List)
- `/api/admin/passengers/:id` (GET, Authenticated Admin Passenger Detail)
- `/api/admin/passengers/:id/status` (PUT, Authenticated Admin Update Status)
- `/api/admin/users*` (Aliases for passenger endpoints)
- `/api/admin/rides` (GET, Authenticated Admin - real MongoDB telemetry & metrics)
- `/api/admin/rides/:id` (GET, Authenticated Admin - ride detail)
- `/api/admin/scheduled-rides` (GET, Phase C Stub)
- `/api/admin/scheduled-rides/:id` (GET, 404 Phase C Stub)
- `/api/rides` (POST, Authenticated - Create ride request)
- `/api/rides/active` (GET, Authenticated - Fetch caller active ride)
- `/api/rides/available` (GET, Authenticated Driver - Fetch unassigned offers)
- `/api/rides/:id` (GET, Authenticated - Inspect ride detail with role-based OTP masking)
- `/api/rides` (GET, Authenticated - List user ride history)
- `/api/rides/:id/accept` (POST, Authenticated Driver - Atomic driver acceptance)
- `/api/rides/:id/arrive` (POST, Authenticated Driver - Mark arrived at pickup)
- `/api/rides/:id/verify-otp` (POST, Authenticated Driver - PIN verification to start trip)
- `/api/rides/:id/complete` (POST, Authenticated Driver - Trip settlement)
- `/api/rides/:id/cancel` (PUT/POST, Authenticated - Cancel ride)

### 2. Database Models in MongoDB
- `User`: Collection `users`
- `DriverProfile`: Collection `driverprofiles`
- `OTP`: Collection `otps`
- `Ride`: Collection `rides` (Persistent ride lifecycle with 2dsphere indexing and atomic state machine)

---

## I. Admin Dashboard Web Application

Located in `admin-dashboard/`. Built with React 19, Vite 8, and React Router 7.
- **Authentication:** Dedicated login page (`/login`) saving JWT to `sessionStorage`. Validates against `/api/admin/auth/login`.
- **Operations Dashboard (`/`):** Real metrics fetched from `/api/admin/dashboard/overview` (passenger counts, driver counts, vehicle distribution, recent registrations).
- **Driver Verification (`/drivers`, `/drivers/:id`):** Filter by status (`pending`, `approved`, `rejected`), search, review KYC documents, Approve action, Reject action with modal for reason and standardized reason codes.
- **Passenger Management (`/passengers`):** Filter by status (`active`, `suspended`, `blocked`), search, status update modal (block, suspend, restore) with audit attribution.
- **Rides View (`/rides`):** Displays honest architectural status noting that backend ride persistence is scheduled for Phase C.
- **Scheduled Rides View (`/scheduled-rides`):** Displays honest architectural status noting that scheduled ride persistence is scheduled for Phase C.
- **Honesty Rule:** Does not fake real-time vehicle GPS positions or corridor balancing telemetry.

---

## J. Mapping Architecture & Decisions (ADR Summary)

From [docs/DECISIONS.md](file:///c:/Projects/PickMe/docs/DECISIONS.md) and commit history:
1. **ADR-001 — Removed Firebase:** Replaced with backend OTP + JWT to eliminate external billing dependencies.
2. **ADR-002 — Mobile-First:** Passenger and driver experiences are Expo React Native only; Admin dashboard is a dedicated Vite React app.
3. **ADR-003 — Canonical Seating:** Bike 1, Auto 3, Car 4, Sedan 4, SUV 6 (driver excluded).
4. **ADR-004 — Tunable Matching:** Default 2 km radius, 15 s timeout.
5. **ADR-005 — Centralized Phone Normalization:** Prevent country code stripping bugs.
6. **ADR-006 — Security First-Class:** Strict Zod/server validation, ownership checks, generic error messages.
7. **ADR-007 — Geospatial 2dsphere:** Driver queries must use MongoDB 2dsphere indexes.
8. **ADR-008 — Server-Authoritative Ride Lifecycle State Machine:** Strict transitions (`requested` -> `driver_assigned` -> `arrived` -> `in_progress` -> `completed` / `cancelled`), atomic driver assignment, role-based OTP masking.
9. **ADR-009 — Cloudflare and Zoho Infrastructure Evaluation:** Documented open-source/free tier vs paid capabilities and hosting constraints without introducing external runtime dependencies.
10. **Mapping Stack Decision:** MapLibre + OpenStreetMap raster tiles + native device geocoding (`expo-location`). **Do not reintroduce Google Maps, Google Places, Mapbox, OSRM, Valhalla, or GraphHopper without explicit architectural approval.**

---

## K. Current Git & Development State

- **Current Branch:** `phase-c-ride-lifecycle` *(Note: Check `git branch --show-current` at task start; never assume a branch name remains current).*
- **Working Tree State:** Contains **uncommitted modifications** and **untracked files** across:
  - `admin-dashboard/` (complete React 19 admin suite with real ride telemetry queries)
  - `backend/` (`Ride` model, ride routes/controllers, Zod validators, admin ride queries, set-admin-password script, test suite)
  - `mobile-app/` (`RideLifecycleService` integrated with persistent backend REST endpoints)
  - `stitch_designs/` (HTML design references)
- **Recent Git Commits:**
  - `7fe824d` (2026-09-24): fix(passenger): expand destination dataset, fix stale Google Map comment, improve empty-state UX
  - `9fe67ed` (2026-09-24): feat(passenger): migrate passenger map flow from Google Maps to MapLibre and OpenStreetMap
  - `3df707e` (2026-09-14): fix(passenger): real Google Maps, Places API proxy, interactive pickup, and navigation fixes
  - `3807dae` (2026-09-14): feat(passenger): implement initial passenger ride-booking entry flow
  - `83f994e` (2026-09-05): docs: add project blueprint and decision log
- **Preservation Rule:** Do NOT stage, commit, push, reset, or revert any of these uncommitted files unless explicitly instructed by the user.

---

## L. Completed Implementation Summary

| Feature | Verified Status | Evidence in Code |
|---|---|---|
| Passwordless Phone OTP Authentication | Implemented & Verified | `backend/src/controllers/auth/auth.controller.js` |
| Mobile Auth & Persistent Session Routing | Implemented & Verified | `mobile-app/src/services/auth.service.ts` |
| Driver 6-Screen KYC Wizard | Implemented & Verified | `mobile-app/src/screens/driver/verification/` |
| Driver Profile Submission | Implemented & Verified | `backend/src/controllers/driver/driver.controller.js` |
| Admin Whitelist & Login | Implemented & Verified | `backend/src/controllers/admin/auth.controller.js` |
| Admin Driver Approve/Reject | Implemented & Verified | `backend/src/controllers/admin/driver.controller.js` |
| Admin Passenger Block/Suspend/Restore | Implemented & Verified | `backend/src/controllers/admin/passenger.controller.js` |
| OpenStreetMap & MapLibre Integration | Implemented & Verified | `mobile-app/src/services/map.service.ts` |
| Native Reverse Geocoding | Implemented & Verified | `mobile-app/src/services/location.service.ts` |
| Vehicle Selection & Capacity Rules | Implemented & Verified | `shared/constants/vehicles.js` |
| Admin Dashboard Web App | Implemented & Verified | `admin-dashboard/src/` |
| Admin Ride Management & Metrics | Implemented & Verified | `backend/src/controllers/admin/ride.controller.js`, `dashboard.controller.js` |
| Persistent Server-Side Ride State & Lifecycle | Implemented & Verified | `backend/src/models/Ride.js`, `backend/src/controllers/ride/ride.controller.js`, `backend/src/routes/ride.routes.js`, `backend/test/ride-lifecycle.test.js` |
| Mobile Ride Lifecycle Integration | Implemented & Verified | `mobile-app/src/services/ride-lifecycle.service.ts` (REST persistence fallback/sync) |
| Driver Status Gate & Verification Enforcement | Implemented & Verified | `mobile-app/src/screens/driver/DriverStatusGate.tsx`, `backend/src/controllers/driver/driver.controller.js`, `backend/test/driver-onboarding-gate.test.js` |

---

## M. Known Limitations & Technical Gaps

1. **Real-Time Communication Gap:**
   - No WebSocket or Socket.io server is implemented yet.
   - Ride updates currently propagate via REST polling/fetches and local emitters.
   - Bi-directional push dispatch to drivers and passengers will be implemented in TASK-D3.
2. **Driver Location Streaming Gap:**
   - Driver location is simulated locally; there is no live GPS streaming to the backend.
3. **Automated Matching Engine Gap:**
   - Drivers currently claim rides via `POST /api/rides/:id/accept` (or `/api/rides/available`). An automated geospatial proximity dispatch queue with acceptance timeouts is scheduled for TASK-D4.
4. **Document Storage Gap:**
   - Driver KYC documents store placeholder strings; Cloudinary upload endpoints are not yet wired to Multer.
5. **SMS Delivery Gap:**
   - OTP codes are printed to the backend terminal (`console.log`) instead of sent via an SMS provider.

---

## N. Next Recommended Implementation Task

**Recommended Next Task:**
**TASK-D3: Real-Time WebSocket Channel for Live Ride State Synchronization**

- **Why this task?** With the persistent `Ride` model, atomic lifecycle state machine, and REST endpoints now in place, the immediate next requirement is pushing lifecycle state updates (e.g. driver assigned, vehicle arrived, ride started, ride completed) instantaneously to the passenger and driver mobile clients without relying on manual REST polling.
- **Deliverables:**
  1. Integrate Socket.io server with JWT authentication handshake in Node/Express.
  2. Implement room partitioning (`ride:<rideId>`, `user:<userId>`).
  3. Emit lifecycle events from `ride.controller.js` upon state transitions.
  4. Connect `mobile-app` Socket.io client to update `RideLifecycleService` dynamically.

---

## O. Development Workflow & Operational Constraints

Every developer and AI assistant working on PickMe must strictly adhere to these 17 rules:

1. **Work on one task at a time:** Do not attempt multiple large architectural refactors simultaneously.
2. **Inspect only relevant code before implementing:** Avoid redundant repository-wide scans.
3. **Implement directly:** Do not produce repetitive inspection reports or outlines when asked to code.
4. **Reuse existing architecture:** Extend existing controllers, routes, and services rather than creating parallel systems.
5. **Preserve working functionality:** Keep all working screens, endpoints, and helpers intact.
6. **Do not reset, revert, or overwrite unrelated work:** The working tree contains uncommitted files that must be protected.
7. **Never commit or push unless explicitly instructed:** Staging, committing, and pushing require explicit user approval.
8. **Avoid unnecessary testing:** Do not launch heavy full-suite tests when doing localized edits.
9. **Run targeted validation:** Validate specifically what was modified (e.g., check routes, test single endpoint, verify TypeScript types).
10. **Do not use paid APIs without explicit approval:** Never introduce Google Maps, Google Places, Mapbox, Twilio, or paid services without written consent.
11. **Do not use Codex unless explicitly requested.**
12. **Preserve mobile-app architecture:** Maintain Expo Router, TypeScript types, and styling conventions.
13. **Distinguish mock behavior from backend persistence:** Never describe mock or in-memory behavior as completed backend persistence.
14. **Update relevant documentation in the same task:** Whenever code changes contracts, models, roadmap, or context, update the corresponding docs immediately.
15. **Never claim success without verification:** An action is only successful if verified by code, tests, or compiler.
16. **Do not expose credentials or secrets:** Never print, log, or commit passwords, JWT secrets, database connection strings, or private keys.
17. **Follow existing architectural decisions:** Respect all decisions recorded in `docs/DECISIONS.md`.

---

## P. Instructions for a Future AI Assistant

When starting a new conversation on PickMe, follow this exact onboarding sequence:

1. **Read `docs/CONTEXT.md` first:** This file contains complete context on architecture, technology stack, product rules, and project boundaries.
2. **Read `docs/ROADMAP.md` next:** Identify current task statuses and priorities.
3. **Check the active Git branch and working tree:**
   - Run `git branch --show-current` and `git status -s`.
   - Never assume a branch name or clean working tree from prior chats.
4. **Inspect only files relevant to the requested task:** Target the specific controllers, models, or screens required.
5. **Identify the next incomplete dependency:** Confirm prerequisite tasks are in place before writing dependent code.
6. **Ask for clarification only when genuine blocking ambiguity exists:** If the answer is in the repository or docs, deduce it directly.
7. **Implement one task and verify it:** Ensure code compiles, routes match, and types align before declaring completion.
8. **Maintain documentation:** Update [docs/CHANGELOG.md](file:///c:/Projects/PickMe/docs/CHANGELOG.md), [docs/API_DOCUMENTATION.md](file:///c:/Projects/PickMe/docs/API_DOCUMENTATION.md), [docs/DATABASE_SCHEMA.md](file:///c:/Projects/PickMe/docs/DATABASE_SCHEMA.md), [docs/ROADMAP.md](file:///c:/Projects/PickMe/docs/ROADMAP.md), or [docs/CONTEXT.md](file:///c:/Projects/PickMe/docs/CONTEXT.md) whenever your changes alter the documented behavior.
