const mongoose = require("mongoose");
const Ride = require("../../models/Ride");
const User = require("../../models/User");

/**
 * Admin Ride Management Controller
 * Handles administrative inspection of persistent ride telemetry and corridor dispatch.
 */

const getRides = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filter query
    const query = {};

    if (status && status !== "all") {
      if (status === "live") {
        query.status = { $in: ["accepted", "arrived", "in_progress"] };
      } else if (status === "upcoming") {
        query.status = "requested";
      } else if (status === "completed") {
        query.status = "completed";
      } else if (status === "cancelled") {
        query.status = "cancelled";
      } else {
        query.status = status;
      }
    }

    // Search by rideId or passenger name/phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { phoneNumber: searchRegex }],
      }).select("_id");

      const matchedUserIds = matchedUsers.map((u) => u._id);

      query.$or = [
        { rideId: searchRegex },
        { "pickup.address": searchRegex },
        { "destination.address": searchRegex },
        { passengerId: { $in: matchedUserIds } },
      ];
    }

    // Parallel fetch: ride metrics, total count, paginated list
    const [
      liveRides,
      upcomingRides,
      completedRides,
      cancelledRides,
      totalRides,
      filteredTotal,
      rides,
    ] = await Promise.all([
      Ride.countDocuments({ status: { $in: ["accepted", "arrived", "in_progress"] } }),
      Ride.countDocuments({ status: "requested" }),
      Ride.countDocuments({ status: "completed" }),
      Ride.countDocuments({ status: "cancelled" }),
      Ride.countDocuments({}),
      Ride.countDocuments(query),
      Ride.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("passengerId", "name phoneNumber")
        .populate("driverId", "name phoneNumber")
        .lean(),
    ]);

    // Map to admin RideListItem shape
    const formattedRides = rides.map((ride) => {
      let mappedStatus = ride.status;
      if (["accepted", "arrived", "in_progress"].includes(ride.status)) {
        mappedStatus = "live";
      } else if (ride.status === "requested") {
        mappedStatus = "upcoming";
      }

      return {
        id: ride._id.toString(),
        rideId: ride.rideId || `PKM-${ride._id.toString().slice(-5)}`,
        passenger: {
          id: ride.passengerId?._id?.toString() || ride.passengerId?.toString() || "unknown",
          name: ride.passengerId?.name || "Passenger",
          phoneNumber: ride.passengerId?.phoneNumber || "N/A",
        },
        driver: ride.driverId
          ? {
              id: ride.driverId._id?.toString() || ride.driverId.toString(),
              name: ride.driverId.name || "Driver Partner",
              vehicleModel: ride.vehicleType
                ? ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1)
                : "Vehicle",
            }
          : null,
        pickup: ride.pickup?.title || ride.pickup?.address || "Pickup Location",
        dropoff: ride.destination?.title || ride.destination?.address || "Dropoff Location",
        vehicleType: ride.vehicleType
          ? ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1)
          : "Car",
        mode: ride.rideMode || "shared",
        fare: ride.finalFare !== null && ride.finalFare !== undefined ? ride.finalFare : ride.estimatedFare,
        status: mappedStatus,
        createdAt: ride.createdAt ? ride.createdAt.toISOString() : new Date().toISOString(),
        completedAt: ride.timeline?.completedAt ? ride.timeline.completedAt.toISOString() : null,
      };
    });

    return res.status(200).json({
      success: true,
      rides: formattedRides,
      metrics: {
        liveRides,
        upcomingRides,
        completedRides,
        cancelledRides,
        totalRides,
      },
      pagination: {
        total: filteredTotal,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(filteredTotal / parsedLimit) || 0,
      },
      serviceStatus: {
        persisted: true,
        phase: "Phase C Active",
        message: "Persistent MongoDB ride lifecycle foundation active.",
      },
    });
  } catch (error) {
    console.error("Admin Get Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching ride telemetry",
    });
  }
};

const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    let ride = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ride = await Ride.findById(id)
        .select("-verificationOtp")
        .populate("passengerId", "name phoneNumber email")
        .populate("driverId", "name phoneNumber email")
        .lean();
    }

    if (!ride) {
      ride = await Ride.findOne({ rideId: id })
        .select("-verificationOtp")
        .populate("passengerId", "name phoneNumber email")
        .populate("driverId", "name phoneNumber email")
        .lean();
    }

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: `Ride #${id} not found in persistent records.`,
      });
    }

    // P2: Defense-in-depth: Ensure live verificationOtp is never leaked to the admin dashboard
    if (ride.verificationOtp !== undefined) {
      delete ride.verificationOtp;
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error("Admin Get Ride By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching ride details",
    });
  }
};

module.exports = {
  getRides,
  getRideById,
};
