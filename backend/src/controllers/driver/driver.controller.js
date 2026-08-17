const DriverProfile = require("../../models/DriverProfile");


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
    // Update profile
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

    // New submission goes back to pending
    driverProfile.verificationStatus =
      "pending";

    driverProfile.rejectionReason = "";

    driverProfile.verifiedAt = null;

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
  createOrGetDriverProfile,
  submitDriverProfile,
};