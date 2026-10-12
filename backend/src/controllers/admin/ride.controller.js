/**
 * Admin Ride Management Controller
 * Handles administrative inspection of ride telemetry and corridor dispatch.
 * Note: Persistent database ride architecture is scheduled for Phase C.
 */

const getRides = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // In Phase B, ride booking lifecycle runs in client-side mobile memory.
    // Persistent database schema (Ride/Trip collection) is scheduled for Phase C.
    // Return an honest, empty persisted result set with architecture status.
    return res.status(200).json({
      success: true,
      rides: [],
      metrics: {
        liveRides: 0,
        upcomingRides: 0,
        completedRides: 0,
        cancelledRides: 0,
        totalRides: 0,
      },
      pagination: {
        total: 0,
        page: parsedPage,
        limit: parsedLimit,
        pages: 0,
      },
      serviceStatus: {
        persisted: false,
        phase: "Phase C Scheduled",
        message:
          "Persistent ride storage and trip history are scheduled for Phase C (Ride Dispatch & Lifecycle). Mobile ride lifecycle currently executes via client-side state.",
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

    // No persistent ride record exists in MongoDB yet
    return res.status(404).json({
      success: false,
      message: `Ride #${id} not found. Persistent ride records are scheduled for activation in Phase C.`,
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
