const mongoose = require("mongoose");
const { randomInt } = require("crypto");
const Ride = require("../../models/Ride");
const DriverProfile = require("../../models/DriverProfile");
const {
  createRideSchema,
  verifyOtpSchema,
  cancelRideSchema,
} = require("../../validators/ride.validator");
const { RIDE_MODES } = require("../../../../shared/constants/vehicles");

/**
 * Format ride document for client response.
 * Masks verification OTP for drivers and unassigned viewers.
 */
const formatRideResponse = (ride, currentUserId, isAdmin = false) => {
  if (!ride) return null;

  const isPassenger =
    ride.passengerId &&
    (ride.passengerId._id || ride.passengerId).toString() === currentUserId?.toString();

  const isDriver =
    ride.driverId &&
    (ride.driverId._id || ride.driverId).toString() === currentUserId?.toString();

  const formatted = {
    id: ride._id.toString(),
    rideId: ride.rideId,
    passengerId: ride.passengerId?._id
      ? {
        id: ride.passengerId._id.toString(),
        name: ride.passengerId.name || "Passenger",
        phoneNumber: ride.passengerId.phoneNumber,
      }
      : ride.passengerId?.toString(),
    driverId: ride.driverId?._id
      ? {
        id: ride.driverId._id.toString(),
        name: ride.driverId.name || "Driver Partner",
        phoneNumber: ride.driverId.phoneNumber,
      }
      : ride.driverId
        ? ride.driverId.toString()
        : null,
    vehicleType: ride.vehicleType,
    rideMode: ride.rideMode,
    requestedSeats: ride.requestedSeats,
    pickup: ride.pickup,
    destination: ride.destination,
    distanceKm: ride.distanceKm,
    durationMin: ride.durationMin,
    estimatedFare: ride.estimatedFare,
    finalFare: ride.finalFare,
    driverEarnings: ride.driverEarnings,
    paymentMethod: ride.paymentMethod,
    paymentStatus: ride.paymentStatus,
    status: ride.status,
    timeline: ride.timeline,
    cancellation: ride.cancellation,
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };

  // P2: Only expose verificationOtp to the passenger who must present it upon driver arrival
  if (isPassenger) {
    formatted.verificationOtp = ride.verificationOtp;
  }

  return formatted;
};

/**
 * POST /api/rides
 * Passenger creates a persistent ride booking request.
 */
const createRide = async (req, res) => {
  try {
    const parseResult = createRideSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid ride request parameters",
        errors: parseResult.error.issues,
      });
    }

    const {
      pickup,
      destination,
      vehicleType,
      rideMode,
      requestedSeats,
      estimatedFare,
      distanceKm,
      durationMin,
      paymentMethod,
    } = parseResult.data;

    // Check if passenger already has an active ride
    const existingActiveRide = await Ride.findOne({
      passengerId: req.user._id,
      status: { $in: ["requested", "accepted", "arrived", "in_progress"] },
    });

    if (existingActiveRide) {
      return res.status(409).json({
        success: false,
        message: "You already have an active ride in progress. Complete or cancel it first.",
        activeRideId: existingActiveRide._id.toString(),
      });
    }

    // Generate a cryptographically secure 4-digit verification OTP
    const verificationOtp = String(randomInt(1000, 10000));

    // Construct persistent ride document
    const newRide = new Ride({
      passengerId: req.user._id,
      vehicleType,
      rideMode,
      requestedSeats,
      pickup: {
        address: pickup.address,
        title: pickup.title || pickup.address.split(",")[0] || "",
        subtitle: pickup.subtitle || "",
        location: {
          type: "Point",
          coordinates: pickup.coordinates,
        },
      },
      destination: {
        address: destination.address,
        title: destination.title || destination.address.split(",")[0] || "",
        subtitle: destination.subtitle || "",
        location: {
          type: "Point",
          coordinates: destination.coordinates,
        },
      },
      distanceKm,
      durationMin,
      estimatedFare,
      driverEarnings: Math.round(estimatedFare * 0.85),
      paymentMethod,
      verificationOtp,
      status: "requested",
      timeline: {
        requestedAt: new Date(),
      },
    });

    await newRide.save();

    return res.status(201).json({
      success: true,
      message: "Ride request created successfully",
      ride: formatRideResponse(newRide, req.user._id),
    });
  } catch (error) {
    console.error("Create Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error while creating ride",
    });
  }
};

