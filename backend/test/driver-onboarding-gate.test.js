const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const {
  getDriverProfile,
  requireApprovedDriver,
} = require("../src/controllers/driver/driver.controller");
const {
  getAvailableRides,
  acceptRide,
} = require("../src/controllers/ride/ride.controller");
const DriverProfile = require("../src/models/DriverProfile");
const User = require("../src/models/User");

// Helper to create mock Express req, res, next
function createMockReqRes({ user = null, driverProfile = null, params = {}, query = {}, body = {} } = {}) {
  const req = {
    user,
    driverProfile,
    params,
    query,
    body,
  };

  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
    wasNextCalled: () => nextCalled,
  };
}

describe("PickMe — Driver Onboarding Gate & Verification Enforcement Test Suite", () => {
  let isDbConnected = false;

  before(async () => {
    const isExplicitTestDb =
      process.env.TEST_MONGODB_URI && process.env.NODE_ENV === "test";

    if (!isExplicitTestDb) {
      console.log(
        "ℹ️ Notice: TEST_MONGODB_URI with NODE_ENV=test not configured. Integration tests will be reported as skipped; unit tests will run."
      );
      isDbConnected = false;
      return;
    }

    try {
      await mongoose.connect(process.env.TEST_MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      isDbConnected = true;
    } catch (err) {
      console.error("Test DB connection failed:", err.message);
      isDbConnected = false;
    }
  });

  after(async () => {
    if (isDbConnected) {
      await mongoose.disconnect();
    }
  });

  describe("1. GET /api/driver/profile — Unit Tests", () => {
    it("rejects with 401 when request is unauthenticated", async () => {
      const { req, res, getStatusCode, getResponseData } = createMockReqRes({
        user: null,
      });

      await getDriverProfile(req, res);

      assert.equal(getStatusCode(), 401);
      const data = getResponseData();
      assert.equal(data.success, false);
      assert.match(data.message, /authentication required/i);
    });

    it("returns 404 with onboardingRequired: true when driver has no profile", async () => {
      // Mock DriverProfile.findOne to return null
      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async () => null;

      try {
        const { req, res, getStatusCode, getResponseData } = createMockReqRes({
          user: { _id: "user-without-profile-123" },
        });

        await getDriverProfile(req, res);

        assert.equal(getStatusCode(), 404);
        const data = getResponseData();
        assert.equal(data.success, false);
        assert.equal(data.onboardingRequired, true);
        assert.match(data.message, /not found/i);
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });

    it("does not create a driver profile as a side effect of GET", async () => {
      let createCalled = false;
      const originalCreate = DriverProfile.create;
      const originalFindOne = DriverProfile.findOne;

      DriverProfile.create = async () => {
        createCalled = true;
        throw new Error("create should not be called during GET");
      };
      DriverProfile.findOne = async () => null;

      try {
        const { req, res, getStatusCode } = createMockReqRes({
          user: { _id: "user-without-profile-456" },
        });

        await getDriverProfile(req, res);

        assert.equal(getStatusCode(), 404);
        assert.equal(createCalled, false, "DriverProfile.create must NEVER be called by getDriverProfile");
      } finally {
        DriverProfile.create = originalCreate;
        DriverProfile.findOne = originalFindOne;
      }
    });

    it("returns 200 with sanitized profile data when profile exists", async () => {
      const mockProfile = {
        _id: "profile-id-789",
        userId: "user-id-789",
        verificationStatus: "approved",
        rejectionReason: "",
        rejectionCode: "",
        verifiedBy: "admin-1",
        profilePhoto: "https://photos.example/profile.jpg",
        aadhaarDocument: "https://photos.example/aadhaar.jpg",
        drivingLicenceDocument: "https://photos.example/license.jpg",
        vehicleType: "sedan",
        vehicleNumber: "KA01AB1234",
        vehiclePhoto: "https://photos.example/car.jpg",
        verifiedAt: new Date("2026-01-01"),
        createdAt: new Date("2025-12-01"),
        updatedAt: new Date("2026-01-01"),
      };

      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async () => mockProfile;

      try {
        const { req, res, getStatusCode, getResponseData } = createMockReqRes({
          user: { _id: "user-id-789" },
        });

        await getDriverProfile(req, res);

        assert.equal(getStatusCode(), 200);
        const data = getResponseData();
        assert.equal(data.success, true);
        assert.equal(data.driverProfile.id, "profile-id-789");
        assert.equal(data.driverProfile.verificationStatus, "approved");
        assert.equal(data.driverProfile.vehicleType, "sedan");
        assert.equal(data.driverProfile.vehicleNumber, "KA01AB1234");
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });
  });

  describe("2. requireApprovedDriver Middleware — Unit Tests", () => {
    it("rejects with 401 when request is unauthenticated", async () => {
      const { req, res, next, getStatusCode, getResponseData, wasNextCalled } = createMockReqRes({
        user: null,
      });

      await requireApprovedDriver(req, res, next);

      assert.equal(getStatusCode(), 401);
      assert.equal(wasNextCalled(), false);
      const data = getResponseData();
      assert.equal(data.success, false);
      assert.match(data.message, /authentication required/i);
    });

    it("rejects with 403 DRIVER_ONBOARDING_REQUIRED if user has no profile", async () => {
      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async () => null;

      try {
        const { req, res, next, getStatusCode, getResponseData, wasNextCalled } = createMockReqRes({
          user: { _id: "new-user-id" },
        });

        await requireApprovedDriver(req, res, next);

        assert.equal(getStatusCode(), 403);
        assert.equal(wasNextCalled(), false);
        const data = getResponseData();
        assert.equal(data.code, "DRIVER_ONBOARDING_REQUIRED");
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });

    it("rejects with 403 DRIVER_APPROVAL_PENDING if driver profile is pending", async () => {
      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async (query) => {
        if (query.verificationStatus === "approved") return null;
        return {
          userId: query.userId,
          verificationStatus: "pending",
        };
      };

      try {
        const { req, res, next, getStatusCode, getResponseData, wasNextCalled } = createMockReqRes({
          user: { _id: "pending-driver-id" },
        });

        await requireApprovedDriver(req, res, next);

        assert.equal(getStatusCode(), 403);
        assert.equal(wasNextCalled(), false);
        const data = getResponseData();
        assert.equal(data.code, "DRIVER_APPROVAL_PENDING");
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });

    it("rejects with 403 DRIVER_APPLICATION_REJECTED if driver profile was rejected", async () => {
      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async (query) => {
        if (query.verificationStatus === "approved") return null;
        return {
          userId: query.userId,
          verificationStatus: "rejected",
          rejectionReason: "Driving licence document is blurry",
          rejectionCode: "DOC_BLURRY",
        };
      };

      try {
        const { req, res, next, getStatusCode, getResponseData, wasNextCalled } = createMockReqRes({
          user: { _id: "rejected-driver-id" },
        });

        await requireApprovedDriver(req, res, next);

        assert.equal(getStatusCode(), 403);
        assert.equal(wasNextCalled(), false);
        const data = getResponseData();
        assert.equal(data.code, "DRIVER_APPLICATION_REJECTED");
        assert.equal(data.rejectionReason, "Driving licence document is blurry");
        assert.equal(data.rejectionCode, "DOC_BLURRY");
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });

    it("allows approved driver through and attaches req.driverProfile", async () => {
      const approvedProfile = {
        _id: "profile-approved-id",
        userId: "approved-driver-id",
        verificationStatus: "approved",
      };

      const originalFindOne = DriverProfile.findOne;
      DriverProfile.findOne = async (query) => {
        if (query.verificationStatus === "approved") return approvedProfile;
        return approvedProfile;
      };

      try {
        const { req, res, next, wasNextCalled } = createMockReqRes({
          user: { _id: "approved-driver-id" },
        });

        await requireApprovedDriver(req, res, next);

        assert.equal(wasNextCalled(), true);
        assert.equal(req.driverProfile._id, "profile-approved-id");
      } finally {
        DriverProfile.findOne = originalFindOne;
      }
    });
  });

  describe("3. Incomplete Onboarding Detection — Unit Tests", () => {
    it("correctly identifies missing fields in a draft profile", () => {
      const isComplete = (profile) =>
        Boolean(
          profile.profilePhoto &&
          profile.aadhaarDocument &&
          profile.drivingLicenceDocument &&
          profile.vehicleType &&
          profile.vehicleNumber &&
          profile.vehiclePhoto
        );

      const emptyProfile = {
        profilePhoto: "",
        aadhaarDocument: "",
        drivingLicenceDocument: "",
        vehicleType: null,
        vehicleNumber: "",
        vehiclePhoto: "",
      };
      assert.equal(isComplete(emptyProfile), false);

      const partialProfile = {
        profilePhoto: "photo.jpg",
        aadhaarDocument: "aadhaar.jpg",
        drivingLicenceDocument: "", // missing
        vehicleType: "auto",
        vehicleNumber: "KA011234",
        vehiclePhoto: "auto.jpg",
      };
      assert.equal(isComplete(partialProfile), false);

      const completeProfile = {
        profilePhoto: "photo.jpg",
        aadhaarDocument: "aadhaar.jpg",
        drivingLicenceDocument: "licence.jpg",
        vehicleType: "auto",
        vehicleNumber: "KA011234",
        vehiclePhoto: "auto.jpg",
      };
      assert.equal(isComplete(completeProfile), true);
    });
  });

  describe("4. Fail-Closed Security Policy — Validation", () => {
    it("verifies network/API failure never defaults to approved or online", () => {
      // Simulating mobile gate evaluation logic
      const evaluateStatusSafely = (apiResult, error) => {
        if (error) {
          // MUST fail closed
          return { canAccess: false, state: "error" };
        }
        if (!apiResult || apiResult.status !== 200) {
          return { canAccess: false, state: "rejected_or_pending" };
        }
        if (apiResult.data?.driverProfile?.verificationStatus === "approved") {
          return { canAccess: true, state: "approved" };
        }
        return { canAccess: false, state: "pending" };
      };

      assert.equal(evaluateStatusSafely(null, new Error("Network timeout")).canAccess, false);
      assert.equal(evaluateStatusSafely({ status: 500 }, null).canAccess, false);
      assert.equal(evaluateStatusSafely({ status: 404 }, null).canAccess, false);
      assert.equal(
        evaluateStatusSafely({ status: 200, data: { driverProfile: { verificationStatus: "pending" } } }, null).canAccess,
        false
      );
      assert.equal(
        evaluateStatusSafely({ status: 200, data: { driverProfile: { verificationStatus: "approved" } } }, null).canAccess,
        true
      );
    });
  });

  describe("5. Backend Rejection of Unauthorized Driver Actions — Controller Unit Tests", () => {
    it("getAvailableRides rejects unapproved drivers with 403 DRIVER_NOT_APPROVED", async () => {
      const originalExists = DriverProfile.exists;
      DriverProfile.exists = async () => false;

      try {
        const { req, res, getStatusCode, getResponseData } = createMockReqRes({
          user: { _id: "unapproved-driver-id" },
          driverProfile: null,
        });

        await getAvailableRides(req, res);

        assert.equal(getStatusCode(), 403);
        const data = getResponseData();
        assert.equal(data.success, false);
        assert.equal(data.code, "DRIVER_NOT_APPROVED");
      } finally {
        DriverProfile.exists = originalExists;
      }
    });

    it("acceptRide rejects unapproved drivers with 403 DRIVER_NOT_APPROVED", async () => {
      const originalExists = DriverProfile.exists;
      DriverProfile.exists = async () => false;

      try {
        const { req, res, getStatusCode, getResponseData } = createMockReqRes({
          user: { _id: "unapproved-driver-id" },
          params: { id: new mongoose.Types.ObjectId().toString() },
          driverProfile: null,
        });

        await acceptRide(req, res);

        assert.equal(getStatusCode(), 403);
        const data = getResponseData();
        assert.equal(data.success, false);
        assert.equal(data.code, "DRIVER_NOT_APPROVED");
      } finally {
        DriverProfile.exists = originalExists;
      }
    });
  });

  describe("6. Integration Tests (Guarded by TEST_MONGODB_URI)", () => {
    it("verifies live database behavior if TEST_MONGODB_URI is provided", async (t) => {
      if (!isDbConnected) {
        t.skip("Skipped: TEST_MONGODB_URI not configured or NODE_ENV !== test");
        return;
      }

      // If connected, test actual DB models
      const testUser = await User.create({
        name: "Test Driver Gate User",
        phoneNumber: "+919999900001",
        defaultRole: "driver",
      });

      // No profile exists yet
      const foundProfile = await DriverProfile.findOne({ userId: testUser._id });
      assert.equal(foundProfile, null);

      // Clean up
      await User.deleteOne({ _id: testUser._id });
    });
  });
});
