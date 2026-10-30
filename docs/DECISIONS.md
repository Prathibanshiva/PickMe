# PickMe — Architecture Decision Log

Decisions recorded here predate or are not inferable from the code alone.
Entries are intentionally brief.

---

**ADR-001 — Removed Firebase Phone Auth**
Firebase Phone Auth was evaluated and partially implemented, then fully removed. Replaced
with a backend-controlled OTP flow (`send-otp` / `verify-otp` endpoints, `OTP` model with
MongoDB TTL) + JWT issuance, to eliminate a paid external dependency and keep auth
fully backend-owned.

---

**ADR-002 — Mobile-first; no public website yet**
PickMe is React Native / Expo only for now. No separate passenger/driver website is planned
for this phase, but the architecture stays web-compatible for a future web version. The Admin
Dashboard is a dedicated React + Vite web app.

---

**ADR-003 — Vehicle types and seat capacities**
Bike: 1 seat, Auto: 3, Car: 4, Sedan: 4, SUV: 6 (all passenger-only, driver excluded).
These are the canonical values — do not duplicate or diverge in any model, UI, or algorithm.

---

**ADR-004 — AI matching defaults are admin-configurable**
Default matching radius: 2 km. Default driver accept timer: 15 seconds. Neither value is
hardcoded — both are admin-configurable so they can be tuned without a code deploy.

---

**ADR-005 — Phone number normalization must be centralized**
All phone number normalization (stripping country code, ensuring 10-digit format) must go
through one shared utility. Never duplicate this logic per controller — a prior bug wrongly
stripped a leading "91" as a country code from numbers that genuinely started with 91.

---

**ADR-006 — Security is first-class from day one**
OTP rate limiting and cooldown enforced server-side; Zod validation on all inputs; server-side
ownership checks on all protected resources; no secrets in mobile source; generic user-facing
errors with detailed server-side logging only.

---

**ADR-007 — Geospatial indexing via MongoDB 2dsphere**
Driver location and ride matching queries will use MongoDB 2dsphere indexes rather than
brute-force Haversine distance calculation across all active drivers.

---

**ADR-008 — Server-Authoritative Ride Lifecycle & State Machine**
Ride records are persisted in MongoDB collection `rides`. Lifecycle transitions must strictly
follow the server-authoritative state machine: `requested -> accepted -> arrived -> in_progress -> completed`
(or `cancelled`). Clients cannot bypass states or supply arbitrary statuses. State mutations and driver
assignments use atomic database updates (`findOneAndUpdate`) with status preconditions to prevent
concurrent double-booking. Verification OTP (4 digits) is generated server-side and only exposed to the
booking passenger; drivers must verify in-person upon pickup. Drivers on active Personal Rides are
exclusively locked from other ride assignments until trip completion or cancellation.

---

**ADR-009 — Infrastructure Evaluation: Cloudflare and Zoho**
- **Cloudflare Analysis:**
  - *Open-Source vs Hosted:* Cloudflare maintains open-source tools (`cloudflared` tunnel daemon under Apache 2.0; `Pingora` asynchronous Rust proxy engine) separate from its proprietary edge network.
  - *Free Tier Capabilities:* Unmetered L3/L4/L7 DDoS protection, global CDN caching, authoritative DNS, basic WAF rules, Bot Fight Mode, Turnstile (privacy-first CAPTCHA replacement), and Workers (100,000 requests/day).
  - *Current Architecture Need:* Not required for local development. For future staging/production, `cloudflared` offers zero-cost origin shielding without opening inbound router ports or exposing public IPs.
- **Zoho Catalyst Analysis:**
  - *Student Program:* Zoho Catalyst offers a free student tier providing frontend hosting (Slate), serverless Node.js functions (AppSail/CloudScale), and storage without credit cards.
  - *Verification Needed Before Adoption:* (1) PickMe uses a persistent Express server with long-lived MongoDB connections, requiring AppSail container verification rather than cold-start FaaS; (2) outbound MongoDB Atlas replica set connectivity; (3) WebSocket support required for Phase C real-time dispatch; (4) academic accreditation renewal rules.
- *Decision:* Retain existing local Node.js + MongoDB Atlas architecture. Zero external infrastructure dependencies added.

---

**ADR-010 — Migration from MapLibre/OpenStreetMap to Google Maps via react-native-maps & Secure Backend Proxy**
- *Context:* PickMe previously used `@maplibre/maplibre-react-native` with OpenStreetMap raster tiles. In Indian urban corridors (e.g. Bengaluru), OSM tiles lack address-level POI resolution, live search autocomplete, and building-level accuracy essential for taxi/carpool pickup dispatch.
- *Decision:*
  1. Replace `@maplibre/maplibre-react-native` on mobile with `react-native-maps` (`PROVIDER_GOOGLE`).
  2. Implement a secure backend proxy (`/api/maps/autocomplete`, `/api/maps/place-details`, `/api/maps/reverse-geocode`) using Google Places API (New) and Google Geocoding API.
  3. Strict Key Segregation: Mobile clients hold app-restricted SDK keys only (Android SHA-1 + package `com.pickme.app`; iOS bundle ID `com.pickme.app`). The server-side key (`GOOGLE_MAPS_SERVER_API_KEY`) is stored strictly in backend environment variables and never exposed to mobile bundles.
  4. No Fake Fallbacks: If `GOOGLE_MAPS_SERVER_API_KEY` is missing, the backend returns HTTP 503 `MAPS_NOT_CONFIGURED` instead of returning mock/fabricated locations.
  5. Session Token Billing Grouping: Places Autocomplete queries are grouped using client-generated UUID session tokens and finalized upon Place Details lookup, minimizing Google Cloud billing.
  6. Device-Native GPS: `expo-location` is retained for device-level GPS acquisition (`getCurrentPositionAsync`) with zero Google Cloud API cost. Native reverse-geocoding serves as secondary fallback when network/proxy is unreachable.