/**
 * GET /api/rides/active
 * Retrieve the active ride for the authenticated user (passenger or driver).
 */
const getActiveRide = async (req, res) => {
  try {
    let activeRide = null;

    // First check if user is a passenger on an active ride
    activeRide = await Ride.findOne({
      passengerId: req.user._id,
      status: { $in: ["requested", "accepted", "arrived", "in_progress"] },
    })
      .populate("driverId", "name phoneNumber")
      .populate("passengerId", "name phoneNumber");

    // If not found, check if user is an assigned driver on an active ride
    if (!activeRide) {
      activeRide = await Ride.findOne({
        driverId: req.user._id,
        status: { $in: ["accepted", "arrived", "in_progress"] },
      })
        .populate("driverId", "name phoneNumber")
        .populate("passengerId", "name phoneNumber");
    }

    if (!activeRide) {
      return res.status(200).json({
        success: true,
        ride: null,
      });
    }

    return res.status(200).json({
      success: true,
      ride: formatRideResponse(activeRide, req.user._id, req.user.defaultRole === "admin"),
    });
  } catch (error) {
    console.error("Get Active Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching active ride",
    });
  }
};

/**
 * GET /api/rides/available
 * Retrieve available (unassigned) ride requests for active drivers.
 */
const getAvailableRides = async (req, res) => {
  try {
    const isApprovedDriver =
      req.driverProfile?.verificationStatus === "approved" ||
      (await DriverProfile.exists({ userId: req.user._id, verificationStatus: "approved" }));

    if (!isApprovedDriver) {
      return res.status(403).json({
        success: false,
        code: "DRIVER_NOT_APPROVED",
        message: "Only verified and approved drivers can inspect available ride offers",
      });
    }

    // Drivers with active personal ride cannot view/accept other offers
    const activePersonalRide = await Ride.findOne({
      driverId: req.user._id,
      status: { $in: ["accepted", "arrived", "in_progress"] },
      rideMode: RIDE_MODES.PERSONAL,
    });

    if (activePersonalRide) {
      return res.status(200).json({
        success: true,
        rides: [],
        message: "Driver is currently fulfilling an exclusive Personal Ride",
      });
    }

    const { vehicleType, limit = 10 } = req.query;
    const query = {
      status: "requested",
      driverId: null,
    };

    if (vehicleType) {
      query.vehicleType = String(vehicleType).toLowerCase();
    }

    const maxResults = Math.min(25, Math.max(1, parseInt(limit, 10) || 10));

    const availableRides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .limit(maxResults)
      .populate("passengerId", "name phoneNumber")
      .lean();

    const formattedRides = availableRides.map((ride) =>
      formatRideResponse(ride, req.user._id)
    );

    return res.status(200).json({
      success: true,
      count: formattedRides.length,
      rides: formattedRides,
    });
  } catch (error) {
    console.error("Get Available Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching available rides",
    });
  }
};

/**
 * GET /api/rides/:id
 * Retrieve details of a specific ride by ID or rideId.
 */
