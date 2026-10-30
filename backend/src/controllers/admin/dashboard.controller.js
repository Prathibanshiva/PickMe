const mongoose = require("mongoose");
const User = require("../../models/User");
const DriverProfile = require("../../models/DriverProfile");
const Ride = require("../../models/Ride");

/**
 * GET /api/admin/dashboard/overview
 * Provides operational aggregate metrics, real driver verification queue items,
 * and clear Phase C indicators for ride persistence.
 */
const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalPassengers,
      activePassengers,
      suspendedPassengers,
      blockedPassengers,
      totalDrivers,
      pendingDrivers,
      approvedDrivers,
      rejectedDrivers,
      vehicleDistributionAgg,
      recentDriverProfiles,
      liveRides,
      completedTodayRides,
      totalRidesCount,
    ] = await Promise.all([
      // Passenger counts
      User.countDocuments({ defaultRole: "passenger" }),
      User.countDocuments({ defaultRole: "passenger", isBlocked: false, isSuspended: false }),
      User.countDocuments({ defaultRole: "passenger", isSuspended: true }),
      User.countDocuments({ defaultRole: "passenger", isBlocked: true }),

      // Driver counts
      DriverProfile.countDocuments({}),
      DriverProfile.countDocuments({ verificationStatus: "pending" }),
      DriverProfile.countDocuments({ verificationStatus: "approved" }),
      DriverProfile.countDocuments({ verificationStatus: "rejected" }),

      // Driver vehicle distribution aggregation
      DriverProfile.aggregate([
        {
          $group: {
            _id: "$vehicleType",
            count: { $sum: 1 },
          },
        },
      ]),

      // Recent driver registrations / verifications (capped at 5, safe non-PII attributes)
      DriverProfile.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name defaultRole")
        .lean(),

      // Real persistent ride metrics
      Ride.countDocuments({ status: { $in: ["accepted", "arrived", "in_progress"] } }),
      Ride.countDocuments({
        status: "completed",
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Ride.countDocuments({}),
    ]);

    // Format vehicle distribution
    const vehicleCounts = {
      auto: 0,
      sedan: 0,
      car: 0,
      bike: 0,
      suv: 0,
      unassigned: 0,
    };

    vehicleDistributionAgg.forEach((item) => {
      const type = item._id ? String(item._id).toLowerCase() : "unassigned";
      if (vehicleCounts[type] !== undefined) {
        vehicleCounts[type] = item.count;
      } else {
        vehicleCounts.unassigned += item.count;
      }
    });

    // Format safe recent driver activity (no private KYC docs, phone numbers, or credentials)
    const recentActivity = recentDriverProfiles.map((profile) => ({
      id: profile._id.toString(),
      driverName: profile.userId?.name || "Driver Partner",
      vehicleType: profile.vehicleType || "Unassigned",
      vehicleNumber: profile.vehicleNumber || "Not Provided",
      verificationStatus: profile.verificationStatus || "pending",
      rejectionReason: profile.rejectionReason || "",
      createdAt: profile.createdAt,
      verifiedAt: profile.verifiedAt || null,
    }));

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      passengers: {
        total: totalPassengers,
        active: activePassengers,
        suspended: suspendedPassengers,
        blocked: blockedPassengers,
      },
      drivers: {
        total: totalDrivers,
        pending: pendingDrivers,
        approved: approvedDrivers,
        rejected: rejectedDrivers,
        vehicleDistribution: vehicleCounts,
      },
      recentActivity,
      rides: {
        persisted: true,
        phase: "Phase C Active",
        liveRides,
        completedToday: completedTodayRides,
        totalRides: totalRidesCount,
        message: "Persistent ride storage and trip history active in MongoDB.",
      },
      scheduledRides: {
        persisted: false,
        phase: "Phase C Scheduled",
        totalScheduled: 0,
        pendingMatch: 0,
        message:
          "Scheduled ride pre-booking persistence is scheduled for Phase C.",
      },
      systemStatus: {
        network: "Bengaluru Urban",
        status: "All Systems Normal",
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Overview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while aggregating operations metrics",
    });
  }
};

module.exports = {
  getDashboardOverview,
};
