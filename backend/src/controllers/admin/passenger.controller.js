const mongoose = require("mongoose");
const User = require("../../models/User");
const DriverProfile = require("../../models/DriverProfile");

// Helper to escape regex special characters safely
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * GET /api/admin/passengers
 * List passenger accounts with status filtering, search, and bounded pagination.
 */
const getPassengers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    // Base query: strictly passenger accounts
    const query = { defaultRole: "passenger" };

    // 1. Status Filter
    if (status && status !== "all") {
      const validStatuses = ["active", "suspended", "blocked"];
      if (validStatuses.includes(status.toLowerCase())) {
        if (status.toLowerCase() === "active") {
          query.isBlocked = false;
          query.isSuspended = false;
        } else if (status.toLowerCase() === "suspended") {
          query.isSuspended = true;
        } else if (status.toLowerCase() === "blocked") {
          query.isBlocked = true;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: ${validStatuses.join(", ")}, all`,
        });
      }
    }

    // 2. Search Filter (by Name, Phone Number, Email, or ObjectId)
    if (search && typeof search === "string" && search.trim()) {
      const trimmed = search.trim();
      const sanitized = escapeRegex(trimmed);
      const searchRegex = new RegExp(sanitized, "i");

      const orConditions = [
        { name: { $regex: searchRegex } },
        { phoneNumber: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ];

      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }

      query.$or = orConditions;
    }

    const total = await User.countDocuments(query);

    const passengers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .select("_id name phoneNumber email gender defaultRole isBlocked isSuspended createdAt updatedAt")
      .lean();

    const formattedPassengers = passengers.map((p) => ({
      id: p._id.toString(),
      name: p.name || "",
      phoneNumber: p.phoneNumber || "",
      email: p.email || "",
      gender: p.gender || null,
      defaultRole: p.defaultRole,
      isBlocked: Boolean(p.isBlocked),
      isSuspended: Boolean(p.isSuspended),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      passengers: formattedPassengers,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    });
  } catch (error) {
    console.error("Admin Get Passengers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching passenger accounts",
    });
  }
};

/**
 * GET /api/admin/passengers/:id
 * Retrieve details for a specific passenger account with dual-profile detection.
 */
const getPassengerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passenger ID format",
      });
    }

    const passenger = await User.findOne({
      _id: id,
      defaultRole: "passenger",
    })
      .select("_id name phoneNumber email gender defaultRole isBlocked isSuspended createdAt updatedAt")
      .lean();

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: "Passenger account not found",
      });
    }

    // Check if user also has an associated driver application
    const driverProfile = await DriverProfile.findOne({ userId: passenger._id })
      .select("_id verificationStatus vehicleType vehicleNumber")
      .lean();

    const formattedPassenger = {
      id: passenger._id.toString(),
      name: passenger.name || "",
      phoneNumber: passenger.phoneNumber || "",
      email: passenger.email || "",
      gender: passenger.gender || null,
      defaultRole: passenger.defaultRole,
      isBlocked: Boolean(passenger.isBlocked),
      isSuspended: Boolean(passenger.isSuspended),
      createdAt: passenger.createdAt,
      updatedAt: passenger.updatedAt,
      driverProfile: driverProfile
        ? {
            id: driverProfile._id.toString(),
            verificationStatus: driverProfile.verificationStatus,
            vehicleType: driverProfile.vehicleType,
            vehicleNumber: driverProfile.vehicleNumber || "",
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      passenger: formattedPassenger,
    });
  } catch (error) {
    console.error("Admin Get Passenger By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching passenger details",
    });
  }
};

/**
 * PUT /api/admin/passengers/:id/status
 * PUT /api/admin/users/:id/status
 * Admin action to block, unblock, suspend, or restore a passenger/user account.
 * Enforces admin authorization, validates transitions, protects primary admin identity,
 * and attaches audit attribution.
 */
const updatePassengerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passenger ID format",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Passenger account not found",
      });
    }

    // Security guard: Never allow modifying the authorized administrator account
    const PROTECTED_ADMIN_EMAIL = "prathibanshiva@gmail.com";
    if (
      user.email &&
      user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: `Security violation: Cannot modify account status of the primary administrator account (${PROTECTED_ADMIN_EMAIL}).`,
      });
    }

    if (user.defaultRole === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Cannot modify account status of an administrator account via passenger management.",
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Administrators cannot modify their own account status.",
      });
    }

    // Normalizing requested state transition
    const normalizedAction = (action || "").toLowerCase().trim();
    const normalizedStatus = (status || "").toLowerCase().trim();

    let newIsBlocked = false;
    let newIsSuspended = false;
    let transitionName = "";

    if (normalizedAction === "block" || normalizedStatus === "blocked") {
      newIsBlocked = true;
      newIsSuspended = false;
      transitionName = "blocked";
    } else if (
      normalizedAction === "suspend" ||
      normalizedStatus === "suspended"
    ) {
      newIsBlocked = false;
      newIsSuspended = true;
      transitionName = "suspended";
    } else if (
      normalizedAction === "unblock" ||
      normalizedAction === "restore" ||
      normalizedAction === "activate" ||
      normalizedStatus === "active"
    ) {
      newIsBlocked = false;
      newIsSuspended = false;
      transitionName = "active";
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status action. Supported actions: 'block', 'unblock', 'suspend', 'restore' (or statuses: 'active', 'suspended', 'blocked').",
      });
    }

    // Current state check
    const currentStatus = user.isBlocked
      ? "blocked"
      : user.isSuspended
      ? "suspended"
      : "active";

    if (currentStatus === transitionName) {
      return res.status(400).json({
        success: false,
        message: `Account is already in '${transitionName}' status. No state transition required.`,
      });
    }

    // Mutate only safe account flag fields
    user.isBlocked = newIsBlocked;
    user.isSuspended = newIsSuspended;
    await user.save();

    // Audit attribution identifying the performing administrator
    const auditAttribution = {
      performedBy: {
        id: req.user._id.toString(),
        name: req.user.name || "Operations Admin",
        email: req.user.email || "",
      },
      action: transitionName,
      previousStatus: currentStatus,
      newStatus: transitionName,
      timestamp: new Date().toISOString(),
      reason:
        typeof reason === "string" ? reason.trim().slice(0, 500) : undefined,
    };

    return res.status(200).json({
      success: true,
      message: `Passenger account successfully updated to '${transitionName}'.`,
      passenger: {
        id: user._id.toString(),
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        gender: user.gender || null,
        defaultRole: user.defaultRole,
        isBlocked: user.isBlocked,
        isSuspended: user.isSuspended,
        status: transitionName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      audit: auditAttribution,
    });
  } catch (error) {
    console.error("Admin Update Passenger Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating passenger account status",
    });
  }
};

module.exports = {
  getPassengers,
  getPassengerById,
  updatePassengerStatus,
};