const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    let ride = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ride = await Ride.findById(id)
        .populate("passengerId", "name phoneNumber")
        .populate("driverId", "name phoneNumber");
    }

    if (!ride) {
      ride = await Ride.findOne({ rideId: id })
        .populate("passengerId", "name phoneNumber")
        .populate("driverId", "name phoneNumber");
    }

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: `Ride ${id} not found`,
      });
    }

    const currentUserId = req.user._id.toString();
    const isPassenger =
      ride.passengerId &&
      (ride.passengerId._id || ride.passengerId).toString() === currentUserId;
    const isDriver =
      ride.driverId &&
      (ride.driverId._id || ride.driverId).toString() === currentUserId;
    const isAdmin = req.user.defaultRole === "admin";
    const isAvailableOffer = ride.status === "requested" && !ride.driverId;

    if (!isPassenger && !isDriver && !isAdmin && !isAvailableOffer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this ride",
      });
    }

    return res.status(200).json({
      success: true,
      ride: formatRideResponse(ride, req.user._id, isAdmin),
    });
  } catch (error) {
    console.error("Get Ride By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching ride details",
    });
  }
};

/**
 * GET /api/rides
 * Retrieve paginated ride history for the authenticated user.
 */
const getMyRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {
      $or: [{ passengerId: req.user._id }, { driverId: req.user._id }],
    };

    if (status && status !== "all") {
      query.status = status;
    }

    const [total, rides] = await Promise.all([
      Ride.countDocuments(query),
      Ride.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("passengerId", "name phoneNumber")
        .populate("driverId", "name phoneNumber"),
    ]);

    const formattedRides = rides.map((r) =>
      formatRideResponse(r, req.user._id, req.user.defaultRole === "admin")
    );

    return res.status(200).json({
      success: true,
      rides: formattedRides,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get My Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching ride history",
    });
  }
};

/**
 * POST /api/rides/:id/accept
 * Driver accepts dispatch offer.
 * Uses atomic findOneAndUpdate to prevent race conditions.
 */
const acceptRide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID format" });
    }

    // Verify driver permissions: strictly requires approved driver profile
    const isApprovedDriver =
      req.driverProfile?.verificationStatus === "approved" ||
      (await DriverProfile.exists({ userId: req.user._id, verificationStatus: "approved" }));

    if (!isApprovedDriver) {
      return res.status(403).json({
        success: false,
        code: "DRIVER_NOT_APPROVED",
        message: "Only verified and approved drivers can accept rides",
      });
    }

    // Check if driver is already fulfilling any active ride that precludes acceptance.
    // A driver on an active Personal Ride has exclusive dedication — no further offers.
    // A driver on an active Shared Ride may not accept a new Personal Ride (exclusivity conflict).
    const existingActiveRide = await Ride.findOne({
      driverId: req.user._id,
      status: { $in: ["accepted", "arrived", "in_progress"] },
    });

    if (existingActiveRide) {
      if (existingActiveRide.rideMode === RIDE_MODES.PERSONAL) {
        // Driver is on an exclusive Personal Ride — cannot take anything else.
        return res.status(409).json({
          success: false,
          message: "Cannot accept a new ride while fulfilling an exclusive Personal Ride",
        });
      }
      // Driver is on a Shared Ride. They cannot accept a new Personal Ride
      // (that would violate the personal-ride exclusivity guarantee for the new passenger).
      // Check what mode the target ride is before blocking.
      const targetRide = await Ride.findOne({ _id: id, status: "requested", driverId: null });
      if (targetRide && targetRide.rideMode === RIDE_MODES.PERSONAL) {
        return res.status(409).json({
          success: false,
          message: "Cannot accept a Personal Ride while already fulfilling another active ride",
        });
      }
    }

    // Atomic driver assignment to prevent concurrent double-booking
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: id,
        status: "requested",
        driverId: null,
      },
      {
        $set: {
          status: "accepted",
          driverId: req.user._id,
          "timeline.assignedAt": new Date(),
        },
      },
      { returnDocument: "after" }
    )
      .populate("passengerId", "name phoneNumber")
      .populate("driverId", "name phoneNumber");

    if (!updatedRide) {
      // Determine precise cause of failure
      const existing = await Ride.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Ride not found" });
      }
      if (existing.driverId) {
        return res.status(409).json({
          success: false,
          message: "Ride has already been accepted by another driver",
        });
      }
      if (existing.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Cannot accept a cancelled ride",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Ride is in status '${existing.status}' and cannot be accepted`,
      });
    }

    // Personal Ride Exclusivity Guard under concurrent acceptance:
    // If target ride is a Personal Ride, verify driver does not have another concurrent assignment.
    // If target ride is a Shared Ride, verify driver does not have a concurrent active Personal Ride.
    if (updatedRide.rideMode === RIDE_MODES.PERSONAL) {
      const concurrentActiveRides = await Ride.countDocuments({
        driverId: req.user._id,
        status: { $in: ["accepted", "arrived", "in_progress"] },
      });
      if (concurrentActiveRides > 1) {
        // Roll back assignment atomically to maintain strict Personal Ride exclusivity
        await Ride.updateOne(
          { _id: id, driverId: req.user._id, status: "accepted" },
          { $set: { status: "requested", driverId: null, "timeline.assignedAt": null } }
        );
        return res.status(409).json({
          success: false,
          message: "Concurrent assignment conflict: Driver is already assigned to another active ride.",
        });
      }
    } else {
      const concurrentPersonalRide = await Ride.findOne({
        _id: { $ne: id },
        driverId: req.user._id,
        status: { $in: ["accepted", "arrived", "in_progress"] },
        rideMode: RIDE_MODES.PERSONAL,
      });
      if (concurrentPersonalRide) {
        // Roll back assignment atomically
        await Ride.updateOne(
          { _id: id, driverId: req.user._id, status: "accepted" },
          { $set: { status: "requested", driverId: null, "timeline.assignedAt": null } }
        );
        return res.status(409).json({
          success: false,
          message: "Cannot accept a shared ride while fulfilling an exclusive Personal Ride.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ride accepted successfully",
      ride: formatRideResponse(updatedRide, req.user._id),
    });
  } catch (error) {
    console.error("Accept Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while accepting ride",
    });
  }
};

