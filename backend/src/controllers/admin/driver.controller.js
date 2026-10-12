const mongoose = require("mongoose");
const DriverProfile = require("../../models/DriverProfile");
const User = require("../../models/User");

// Supported rejection codes according to Stitch design
const VALID_REJECTION_CODES = [
  "dl_unreadable",
  "aadhaar_mismatch",
  "plate_obscured",
  "expired_docs",
  "liveness_fail",
  "other",
];

// Helper to escape regex special characters
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * GET /api/admin/drivers
 * List drivers with status filtering, search, and pagination.
 */
const getDrivers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};

    // 1. Status Filter
    if (status && status !== "all") {
      const validStatuses = ["pending", "approved", "rejected"];
      if (validStatuses.includes(status.toLowerCase())) {
        query.verificationStatus = status.toLowerCase();
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: ${validStatuses.join(", ")}, all`,
        });
      }
    }

    // 2. Search Filter (by User name, User phone number, or Vehicle registration number)
    if (search && typeof search === "string" && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, "i");

      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: searchRegex } },
          { phoneNumber: { $regex: searchRegex } },
        ],
      })
        .select("_id")
        .lean();

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { vehicleNumber: { $regex: searchRegex } },
      ];
    }

    const total = await DriverProfile.countDocuments(query);

    const drivers = await DriverProfile.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate("userId", "name phoneNumber email gender isBlocked isSuspended createdAt")
      .populate("verifiedBy", "name email")
      .lean();

    const formattedDrivers = drivers.map((driver) => ({
      id: driver._id,
      userId: driver.userId?._id || driver.userId,
      driverName: driver.userId?.name || "",
      phoneNumber: driver.userId?.phoneNumber || "",
      email: driver.userId?.email || "",
      gender: driver.userId?.gender || null,
      isBlocked: driver.userId?.isBlocked || false,
      isSuspended: driver.userId?.isSuspended || false,
      verificationStatus: driver.verificationStatus,
      rejectionReason: driver.rejectionReason || "",
      rejectionCode: driver.rejectionCode || "",
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber || "",
      profilePhoto: driver.profilePhoto || "",
      verifiedAt: driver.verifiedAt || null,
      verifiedBy: driver.verifiedBy
        ? {
            id: driver.verifiedBy._id,
            name: driver.verifiedBy.name,
            email: driver.verifiedBy.email,
          }
        : null,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      drivers: formattedDrivers,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    });
  } catch (error) {
    console.error("Admin Get Drivers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching drivers",
    });
  }
};

/**
 * GET /api/admin/drivers/:id
 * Retrieve a specific driver profile with verification details.
 */
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID format",
      });
    }

    // Deterministic lookup: search by DriverProfile _id first, then userId
    let driverProfile = await DriverProfile.findById(id)
      .populate("userId", "name phoneNumber email gender isBlocked isSuspended createdAt")
      .populate("verifiedBy", "name email")
      .lean();

    if (!driverProfile) {
      driverProfile = await DriverProfile.findOne({ userId: id })
        .populate("userId", "name phoneNumber email gender isBlocked isSuspended createdAt")
        .populate("verifiedBy", "name email")
        .lean();
    }

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      driver: {
        id: driverProfile._id,
        userId: driverProfile.userId?._id || driverProfile.userId,
        driverName: driverProfile.userId?.name || "",
        phoneNumber: driverProfile.userId?.phoneNumber || "",
        email: driverProfile.userId?.email || "",
        gender: driverProfile.userId?.gender || null,
        isBlocked: driverProfile.userId?.isBlocked || false,
        isSuspended: driverProfile.userId?.isSuspended || false,
        verificationStatus: driverProfile.verificationStatus,
        rejectionReason: driverProfile.rejectionReason || "",
        rejectionCode: driverProfile.rejectionCode || "",
        verifiedAt: driverProfile.verifiedAt || null,
        verifiedBy: driverProfile.verifiedBy
          ? {
              id: driverProfile.verifiedBy._id,
              name: driverProfile.verifiedBy.name,
              email: driverProfile.verifiedBy.email,
            }
          : null,
        profilePhoto: driverProfile.profilePhoto || "",
        aadhaarDocument: driverProfile.aadhaarDocument || "",
        drivingLicenceDocument: driverProfile.drivingLicenceDocument || "",
        vehicleType: driverProfile.vehicleType || null,
        vehicleNumber: driverProfile.vehicleNumber || "",
        vehiclePhoto: driverProfile.vehiclePhoto || "",
        createdAt: driverProfile.createdAt,
        updatedAt: driverProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin Get Driver By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching driver profile",
    });
  }
};

/**
 * PUT /api/admin/drivers/:id/approve
 * Approve driver profile with atomic state transition and administrator audit record.
 * Transition allowed: strictly pending -> approved.
 */
const approveDriver = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID format",
      });
    }

    // Deterministic lookup: search by DriverProfile _id first, then userId
    let driverProfile = await DriverProfile.findById(id);
    if (!driverProfile) {
      driverProfile = await DriverProfile.findOne({ userId: id });
    }

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    // State transition guard: only pending applications can be approved
    if (driverProfile.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          driverProfile.verificationStatus === "approved"
            ? "Driver profile is already approved"
            : "Cannot approve a rejected driver profile until the driver updates and resubmits their application",
      });
    }

    // Completeness check: vehicle details must be present
    if (!driverProfile.vehicleNumber || !driverProfile.vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve driver profile without complete vehicle onboarding details",
      });
    }

    // Atomic update with concurrency guard: verificationStatus must still be "pending"
    const updated = await DriverProfile.findOneAndUpdate(
      {
        _id: driverProfile._id,
        verificationStatus: "pending",
      },
      {
        $set: {
          verificationStatus: "approved",
          verifiedAt: new Date(),
          verifiedBy: req.user._id,
          rejectionReason: "",
          rejectionCode: "",
        },
      },
      { returnDocument: "after" }
    )
      .populate("userId", "name phoneNumber email")
      .populate("verifiedBy", "name email");

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Driver profile was updated concurrently or is no longer in pending status.",
      });
    }

    // Ensure User defaultRole reflects verified driver
    await User.findByIdAndUpdate(updated.userId?._id || updated.userId, {
      $set: { defaultRole: "driver" },
    });

    return res.status(200).json({
      success: true,
      message: "Driver verification approved successfully",
      driver: {
        id: updated._id,
        userId: updated.userId?._id || updated.userId,
        driverName: updated.userId?.name || "",
        verificationStatus: updated.verificationStatus,
        verifiedAt: updated.verifiedAt,
        verifiedBy: updated.verifiedBy
          ? {
              id: updated.verifiedBy._id,
              name: updated.verifiedBy.name,
              email: updated.verifiedBy.email,
            }
          : null,
        rejectionReason: "",
        rejectionCode: "",
      },
    });
  } catch (error) {
    console.error("Admin Approve Driver Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while approving driver",
    });
  }
};

/**
 * PUT /api/admin/drivers/:id/reject
 * Reject driver profile with required reason, optional code, and administrator audit record.
 * Transition allowed: strictly pending -> rejected.
 */
const rejectDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, rejectionCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID format",
      });
    }

    // Validation: rejectionReason must be non-empty string
    if (
      !rejectionReason ||
      typeof rejectionReason !== "string" ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required and cannot be empty",
      });
    }

    // Validation: rejectionCode if provided must be one of the supported codes
    if (rejectionCode && !VALID_REJECTION_CODES.includes(rejectionCode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid rejection code. Supported codes: ${VALID_REJECTION_CODES.join(", ")}`,
      });
    }

    const finalCode = rejectionCode || "other";

    // Deterministic lookup: search by DriverProfile _id first, then userId
    let driverProfile = await DriverProfile.findById(id);
    if (!driverProfile) {
      driverProfile = await DriverProfile.findOne({ userId: id });
    }

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    // State transition guard: only pending applications can be rejected
    if (driverProfile.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          driverProfile.verificationStatus === "rejected"
            ? "Driver profile is already rejected. Awaiting driver resubmission."
            : "Cannot reject an approved driver profile. Revocation or suspension requires an authorized administrative action.",
      });
    }

    // Atomic update with concurrency guard: verificationStatus must still be "pending"
    const updated = await DriverProfile.findOneAndUpdate(
      {
        _id: driverProfile._id,
        verificationStatus: "pending",
      },
      {
        $set: {
          verificationStatus: "rejected",
          rejectionReason: rejectionReason.trim(),
          rejectionCode: finalCode,
          verifiedAt: new Date(),
          verifiedBy: req.user._id,
        },
      },
      { returnDocument: "after" }
    )
      .populate("userId", "name phoneNumber email")
      .populate("verifiedBy", "name email");

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Driver profile was updated concurrently or is no longer in pending status.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver verification rejected successfully",
      driver: {
        id: updated._id,
        userId: updated.userId?._id || updated.userId,
        driverName: updated.userId?.name || "",
        verificationStatus: updated.verificationStatus,
        rejectionReason: updated.rejectionReason,
        rejectionCode: updated.rejectionCode,
        verifiedAt: updated.verifiedAt,
        verifiedBy: updated.verifiedBy
          ? {
              id: updated.verifiedBy._id,
              name: updated.verifiedBy.name,
              email: updated.verifiedBy.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Admin Reject Driver Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while rejecting driver",
    });
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
};
