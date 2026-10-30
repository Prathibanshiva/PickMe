const DriverProfile = require("../../models/DriverProfile");
const User = require("../../models/User");


// ============================================
// GET DRIVER PROFILE (read-only, no creation)
// ============================================

/**
 * GET /api/driver/profile
 * Returns the caller's existing DriverProfile.
 * Returns 404 (with onboardingRequired flag) when no profile exists.
 * Never auto-creates a profile — creation is explicit via POST.
 */
const getDriverProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user._id;

    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        onboardingRequired: true,
        message: "Driver profile not found. Please complete driver onboarding.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver profile retrieved successfully",
      driverProfile: {
        id: driverProfile._id,
        userId: driverProfile.userId,
        verificationStatus: driverProfile.verificationStatus,
        rejectionReason: driverProfile.rejectionReason,
        rejectionCode: driverProfile.rejectionCode || "",
        verifiedBy: driverProfile.verifiedBy || null,
        profilePhoto: driverProfile.profilePhoto,
        aadhaarDocument: driverProfile.aadhaarDocument,
        drivingLicenceDocument: driverProfile.drivingLicenceDocument,
        vehicleType: driverProfile.vehicleType,
        vehicleNumber: driverProfile.vehicleNumber,
        vehiclePhoto: driverProfile.vehiclePhoto,
        verifiedAt: driverProfile.verifiedAt,
        createdAt: driverProfile.createdAt,
        updatedAt: driverProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Driver Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve driver profile",
    });
  }
};


// ============================================
// REQUIRE APPROVED DRIVER MIDDLEWARE
// ============================================

/**
 * Middleware: requireApprovedDriver
 * Rejects requests from drivers who have not completed onboarding
 * or who have not received admin approval.
 *
 * Usage: chain after `authenticate` on driver-only routes.
 */
const requireApprovedDriver = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const driverProfile = await DriverProfile.findOne({
      userId: req.user._id,
      verificationStatus: "approved",
    });

    if (!driverProfile) {
      // Determine the specific reason to help the client display the correct state
      const anyProfile = await DriverProfile.findOne({ userId: req.user._id });

      if (!anyProfile) {
        return res.status(403).json({
          success: false,
          code: "DRIVER_ONBOARDING_REQUIRED",
          message: "Driver onboarding is not complete. Please submit your driver profile first.",
        });
      }

      if (anyProfile.verificationStatus === "pending") {
        return res.status(403).json({
          success: false,
          code: "DRIVER_APPROVAL_PENDING",
          message: "Your driver application is under review. You cannot go online until an administrator approves it.",
        });
      }

      if (anyProfile.verificationStatus === "rejected") {
        return res.status(403).json({
          success: false,
          code: "DRIVER_APPLICATION_REJECTED",
          message: "Your driver application was rejected. Please review the rejection reason and resubmit.",
          rejectionReason: anyProfile.rejectionReason || "",
          rejectionCode: anyProfile.rejectionCode || "",
        });
      }

      return res.status(403).json({
        success: false,
        code: "DRIVER_NOT_APPROVED",
        message: "Your driver profile has not been approved.",
      });
    }

    // Attach the approved profile so downstream controllers can use it without a second query
    req.driverProfile = driverProfile;
    next();
  } catch (error) {
    console.error("requireApprovedDriver middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify driver approval status",
    });
  }
};


// ============================================
// CREATE OR GET DRIVER PROFILE
// ============================================

const createOrGetDriverProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let driverProfile = await DriverProfile.findOne({
      userId,
    });

    if (!driverProfile) {
      driverProfile = await DriverProfile.create({
        userId,
        verificationStatus: "pending",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver profile retrieved successfully",

      driverProfile: {
        id: driverProfile._id,
        userId: driverProfile.userId,

        verificationStatus:
          driverProfile.verificationStatus,

        rejectionReason:
          driverProfile.rejectionReason,

        rejectionCode:
          driverProfile.rejectionCode || "",

        verifiedBy:
          driverProfile.verifiedBy || null,

        profilePhoto:
          driverProfile.profilePhoto,

        aadhaarDocument:
          driverProfile.aadhaarDocument,

        drivingLicenceDocument:
          driverProfile.drivingLicenceDocument,

        vehicleType:
          driverProfile.vehicleType,

        vehicleNumber:
          driverProfile.vehicleNumber,

        vehiclePhoto:
          driverProfile.vehiclePhoto,

        verifiedAt:
          driverProfile.verifiedAt,

        createdAt:
          driverProfile.createdAt,

        updatedAt:
          driverProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Create/Get Driver Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create or retrieve driver profile",
    });
  }
};


// ============================================
// SUBMIT DRIVER PROFILE
// ============================================

const submitDriverProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      driverName,
      profilePhoto,
      aadhaarDocument,
      drivingLicenceDocument,
      vehicleType,
      vehicleNumber,
      vehiclePhoto,
    } = req.body;

    // -----------------------------
    // Validate required fields
    // -----------------------------

    if (
      !driverName ||
      !driverName.trim() ||
      !profilePhoto ||
      !aadhaarDocument ||
      !drivingLicenceDocument ||
      !vehicleType ||
      !vehicleNumber ||
      !vehiclePhoto
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All driver onboarding fields are required",
      });
    }

    // -----------------------------
    // Find driver profile
    // -----------------------------

    const driverProfile =
      await DriverProfile.findOne({
        userId,
      });

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message:
          "Driver profile not found",
      });
    }

    // -----------------------------
    // Prevent editing approved profile
    // -----------------------------

    if (
      driverProfile.verificationStatus ===
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Approved driver profile cannot be modified",
      });
    }

    // -----------------------------
    // Update User name
    // -----------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    user.name = driverName.trim();

    await user.save();

    // -----------------------------
    // Update Driver Profile
    // -----------------------------

    driverProfile.profilePhoto =
      profilePhoto;

    driverProfile.aadhaarDocument =
      aadhaarDocument;

    driverProfile.drivingLicenceDocument =
      drivingLicenceDocument;

    driverProfile.vehicleType =
      vehicleType;

    driverProfile.vehicleNumber =
      vehicleNumber;

    driverProfile.vehiclePhoto =
      vehiclePhoto;

    driverProfile.verificationStatus =
      "pending";

    driverProfile.rejectionReason = "";

    driverProfile.rejectionCode = "";

    driverProfile.verifiedAt = null;

    driverProfile.verifiedBy = null;

    await driverProfile.save();

    return res.status(200).json({
      success: true,
      message:
        "Driver profile submitted successfully",

      driverProfile: {
        id: driverProfile._id,
        userId: driverProfile.userId,

        verificationStatus:
          driverProfile.verificationStatus,

        rejectionReason:
          driverProfile.rejectionReason,

        rejectionCode:
          driverProfile.rejectionCode || "",

        verifiedBy:
          driverProfile.verifiedBy || null,

        profilePhoto:
          driverProfile.profilePhoto,

        aadhaarDocument:
          driverProfile.aadhaarDocument,

        drivingLicenceDocument:
          driverProfile.drivingLicenceDocument,

        vehicleType:
          driverProfile.vehicleType,

        vehicleNumber:
          driverProfile.vehicleNumber,

        vehiclePhoto:
          driverProfile.vehiclePhoto,

        verifiedAt:
          driverProfile.verifiedAt,

        createdAt:
          driverProfile.createdAt,

        updatedAt:
          driverProfile.updatedAt,
      },

      user: {
        id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(
      "Submit Driver Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit driver profile",
    });
  }
};


module.exports = {
  getDriverProfile,
  requireApprovedDriver,
  createOrGetDriverProfile,
  submitDriverProfile,
};