/**
 * POST /api/rides/:id/arrive
 * Driver marks arrived at passenger pickup location.
 */
const arriveAtPickup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID format" });
    }

    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: id,
        driverId: req.user._id,
        status: "accepted",
      },
      {
        $set: {
          status: "arrived",
          "timeline.arrivedAt": new Date(),
        },
      },
      { returnDocument: "after" }
    )
      .populate("passengerId", "name phoneNumber")
      .populate("driverId", "name phoneNumber");

    if (!updatedRide) {
      const existing = await Ride.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Ride not found" });
      }
      if (existing.driverId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not the assigned driver for this ride",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Cannot mark arrived from status '${existing.status}'. Expected status 'accepted'.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver marked as arrived at pickup location",
      ride: formatRideResponse(updatedRide, req.user._id),
    });
  } catch (error) {
    console.error("Arrive at Pickup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while marking arrival",
    });
  }
};

/**
 * POST /api/rides/:id/verify-otp
 * Driver enters passenger's 4-digit verification OTP to start trip.
 */
const verifyRideOtp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID format" });
    }

    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid OTP format",
      });
    }

    const { otp } = parseResult.data;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.driverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned driver for this ride",
      });
    }

    if (ride.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: `Cannot verify OTP from status '${ride.status}'. Expected status 'arrived'.`,
      });
    }

    // P5: Include verificationOtp in the atomic filter so OTP comparison and
    // state transition are a single database operation — eliminates the TOCTOU window.
    // An incorrect OTP simply yields no matching document, returning null.
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: id,
        driverId: req.user._id,
        status: "arrived",
        verificationOtp: otp.trim(), // atomic OTP gate
      },
      {
        $set: {
          status: "in_progress",
          "timeline.startedAt": new Date(),
        },
      },
      { returnDocument: "after" }
    )
      .populate("passengerId", "name phoneNumber")
      .populate("driverId", "name phoneNumber");

    if (!updatedRide) {
      // The filter did not match. The OTP was wrong (most common) or
      // another concurrent transition already moved the ride out of 'arrived'.
      // Re-read to give a precise error — do NOT expose the correct OTP.
      const current = await Ride.findOne({
        _id: id,
        driverId: req.user._id,
      });
      if (!current) {
        return res.status(404).json({ success: false, message: "Ride not found" });
      }
      if (current.status !== "arrived") {
        return res.status(400).json({
          success: false,
          message: `Cannot verify OTP from status '${current.status}'. Expected status 'arrived'.`,
        });
      }
      // Status is still 'arrived' but OTP did not match
      return res.status(400).json({
        success: false,
        message: "Invalid verification OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Trip started.",
      ride: formatRideResponse(updatedRide, req.user._id),
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while verifying OTP",
    });
  }
};

