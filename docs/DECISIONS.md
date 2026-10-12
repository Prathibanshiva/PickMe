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
