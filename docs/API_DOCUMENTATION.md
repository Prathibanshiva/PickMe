# PickMe — Backend API Documentation

**Current Version:** 1.0.0
**Repository Branch:** `phase-2-passenger-booking`
**Base Architecture:** Node.js (v18+) / Express 5 (`5.2.1`), MongoDB / Mongoose (`9.9.1`)
**Base URL Configuration:**
- Local Backend Server: `http://localhost:5000`
- Android Emulator Network Alias: `http://10.0.2.2:5000`
- Physical Device Testing: `http://<HOST_LAN_IP>:5000`
- API Route Prefix: `/api`

---

## 1. Architectural Overview & Conventions

All application and administrative API endpoints are mounted under the `/api` prefix in [backend/src/app.js](file:///c:/Projects/PickMe/backend/src/app.js).

### Request & Response Standards
- **Content Type:** `application/json` for all request bodies and responses.
- **Envelope Convention:** All JSON responses return a standardized boolean `success` indicator, descriptive `message`, and typed payload objects.
- **Pagination Standard:** Endpoints supporting pagination accept query parameters `page` (1-indexed, default: `1`) and `limit` (default: `10`, max bounded: `100`), returning a `pagination` metadata block (`total`, `page`, `limit`, `pages`).

### Authentication & Token Handling
- **Mechanism:** Stateless JSON Web Token (JWT) signed via HS256 using the server secret `JWT_SECRET`.
- **Token Transmission:** HTTP header `Authorization: Bearer <TOKEN>`.
- **Token Lifetime:** 7 days (`expiresIn: "7d"`).
- **Token Payload:** `{ id: User._id, phoneNumber: User.phoneNumber }`.

### Account Status & Security Enforcement
The global authentication middleware ([backend/src/middleware/auth.middleware.js](file:///c:/Projects/PickMe/backend/src/middleware/auth.middleware.js)) intercepts every protected request and validates:
1. **Token presence and format:** Rejects missing or non-Bearer authorization with HTTP `401 Unauthorized`.
2. **Signature & Expiration:** Rejects invalid or expired JWTs with HTTP `401 Unauthorized` (`TokenExpiredError` / `JsonWebTokenError`).
3. **User Existence:** Verifies the user record exists in MongoDB. Rejects deleted or missing users with HTTP `401 Unauthorized`.
4. **Account Blocking:** Checks `user.isBlocked === true`. Immediately aborts with HTTP `403 Forbidden` (`"Your account has been blocked"`).
5. **Account Suspension:** Checks `user.isSuspended === true`. Immediately aborts with HTTP `403 Forbidden` (`"Your account has been suspended"`).

### Administrative Role-Based Access Control (RBAC)
Protected administrative routes require chaining [requireAdmin](file:///c:/Projects/PickMe/backend/src/middleware/roles/admin.middleware.js) after `authenticate`.
Authorization enforces two strict conditions:
1. **Role Check:** `req.user.defaultRole === "admin"` or `req.user.isAdmin === true`.
2. **Identity Whitelist Check:** The authenticated user's email must strictly match the primary authorized administrator email (`prathibanshiva@gmail.com`).
Unauthorized callers receive HTTP `403 Forbidden` with error code `GATE-AUTH-403`.

---

## 2. Status Code Summary

| Status Code | Meaning | Typical Trigger |
|---|---|---|
| `200 OK` | Request succeeded | Successful data fetch, update, login, or verification |
| `400 Bad Request` | Validation failure | Missing required body parameters, invalid ObjectId format, illegal status transition |
| `401 Unauthorized` | Authentication failure | Missing, invalid, or expired Bearer token; invalid admin credentials |
| `403 Forbidden` | Authorization failure | Non-admin attempting admin APIs, blocked/suspended account access attempt |
| `404 Not Found` | Resource missing | Driver profile, passenger record, or ride ID not found in database |
| `409 Conflict` | Concurrency guard | Concurrent modification of pending driver verification |
| `500 Internal Error` | Server execution error | Database timeout, unhandled server exception, missing server-side hash |

---

## 3. Authentication Routes (`/api/auth`)

Mounted from [backend/src/routes/auth.routes.js](file:///c:/Projects/PickMe/backend/src/routes/auth.routes.js) to handle passenger and driver passwordless phone authentication.

### 3.1 Send OTP
Initiates passenger or driver login/registration by generating a 6-digit numeric OTP and saving it to the `OTP` collection with an automated TTL expiry.

- **Endpoint:** `POST /api/auth/send-otp`
- **Authentication:** Public (None)
- **Controller:** [sendOTP](file:///c:/Projects/PickMe/backend/src/controllers/auth/auth.controller.js#L13)

#### Request Body
```json
{
  "phoneNumber": "9876543210"
}
```
*Validation:* `phoneNumber` is required.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### Error Responses
- `400 Bad Request`: `{"success": false, "message": "Phone number is required"}`
- `500 Internal Server Error`: `{"success": false, "message": "Internal Server Error"}`

*Development Behavior:* SMS gateway is currently in development mode. The generated OTP is logged directly to the server terminal (`📱 OTP for <phoneNumber>: <otp>`).

---

### 3.2 Verify OTP
Validates the user-submitted OTP against the most recent unexpired database record. Upon success, marks the OTP as verified, checks account suspension/blocking flags, creates the `User` record if new, and issues a JWT session token.

- **Endpoint:** `POST /api/auth/verify-otp`
- **Authentication:** Public (None)
- **Controller:** [verifyOTP](file:///c:/Projects/PickMe/backend/src/controllers/auth/auth.controller.js#L46)

#### Request Body
```json
{
  "phoneNumber": "9876543210",
  "otp": "481920"
}
```
*Validation:* Both `phoneNumber` and `otp` are required strings.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66d62a3f8b0123456789abcd",
    "phoneNumber": "9876543210",
    "name": "",
    "email": "",
    "gender": null,
    "defaultRole": "passenger",
    "isBlocked": false,
    "isSuspended": false
  }
}
```

#### Error Responses
- `400 Bad Request`: `{"success": false, "message": "Phone number and OTP are required"}`
- `400 Bad Request`: `{"success": false, "message": "OTP not found or expired"}`
- `400 Bad Request`: `{"success": false, "message": "OTP already used"}`
- `400 Bad Request`: `{"success": false, "message": "OTP has expired"}`
- `400 Bad Request`: `{"success": false, "message": "Invalid OTP"}`
- `403 Forbidden`: `{"success": false, "message": "Your account has been blocked. Please contact customer support."}`
- `403 Forbidden`: `{"success": false, "message": "Your account has been suspended. Please contact customer support."}`
- `500 Internal Server Error`: `{"success": false, "message": "Internal Server Error"}`

---

### 3.3 Test Auth
Diagnostic route for verifying authentication controller connectivity.

- **Endpoint:** `GET /api/auth/test`
- **Authentication:** Public (None)
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Auth Controller Working Successfully 🚀"
  }
  ```

---

## 4. User Profile Routes (`/api/user`)

Mounted from [backend/src/routes/user.routes.js](file:///c:/Projects/PickMe/backend/src/routes/user.routes.js).

### 4.1 Get Current User Session
Returns the authenticated caller's profile data. Used by mobile apps on launch to validate cached tokens.

- **Endpoint:** `GET /api/user/me`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [getCurrentUser](file:///c:/Projects/PickMe/backend/src/controllers/user/user.controller.js#L1)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "66d62a3f8b0123456789abcd",
    "phoneNumber": "9876543210",
    "name": "Ananya Sharma",
    "email": "ananya@example.com",
    "gender": "Female",
    "defaultRole": "passenger",
    "isBlocked": false,
    "isSuspended": false
  }
}
```

#### Error Responses
- `401 Unauthorized`: Token missing, expired, or invalid.
- `403 Forbidden`: Account blocked or suspended.
- `500 Internal Server Error`: `{"success": false, "message": "Unable to retrieve user profile"}`

---

## 5. Driver Profile Routes (`/api/driver`)

Mounted from [backend/src/routes/driver.routes.js](file:///c:/Projects/PickMe/backend/src/routes/driver.routes.js).

### 5.1 Get Driver Profile Status (Read-Only)
Inspects the caller's driver profile and verification status without side effects. Never auto-creates a profile record. Used by mobile onboarding status gates and driver verification checks.

- **Endpoint:** `GET /api/driver/profile`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [getDriverProfile](file:///c:/Projects/PickMe/backend/src/controllers/driver/driver.controller.js#L15)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "driverProfile": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "verificationStatus": "approved",
    "rejectionReason": "",
    "rejectionCode": "",
    "verifiedBy": "66d620008b01234567890001",
    "profilePhoto": "https://res.cloudinary.com/.../profile.jpg",
    "aadhaarDocument": "https://res.cloudinary.com/.../aadhaar.jpg",
    "drivingLicenceDocument": "https://res.cloudinary.com/.../licence.jpg",
    "vehicleType": "sedan",
    "vehicleNumber": "KA01AB1234",
    "vehiclePhoto": "https://res.cloudinary.com/.../vehicle.jpg",
    "verifiedAt": "2026-09-02T12:00:00.000Z",
    "createdAt": "2026-09-02T10:00:00.000Z",
    "updatedAt": "2026-09-02T12:00:00.000Z"
  }
}
```

#### Error Responses
- `401 Unauthorized`: Token missing, expired, or invalid (`{"success": false, "message": "Authentication required"}`).
- `404 Not Found`: No driver profile exists for the caller (`{"success": false, "onboardingRequired": true, "message": "Driver profile not found. Please complete driver onboarding."}`).
- `500 Internal Server Error`: `{"success": false, "message": "Unable to retrieve driver profile"}`

---

### 5.2 Create or Retrieve Driver Profile
Retrieves the caller's existing `DriverProfile` or initializes a new pending record if one does not exist.

- **Endpoint:** `POST /api/driver/profile`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [createOrGetDriverProfile](file:///c:/Projects/PickMe/backend/src/controllers/driver/driver.controller.js#L132)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "driverProfile": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "verificationStatus": "pending",
    "rejectionReason": "",
    "rejectionCode": "",
    "verifiedBy": null,
    "profilePhoto": "",
    "aadhaarDocument": "",
    "drivingLicenceDocument": "",
    "vehicleType": null,
    "vehicleNumber": "",
    "vehiclePhoto": "",
    "verifiedAt": null,
    "createdAt": "2026-09-02T10:00:00.000Z",
    "updatedAt": "2026-09-02T10:00:00.000Z"
  }
}
```

---

### 5.3 Submit Driver Profile & KYC Onboarding
Submits complete driver identity and vehicle registration details. Updates the associated `User` record's name and transitions the driver profile to `pending` review.

- **Endpoint:** `PUT /api/driver/profile`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [submitDriverProfile](file:///c:/Projects/PickMe/backend/src/controllers/driver/driver.controller.js#L91)

#### Request Body
```json
{
  "driverName": "Rajesh Kumar",
  "profilePhoto": "placeholder_driver_avatar",
  "aadhaarDocument": "placeholder_aadhaar_doc",
  "drivingLicenceDocument": "placeholder_dl_doc",
  "vehicleType": "sedan",
  "vehicleNumber": "KA01AB1234",
  "vehiclePhoto": "placeholder_car_photo"
}
```
*Validation:*
- All 7 fields are required: `driverName`, `profilePhoto`, `aadhaarDocument`, `drivingLicenceDocument`, `vehicleType`, `vehicleNumber`, `vehiclePhoto`.
- `vehicleType` must match model enum: `"bike" | "auto" | "car" | "sedan" | "suv"`.
- If the driver profile is already `verificationStatus === "approved"`, updates are rejected.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Driver profile submitted successfully",
  "driverProfile": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "verificationStatus": "pending",
    "rejectionReason": "",
    "rejectionCode": "",
    "verifiedBy": null,
    "profilePhoto": "placeholder_driver_avatar",
    "aadhaarDocument": "placeholder_aadhaar_doc",
    "drivingLicenceDocument": "placeholder_dl_doc",
    "vehicleType": "sedan",
    "vehicleNumber": "KA01AB1234",
    "vehiclePhoto": "placeholder_car_photo",
    "verifiedAt": null,
    "createdAt": "2026-09-02T10:00:00.000Z",
    "updatedAt": "2026-09-02T10:15:00.000Z"
  },
  "user": {
    "id": "66d62a3f8b0123456789abcd",
    "name": "Rajesh Kumar"
  }
}
```

#### Error Responses
- `400 Bad Request`: `{"success": false, "message": "All driver onboarding fields are required"}`
- `400 Bad Request`: `{"success": false, "message": "Approved driver profile cannot be modified"}`
- `404 Not Found`: `{"success": false, "message": "Driver profile not found"}`

---

## 6. Admin Authentication & Verification Routes (`/api/admin`)

Mounted from [backend/src/routes/admin.routes.js](file:///c:/Projects/PickMe/backend/src/routes/admin.routes.js).

### 6.1 Administrator Login
Verifies administrator email and password against bcrypt hash, creates or confirms the administrator user record with `defaultRole: "admin"`, and issues a privileged JWT session.

- **Endpoint:** `POST /api/admin/auth/login`
- **Authentication:** Public (None)
- **Controller:** [loginAdmin](file:///c:/Projects/PickMe/backend/src/controllers/admin/auth.controller.js#L12)

#### Request Body
```json
{
  "email": "prathibanshiva@gmail.com",
  "password": "<ADMIN_PASSWORD>"
}
```
*Validation:*
- `email` and `password` are required.
- Normalized email must strictly equal `prathibanshiva@gmail.com`. Any other email yields HTTP `403 Forbidden`.
- Password is validated using `bcrypt.compare` against `process.env.ADMIN_PASSWORD_HASH` (or stored hashed password on User record).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Administrator authenticated successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "66d620008b0123456789aaaa",
    "email": "prathibanshiva@gmail.com",
    "name": "Prathiban Shiva",
    "role": "admin",
    "phoneNumber": "",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: `{"success": false, "message": "Email address and password are required."}`
- `401 Unauthorized`: `{"success": false, "message": "Invalid email or password.", "code": "GATE-AUTH-401"}`
- `403 Forbidden`: `{"success": false, "message": "Access restricted. You do not have administrator clearance.", "code": "GATE-AUTH-403"}`
- `500 Internal Server Error`: `{"success": false, "message": "Administrator password hash is not configured on the server..."}`

---

### 6.2 Administrator Session Verification
Validates that the current bearer session is active and possesses administrative privileges.

- **Endpoint:** `GET /api/admin/me`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Admin session verified",
  "admin": {
    "id": "66d620008b0123456789aaaa",
    "phoneNumber": "",
    "name": "Prathiban Shiva",
    "email": "prathibanshiva@gmail.com",
    "role": "admin",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
}
```

---

## 7. Admin Operations & Telemetry Routes (`/api/admin`)

### 7.1 Operations Dashboard Overview
Aggregates live operational counts directly from MongoDB collections (`users` and `driverprofiles`), calculates vehicle distribution, formats recent driver registrations, and returns explicit status markers for ride telemetry.

- **Endpoint:** `GET /api/admin/dashboard/overview`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getDashboardOverview](file:///c:/Projects/PickMe/backend/src/controllers/admin/dashboard.controller.js#L10)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "timestamp": "2026-10-12T16:20:00.000Z",
  "passengers": {
    "total": 45,
    "active": 42,
    "suspended": 2,
    "blocked": 1
  },
  "drivers": {
    "total": 12,
    "pending": 3,
    "approved": 8,
    "rejected": 1,
    "vehicleDistribution": {
      "auto": 4,
      "sedan": 3,
      "car": 2,
      "bike": 2,
      "suv": 1,
      "unassigned": 0
    }
  },
  "recentActivity": [
    {
      "id": "66d62b508b0123456789abce",
      "driverName": "Rajesh Kumar",
      "vehicleType": "sedan",
      "vehicleNumber": "KA01AB1234",
      "verificationStatus": "pending",
      "rejectionReason": "",
      "createdAt": "2026-09-02T10:00:00.000Z",
      "verifiedAt": null
    }
  ],
  "rides": {
    "persisted": false,
    "phase": "Phase C Scheduled",
    "liveRides": 0,
    "completedToday": 0,
    "totalRides": 0,
    "message": "Persistent ride storage and trip history are scheduled for Phase C (Ride Dispatch & Lifecycle). Mobile ride lifecycle currently executes via client-side state."
  },
  "scheduledRides": {
    "persisted": false,
    "phase": "Phase C Scheduled",
    "totalScheduled": 0,
    "pendingMatch": 0,
    "message": "Scheduled ride pre-booking persistence is scheduled for Phase C."
  },
  "systemStatus": {
    "network": "Bengaluru Urban",
    "status": "All Systems Normal"
  }
}
```

---

## 8. Admin Driver Management Routes (`/api/admin/drivers`)

### 8.1 List Drivers
Retrieves driver profiles with pagination, verification status filter, and multi-field text search.

- **Endpoint:** `GET /api/admin/drivers`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getDrivers](file:///c:/Projects/PickMe/backend/src/controllers/admin/driver.controller.js#L24)
- **Query Parameters:**
  - `status` (optional): `"pending" | "approved" | "rejected" | "all"`
  - `search` (optional): string matched case-insensitively against User name, User phone number, or vehicle registration number.
  - `page` (optional): integer (default: `1`)
  - `limit` (optional): integer between 1 and 100 (default: `10`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "drivers": [
    {
      "id": "66d62b508b0123456789abce",
      "userId": "66d62a3f8b0123456789abcd",
      "driverName": "Rajesh Kumar",
      "phoneNumber": "9876543210",
      "email": "rajesh@example.com",
      "gender": "Male",
      "isBlocked": false,
      "isSuspended": false,
      "verificationStatus": "pending",
      "rejectionReason": "",
      "rejectionCode": "",
      "vehicleType": "sedan",
      "vehicleNumber": "KA01AB1234",
      "profilePhoto": "placeholder_driver_avatar",
      "verifiedAt": null,
      "verifiedBy": null,
      "createdAt": "2026-09-02T10:00:00.000Z",
      "updatedAt": "2026-09-02T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### 8.2 Get Driver By ID
Retrieves full driver verification data including KYC documents by DriverProfile `_id` or associated User `_id`.

- **Endpoint:** `GET /api/admin/drivers/:id`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getDriverById](file:///c:/Projects/PickMe/backend/src/controllers/admin/driver.controller.js#L129)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "driver": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "driverName": "Rajesh Kumar",
    "phoneNumber": "9876543210",
    "email": "rajesh@example.com",
    "gender": "Male",
    "isBlocked": false,
    "isSuspended": false,
    "verificationStatus": "pending",
    "rejectionReason": "",
    "rejectionCode": "",
    "verifiedAt": null,
    "verifiedBy": null,
    "profilePhoto": "placeholder_driver_avatar",
    "aadhaarDocument": "placeholder_aadhaar_doc",
    "drivingLicenceDocument": "placeholder_dl_doc",
    "vehicleType": "sedan",
    "vehicleNumber": "KA01AB1234",
    "vehiclePhoto": "placeholder_car_photo",
    "createdAt": "2026-09-02T10:00:00.000Z",
    "updatedAt": "2026-09-02T10:15:00.000Z"
  }
}
```

---

### 8.3 Approve Driver Profile
Performs atomic verification transition from `pending` to `approved`. Sets `verifiedAt`, stamps `verifiedBy` with the acting admin's ID, clears prior rejection flags, and updates the User's `defaultRole` to `"driver"`.

- **Endpoint:** `PUT /api/admin/drivers/:id/approve`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [approveDriver](file:///c:/Projects/PickMe/backend/src/controllers/admin/driver.controller.js#L206)

#### Business Rules & Validation:
- Only profiles currently in `pending` status may be approved.
- Rejected profiles cannot be approved directly; the driver must edit and resubmit their application first.
- Requires vehicle details (`vehicleType` and `vehicleNumber`) to be present.
- Uses atomic query `{ _id, verificationStatus: "pending" }` to prevent race conditions.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Driver verification approved successfully",
  "driver": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "driverName": "Rajesh Kumar",
    "verificationStatus": "approved",
    "verifiedAt": "2026-10-12T16:25:00.000Z",
    "verifiedBy": {
      "id": "66d620008b0123456789aaaa",
      "name": "Prathiban Shiva",
      "email": "prathibanshiva@gmail.com"
    },
    "rejectionReason": "",
    "rejectionCode": ""
  }
}
```

---

### 8.4 Reject Driver Profile
Transitions a driver profile from `pending` to `rejected`, recording the mandatory rejection reason, structured rejection code, timestamp, and administrator audit record.

- **Endpoint:** `PUT /api/admin/drivers/:id/reject`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [rejectDriver](file:///c:/Projects/PickMe/backend/src/controllers/admin/driver.controller.js#L315)

#### Request Body
```json
{
  "rejectionReason": "Driving licence image is blurry and expiration date cannot be validated.",
  "rejectionCode": "dl_unreadable"
}
```
*Validation:*
- `rejectionReason` is required and must be a non-empty string.
- `rejectionCode` (optional) must be one of: `"dl_unreadable" | "aadhaar_mismatch" | "plate_obscured" | "expired_docs" | "liveness_fail" | "other"`. Defaults to `"other"` if omitted.
- Only profiles with `verificationStatus === "pending"` can be rejected.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Driver verification rejected successfully",
  "driver": {
    "id": "66d62b508b0123456789abce",
    "userId": "66d62a3f8b0123456789abcd",
    "driverName": "Rajesh Kumar",
    "verificationStatus": "rejected",
    "rejectionReason": "Driving licence image is blurry and expiration date cannot be validated.",
    "rejectionCode": "dl_unreadable",
    "verifiedAt": "2026-10-12T16:28:00.000Z",
    "verifiedBy": {
      "id": "66d620008b0123456789aaaa",
      "name": "Prathiban Shiva",
      "email": "prathibanshiva@gmail.com"
    }
  }
}
```

---

## 9. Admin Passenger Management Routes (`/api/admin/passengers` & `/api/admin/users`)

### 9.1 List Passengers
Retrieves passenger accounts (`defaultRole: "passenger"`) with status filtering (`active`, `suspended`, `blocked`), search, and pagination.

- **Endpoint:** `GET /api/admin/passengers` (alias: `GET /api/admin/users`)
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getPassengers](file:///c:/Projects/PickMe/backend/src/controllers/admin/passenger.controller.js#L14)
- **Query Parameters:**
  - `status` (optional): `"active" | "suspended" | "blocked" | "all"`
  - `search` (optional): string matched against name, phone number, email, or exact ObjectId.
  - `page` (optional): integer (default: `1`)
  - `limit` (optional): integer (default: `10`, max: `100`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "passengers": [
    {
      "id": "66d62a3f8b0123456789abcd",
      "name": "Ananya Sharma",
      "phoneNumber": "9876543210",
      "email": "ananya@example.com",
      "gender": "Female",
      "defaultRole": "passenger",
      "isBlocked": false,
      "isSuspended": false,
      "createdAt": "2026-08-16T12:00:00.000Z",
      "updatedAt": "2026-08-16T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### 9.2 Get Passenger By ID
Retrieves details for a specific passenger account and inspects whether the user also possesses an associated driver onboarding profile.

- **Endpoint:** `GET /api/admin/passengers/:id` (alias: `GET /api/admin/users/:id`)
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getPassengerById](file:///c:/Projects/PickMe/backend/src/controllers/admin/passenger.controller.js#L109)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "passenger": {
    "id": "66d62a3f8b0123456789abcd",
    "name": "Ananya Sharma",
    "phoneNumber": "9876543210",
    "email": "ananya@example.com",
    "gender": "Female",
    "defaultRole": "passenger",
    "isBlocked": false,
    "isSuspended": false,
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z",
    "driverProfile": null
  }
}
```

---

### 9.3 Update Account Status (Block / Suspend / Restore)
Modifies account status flags (`isBlocked`, `isSuspended`) on a passenger/user account.

- **Endpoint:** `PUT /api/admin/passengers/:id/status` (alias: `PUT /api/admin/users/:id/status`)
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [updatePassengerStatus](file:///c:/Projects/PickMe/backend/src/controllers/admin/passenger.controller.js#L180)

#### Request Body
```json
{
  "action": "suspend",
  "reason": "Repeated ride cancellations under investigation"
}
```
*Supported Actions & Statuses:*
- `block` / `blocked` → `isBlocked: true, isSuspended: false`
- `suspend` / `suspended` → `isBlocked: false, isSuspended: true`
- `unblock` / `restore` / `activate` / `active` → `isBlocked: false, isSuspended: false`

#### Security Guards:
- Modifying the authorized administrator account (`prathibanshiva@gmail.com`) is strictly blocked (HTTP `403 Forbidden`).
- Modifying any account with `defaultRole: "admin"` is blocked (HTTP `403 Forbidden`).
- Administrators cannot modify their own account status (HTTP `403 Forbidden`).
- Idempotency guard: If the account is already in the target state, returns HTTP `400 Bad Request`.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Passenger account successfully updated to 'suspended'.",
  "passenger": {
    "id": "66d62a3f8b0123456789abcd",
    "name": "Ananya Sharma",
    "phoneNumber": "9876543210",
    "email": "ananya@example.com",
    "gender": "Female",
    "defaultRole": "passenger",
    "isBlocked": false,
    "isSuspended": true,
    "status": "suspended",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-10-12T16:30:00.000Z"
  },
  "audit": {
    "performedBy": {
      "id": "66d620008b0123456789aaaa",
      "name": "Prathiban Shiva",
      "email": "prathibanshiva@gmail.com"
    },
    "action": "suspended",
    "previousStatus": "active",
    "newStatus": "suspended",
    "timestamp": "2026-10-12T16:30:00.000Z",
    "reason": "Repeated ride cancellations under investigation"
  }
}
```

---

## 10. Ride Telemetry & Scheduled Rides (Phase C Architectural Status)

The backend provides administrative inspection endpoints for rides and scheduled rides to satisfy admin dashboard integration while explicitly maintaining honest system state.

### 10.1 List Rides (Phase C Architecture Stub)
- **Endpoint:** `GET /api/admin/rides`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getRides](file:///c:/Projects/PickMe/backend/src/controllers/admin/ride.controller.js#L7)
- **Implementation Status:** Active & Persisted. Queries MongoDB `rides` collection with status filtering (`live`, `upcoming`, `completed`, `cancelled`), text search, pagination, and real aggregated telemetry metrics.
- **Query Parameters:**
  - `status`: Filter by status (`all`, `live`, `upcoming`, `completed`, `cancelled`).
  - `search`: Case-insensitive search on `rideId`, pickup/dropoff address, or passenger name/phone.
  - `page`: 1-indexed page number (default: `1`).
  - `limit`: Bounded results per page (default: `10`, max: `100`).
- **Response (`200 OK`):**
```json
{
  "success": true,
  "rides": [
    {
      "id": "670c1a2b3c4d5e6f7a8b9c0d",
      "rideId": "PKM-48291",
      "passenger": {
        "id": "66d62a3f8b0123456789abcd",
        "name": "Ananya Sharma",
        "phoneNumber": "9876543210"
      },
      "driver": {
        "id": "66d62a3f8b0123456789abce",
        "name": "Rajesh Kumar",
        "vehicleModel": "Sedan"
      },
      "pickup": "4th Block, Koramangala",
      "dropoff": "100ft Road, Indiranagar",
      "vehicleType": "Sedan",
      "mode": "shared",
      "fare": 280,
      "status": "live",
      "createdAt": "2026-10-13T10:30:00.000Z",
      "completedAt": null
    }
  ],
  "metrics": {
    "liveRides": 3,
    "upcomingRides": 1,
    "completedRides": 14,
    "cancelledRides": 2,
    "totalRides": 20
  },
  "pagination": { "total": 20, "page": 1, "limit": 10, "pages": 2 },
  "serviceStatus": {
    "persisted": true,
    "phase": "Phase C Active",
    "message": "Persistent MongoDB ride lifecycle foundation active."
  }
}
```

### 10.2 Get Ride By ID
- **Endpoint:** `GET /api/admin/rides/:id`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getRideById](file:///c:/Projects/PickMe/backend/src/controllers/admin/ride.controller.js#L140)
- **Response (`200 OK`):** Returns full populated `Ride` document with passenger and driver partner profiles.
- **Response (`404 Not Found`):**
```json
{
  "success": false,
  "message": "Ride #<id> not found in persistent records."
}
```

### 10.3 List Scheduled Rides (Phase C Architecture Stub)
- **Endpoint:** `GET /api/admin/scheduled-rides`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Controller:** [getScheduledRides](file:///c:/Projects/PickMe/backend/src/controllers/admin/scheduled-ride.controller.js#L8)
- **Implementation Status:** Verified stub. Returns empty scheduled queue with explicit service status.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "scheduledRides": [],
  "metrics": {
    "totalScheduled": 0,
    "assigned": 0,
    "confirmed": 0,
    "pendingMatch": 0,
    "cancelled": 0
  },
  "pagination": { "total": 0, "page": 1, "limit": 10, "pages": 0 },
  "serviceStatus": {
    "persisted": false,
    "phase": "Phase C Scheduled",
    "message": "Scheduled ride pre-booking persistence and the automated driver-match queue are scheduled for Phase C (Ride Dispatch & Lifecycle). The mobile booking flow does not yet write scheduled trips to MongoDB."
  }
}
```

### 10.4 Get Scheduled Ride By ID
- **Endpoint:** `GET /api/admin/scheduled-rides/:id`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Response (`404 Not Found`):**
```json
{
  "success": false,
  "message": "Scheduled ride #<id> not found. Persistent scheduled ride records are scheduled for Phase C."
}
```

---

## 11. Ride Lifecycle Endpoints (`/api/rides`)

Mounted from [backend/src/routes/ride.routes.js](file:///c:/Projects/PickMe/backend/src/routes/ride.routes.js).
Provides the persistent, server-authoritative ride lifecycle for passengers, drivers, and operations administrators.

### 11.1 Create Ride Booking Request
Passenger initiates a persistent ride request. Enforces canonical vehicle capacities (Bike 1, Auto 3, Car 4, Sedan 4, SUV 6) and shared seat rules (Bike prohibited for shared; requested seats 1 to `capacity - 1`). Generates a 4-digit verification OTP and returns it in the response to the booking passenger.

- **Endpoint:** `POST /api/rides`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [createRide](file:///c:/Projects/PickMe/backend/src/controllers/ride/ride.controller.js#L68)
- **Request Body:**
```json
{
  "pickup": {
    "address": "4th Block, Koramangala, Bengaluru",
    "title": "4th Block, Koramangala",
    "coordinates": [77.6245, 12.9352]
  },
  "destination": {
    "address": "100ft Road, Indiranagar, Bengaluru",
    "title": "100ft Road, Indiranagar",
    "coordinates": [77.6408, 12.9784]
  },
  "vehicleType": "sedan",
  "rideMode": "shared",
  "requestedSeats": 2,
  "estimatedFare": 280,
  "distanceKm": 5.4,
  "durationMin": 18,
  "paymentMethod": "cash"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Ride request created successfully",
  "ride": {
    "id": "670c1a2b3c4d5e6f7a8b9c0d",
    "rideId": "PKM-48291",
    "passengerId": "66d62a3f8b0123456789abcd",
    "driverId": null,
    "vehicleType": "sedan",
    "rideMode": "shared",
    "requestedSeats": 2,
    "pickup": { ... },
    "destination": { ... },
    "estimatedFare": 280,
    "finalFare": null,
    "driverEarnings": 238,
    "paymentMethod": "cash",
    "paymentStatus": "pending",
    "status": "requested",
    "verificationOtp": "7294",
    "timeline": { "requestedAt": "2026-10-13T10:30:00.000Z" }
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g. Bike in shared mode, requested seats exceeding capacity - 1).
  - `409 Conflict`: Passenger already has an active ride in progress (`requested`, `accepted`, `arrived`, `in_progress`).

### 11.2 Get Active Ride
Retrieves the caller's active trip. If caller is a passenger, returns active ride where `passengerId = user._id`. If caller is a driver, returns active assigned ride where `driverId = user._id`.

- **Endpoint:** `GET /api/rides/active` (Alias: `GET /api/rides/my-active`)
- **Authentication:** Bearer JWT required (`authenticate`)
- **Success Response (`200 OK`):** Returns formatted active `ride` (or `{"success": true, "ride": null}` if idle). Verification OTP is included for the passenger and masked for the driver.

### 11.3 Get Available Ride Requests (Driver Dispatch Feed)
Allows verified driver partners to inspect pending unassigned ride requests (`status: "requested"`). Drivers on an active Personal Ride are blocked from viewing or accepting candidate offers until trip terminal state.

- **Endpoint:** `GET /api/rides/available`
- **Authentication:** Bearer JWT required (`authenticate`, must have `driver` role or approved `DriverProfile`)
- **Query Parameters:** `vehicleType` (optional), `limit` (default: 10, max: 25).
- **Success Response (`200 OK`):** Returns array of available unassigned ride offers. Verification OTP is strictly omitted from this feed.

### 11.4 Get Ride Details By ID
- **Endpoint:** `GET /api/rides/:id`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Authorization:** Only the booking passenger, assigned driver, active candidate drivers (for unassigned offers), or administrators can view ride details. Other callers receive HTTP `403 Forbidden`. Verification OTP is exposed only to the passenger and administrator.

### 11.5 List Ride History
- **Endpoint:** `GET /api/rides`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Query Parameters:** `status` (optional filter), `page` (default: 1), `limit` (default: 10, max: 50).
- **Success Response (`200 OK`):** Returns paginated ride history for caller with pagination metadata.

### 11.6 Accept Ride (Driver Assignment)
Driver accepts a pending ride offer. Uses atomic `findOneAndUpdate` with status guard `{ status: "requested", driverId: null }` to prevent race conditions and conflicting assignments. Enforces Personal Ride driver exclusivity.

- **Endpoint:** `POST /api/rides/:id/accept`
- **Authentication:** Bearer JWT required (`authenticate`, driver role or approved profile)
- **Success Response (`200 OK`):** `{"success": true, "message": "Ride accepted successfully", "ride": { ... "status": "accepted" }}`
- **Error Responses:**
  - `403 Forbidden`: Caller is not an approved driver partner.
  - `409 Conflict`: Ride was already accepted by another driver, or driver is currently fulfilling an active Personal Ride.
  - `400 Bad Request`: Ride is cancelled or not in a requestable state.

### 11.7 Driver Arrived at Pickup
Assigned driver marks arrival at pickup. Atomically transitions status from `accepted` to `arrived` and stamps `timeline.arrivedAt`.

- **Endpoint:** `POST /api/rides/:id/arrive`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Authorization:** Caller must be the assigned driver (`ride.driverId = user._id`). Unassigned drivers receive HTTP `403 Forbidden`.

### 11.8 Verify OTP and Start Trip
Driver enters the 4-digit PIN provided in person by the passenger. Server validates the code against `ride.verificationOtp` atomically in the database query filter (`{ _id: id, driverId, status: "arrived", verificationOtp: otp }`). If correct, atomically transitions status from `arrived` to `in_progress` and stamps `timeline.startedAt`. Protected by rate limiter `verifyOtpLimiter` (maximum 5 attempts per 15-minute window per driver/ride).

- **Endpoint:** `POST /api/rides/:id/verify-otp`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Rate Limiting:** `5 attempts / 15 minutes` via `express-rate-limit`
- **Request Body:** `{"otp": "1234"}`
- **Error Responses:**
  - `400 Bad Request`: Invalid OTP code (`{"success": false, "message": "Invalid verification OTP"}`). Never discloses the expected OTP.
  - `403 Forbidden`: Caller is not the assigned driver.
  - `400 Bad Request`: Ride is not in `arrived` state.
  - `429 Too Many Requests`: Rate limit exceeded (`{"success": false, "message": "Too many failed OTP verification attempts. Please wait 15 minutes before trying again."}`).

### 11.9 Complete Trip
Driver reaches dropoff destination and completes the ride. Atomically transitions status to `completed`, stamps `timeline.completedAt`, records authoritative `finalFare`, computes driver payout earnings (`Math.round(finalFare * 0.85)`), and updates `paymentStatus` to `"completed"`.

- **Endpoint:** `POST /api/rides/:id/complete`
- **Authentication:** Bearer JWT required (`authenticate`, assigned driver only)
- **Success Response (`200 OK`):** `{"success": true, "message": "Ride completed successfully", "ride": { ... "status": "completed" }}`

### 11.10 Cancel Ride
Passenger, assigned driver, or administrator cancels an active ride. Atomically transitions status to `cancelled`, stamps `timeline.cancelledAt`, and records `cancellation.cancelledBy` and `cancellation.reason`. Completed or already-cancelled rides cannot be modified. If another operation mutates ride status concurrently, returns HTTP 409 Conflict.

- **Endpoint:** `PUT /api/rides/:id/cancel` (Alias: `POST /api/rides/:id/cancel`)
- **Authentication:** Bearer JWT required (`authenticate`)
- **Request Body:** `{"reason": "Passenger cancelled due to change of plans"}`
- **Error Responses:**
  - `400 Bad Request`: Ride is already completed or cancelled.
  - `403 Forbidden`: Caller is neither the passenger, the assigned driver, nor an administrator.
  - `409 Conflict`: The ride status changed before cancellation could be applied (`{"success": false, "message": "The ride status changed before the cancellation could be applied. Please refresh and try again."}`).

---

## 12. Mobile Client vs Backend Boundaries

| Domain | Implemented In | Storage Layer | Network Reality |
|---|---|---|---|
| Passenger Auth | Mobile App & Backend | MongoDB (`User`, `OTP`) + SecureStore | Real HTTP API (`/api/auth/*`) |
| Driver Onboarding & KYC | Mobile App & Backend | MongoDB (`DriverProfile`, `User`) | Real HTTP API (`/api/driver/*`) |
| Admin Auth & Verification | Admin Web & Backend | MongoDB (`User`) + SessionStorage | Real HTTP API (`/api/admin/auth/login`, `/me`) |
| Admin Driver Management | Admin Web & Backend | MongoDB (`DriverProfile`, `User`) | Real HTTP API (`/api/admin/drivers/*`) |
| Admin Passenger Management | Admin Web & Backend | MongoDB (`User`) | Real HTTP API (`/api/admin/passengers/*`) |
| Interactive Map View | Mobile App | Google Maps SDK via `react-native-maps` | Native Google Maps SDK Canvas |
| Places Autocomplete & Search | Mobile App & Backend | Backend Proxy (`/api/maps/autocomplete`) | Google Places API (New) via Server Key |
| Place Coordinate Resolution | Mobile App & Backend | Backend Proxy (`/api/maps/place-details`) | Google Place Details (New) via Server Key |
| Reverse Geocoding | Mobile App & Backend | Backend Proxy (`/api/maps/reverse-geocode`) + `expo-location` fallback | Google Geocoding API / Native OS Fallback |
| **Ride Request Creation** | **Mobile App & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`POST /api/rides`)** |
| **Driver Request Acceptance** | **Mobile App & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`POST /api/rides/:id/accept`)** |
| **OTP Ride Verification** | **Mobile App & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`POST /api/rides/:id/verify-otp`)** |
| **Live Trip Progression** | **Mobile App & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`arrive`, `verify-otp`, `complete`)** |
| **Fare Settlement & Receipts** | **Mobile App & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`completed` finalFare persisted)** |
| **Admin Ride Telemetry** | **Admin Web & Backend** | **MongoDB (`rides`)** | **Real HTTP API (`GET /api/admin/rides`)** |
| **Scheduled Ride Queue** | **Stub** | **None** | **Scheduled for Phase C subsequent tasks** |
| **Live GPS Streaming** | **Mobile App Simulation** | **Client Memory** | **Real-time WebSockets scheduled for Phase C Task 3** |

---

## 13. Google Maps Platform Proxy API (`/api/maps/*`)

Server-side proxy for Google Maps Platform APIs. The server key (`GOOGLE_MAPS_SERVER_API_KEY`) is stored securely in backend environment variables and is never bundled with or sent to mobile clients. If the key is missing from environment configuration, all endpoints return HTTP `503 Service Unavailable` with `MAPS_NOT_CONFIGURED`.

All endpoints require an authenticated user session (`authenticate` middleware) to prevent unauthenticated quota exhaustion.

---

### 13.1 Places Autocomplete
Search for addresses, establishments, and localities with optional geographic biasing and session billing grouping.

- **Endpoint:** `GET /api/maps/autocomplete`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [autocompletePlaces](file:///c:/Projects/PickMe/backend/src/controllers/maps/maps.controller.js#L43)
- **Upstream Service:** Google Places API (New) — `POST https://places.googleapis.com/v1/places:autocomplete`

#### Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `input` | String | **Yes** | Text query to autocomplete (minimum 1 character) |
| `sessiontoken` | String | No | UUID string for grouping autocomplete requests into a single billing session |
| `lat` | Number | No | Latitude for circular geographic biasing |
| `lng` | Number | No | Longitude for circular geographic biasing |
| `radius` | Number | No | Bias radius in metres (default: `35000`) |

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "predictions": [
    {
      "placeId": "ChIJbU60qdsWrjsR4qqxfDHCpnY",
      "title": "Koramangala",
      "subtitle": "Bengaluru, Karnataka, India",
      "description": "Koramangala, Bengaluru, Karnataka, India"
    }
  ]
}
```

#### Error Responses:
- `400 Bad Request`: `{"success": false, "code": "INVALID_INPUT", "message": "Query parameter 'input' is required and must not be blank."}`
- `502 Bad Gateway`: Upstream Google Places API returned an error.
- `503 Service Unavailable`: `{"success": false, "code": "MAPS_NOT_CONFIGURED", "message": "Google Maps is not configured on this server. Set the GOOGLE_MAPS_SERVER_API_KEY environment variable and restart the backend."}`

---

### 13.2 Place Details
Resolves a Google `placeId` into structured coordinates (`latitude`, `longitude`) and verified display name / formatted address. Commits the autocomplete billing session.

- **Endpoint:** `GET /api/maps/place-details`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [getPlaceDetails](file:///c:/Projects/PickMe/backend/src/controllers/maps/maps.controller.js#L143)
- **Upstream Service:** Google Places API (New) — `GET https://places.googleapis.com/v1/places/:id`

#### Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `place_id` | String | **Yes** | Google Place ID obtained from `/autocomplete` |
| `sessiontoken` | String | No | UUID session token to commit the autocomplete billing session |

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "details": {
    "placeId": "ChIJbU60qdsWrjsR4qqxfDHCpnY",
    "name": "Koramangala",
    "formattedAddress": "Koramangala, Bengaluru, Karnataka, India",
    "latitude": 12.9352,
    "longitude": 77.6245
  }
}
```

#### Error Responses:
- `400 Bad Request`: Missing `place_id`.
- `422 Unprocessable Entity`: Google returned the place record without geometry.
- `502 Bad Gateway`: Upstream Google Places Details error.
- `503 Service Unavailable`: Server key not configured.

---

### 13.3 Reverse Geocoding
Converts raw GPS latitude and longitude coordinates into a human-readable title and subtitle without fabricating locations.

- **Endpoint:** `GET /api/maps/reverse-geocode`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [reverseGeocode](file:///c:/Projects/PickMe/backend/src/controllers/maps/maps.controller.js#L232)
- **Upstream Service:** Google Geocoding API — `GET https://maps.googleapis.com/maps/api/geocode/json`

#### Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | Number | **Yes** | Latitude as a decimal number |
| `lng` | Number | **Yes** | Longitude as a decimal number |

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "address": {
    "title": "100 Feet Road",
    "subtitle": "Indiranagar, Bengaluru, Karnataka",
    "formattedAddress": "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    "latitude": 12.9784,
    "longitude": 77.6408
  }
}
```
*Note: If Google returns `ZERO_RESULTS`, the endpoint returns a coordinate string title rather than a fabricated address.*