/**
 * POST /api/rides/:id/complete
 * Driver completes the ride upon reaching dropoff destination.
 */
const completeRide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID format" });
    }

    const existing = await Ride.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (existing.driverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned driver for this ride",
      });
    }

    if (existing.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Ride is already completed",
      });
    }

    if (existing.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Cannot complete ride from status '${existing.status}'. Expected status 'in_progress'.`,
      });
    }

    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: id,
        driverId: req.user._id,
        status: "in_progress",
      },
      {
        $set: {
          status: "completed",
          finalFare: existing.estimatedFare,
          driverEarnings: Math.round(existing.estimatedFare * 0.85),
          paymentStatus: "completed",
          "timeline.completedAt": new Date(),
        },
      },
      { returnDocument: "after" }
    )
      .populate("passengerId", "name phoneNumber")
      .populate("driverId", "name phoneNumber");

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully",
      ride: formatRideResponse(updatedRide, req.user._id),
    });
  } catch (error) {
    console.error("Complete Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while completing ride",
    });
  }
};

/**
 * PUT /api/rides/:id/cancel
 * Cancel a ride by passenger, assigned driver, or admin.
 */
const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID format" });
    }

    const parseResult = cancelRideSchema.safeParse(req.body);
    const reason = parseResult.success ? parseResult.data.reason : "";

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed ride",
      });
    }

    if (ride.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ride is already cancelled",
      });
    }

    const currentUserId = req.user._id.toString();
    const isPassenger = ride.passengerId?.toString() === currentUserId;
    const isAssignedDriver = ride.driverId?.toString() === currentUserId;
    const isAdmin = req.user.defaultRole === "admin";

    if (!isPassenger && !isAssignedDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this ride",
      });
    }

    const cancelledBy = isPassenger ? "passenger" : isAssignedDriver ? "driver" : "admin";

    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: id,
        status: ride.status, // atomic guard against concurrent mutation
      },
      {
        $set: {
          status: "cancelled",
          "timeline.cancelledAt": new Date(),
          "cancellation.cancelledBy": cancelledBy,
          "cancellation.reason": reason || "Cancelled by user",
        },
      },
      { returnDocument: "after" }
    )
      .populate("passengerId", "name phoneNumber")
      .populate("driverId", "name phoneNumber");

    // P6: If the update returned null, the ride's status changed concurrently
    // (e.g. driver completed it between our read and the update). Do not
    // return HTTP 200 with ride: null — report the conflict accurately.
    if (!updatedRide) {
      return res.status(409).json({
        success: false,
        message: "The ride status changed before the cancellation could be applied. Please refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride: formatRideResponse(updatedRide, req.user._id, isAdmin),
    });
  } catch (error) {
    console.error("Cancel Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while cancelling ride",
    });
  }
};

module.exports = {
  createRide,
  getActiveRide,
  getAvailableRides,
  getRideById,
  getMyRides,
  acceptRide,
  arriveAtPickup,
  verifyRideOtp,
  completeRide,
  cancelRide,
  formatRideResponse,
};
