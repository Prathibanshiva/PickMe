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

### 5.1 Create or Retrieve Driver Profile
Retrieves the caller's existing `DriverProfile` or initializes a new pending record if one does not exist.

- **Endpoint:** `POST /api/driver/profile`
- **Authentication:** Bearer JWT required (`authenticate`)
- **Controller:** [createOrGetDriverProfile](file:///c:/Projects/PickMe/backend/src/controllers/driver/driver.controller.js#L9)

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

### 5.2 Submit Driver Profile & KYC Onboarding
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
- **Implementation Status:** Verified stub. Returns empty persisted result with explicit service status.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "rides": [],
  "metrics": {
    "liveRides": 0,
    "upcomingRides": 0,
    "completedRides": 0,
    "cancelledRides": 0,
    "totalRides": 0
  },
  "pagination": { "total": 0, "page": 1, "limit": 10, "pages": 0 },
  "serviceStatus": {
    "persisted": false,
    "phase": "Phase C Scheduled",
    "message": "Persistent ride storage and trip history are scheduled for Phase C (Ride Dispatch & Lifecycle). Mobile ride lifecycle currently executes via client-side state."
  }
}
```

### 10.2 Get Ride By ID
- **Endpoint:** `GET /api/admin/rides/:id`
- **Authentication:** Bearer JWT required (`authenticate` + `requireAdmin`)
- **Response (`404 Not Found`):**
```json
{
  "success": false,
  "message": "Ride #<id> not found. Persistent ride records are scheduled for activation in Phase C."
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

## 11. Mobile Client vs Backend Boundaries

| Domain | Implemented In | Storage Layer | Network Reality |
|---|---|---|---|
| Passenger Auth | Mobile App & Backend | MongoDB (`User`, `OTP`) + SecureStore | Real HTTP API (`/api/auth/*`) |
| Driver Onboarding & KYC | Mobile App & Backend | MongoDB (`DriverProfile`, `User`) | Real HTTP API (`/api/driver/*`) |
| Admin Auth & Verification | Admin Web & Backend | MongoDB (`User`) + SessionStorage | Real HTTP API (`/api/admin/auth/login`, `/me`) |
| Admin Driver Management | Admin Web & Backend | MongoDB (`DriverProfile`, `User`) | Real HTTP API (`/api/admin/drivers/*`) |
| Admin Passenger Management | Admin Web & Backend | MongoDB (`User`) | Real HTTP API (`/api/admin/passengers/*`) |
| Interactive Map View | Mobile App | MapLibre + OpenStreetMap Tiles | Local MapLibre Native Vector/Raster Canvas |
| Reverse Geocoding | Mobile App | Native OS (`expo-location`) | Device-level geocoder (Zero paid Google billing) |
| **Ride Request Creation** | **Mobile App Only** | **In-Memory Singleton** (`rideLifecycleService`) | **Client memory only (Phase C scheduled)** |
| **Driver Request Acceptance** | **Mobile App Only** | **In-Memory Singleton** (`rideLifecycleService`) | **Client memory only (Phase C scheduled)** |
| **OTP Ride Verification** | **Mobile App Only** | **In-Memory Singleton** (hardcoded code `7294`) | **Client memory only (Phase C scheduled)** |
| **Live Trip Progression** | **Mobile App Only** | **In-Memory Singleton** (`rideLifecycleService`) | **Client memory only (Phase C scheduled)** |
| **Fare Settlement & Receipts** | **Mobile App Only** | **In-Memory Summary** | **Client memory only (Phase C scheduled)** |
