/**
 * Admin Scheduled Rides Controller
 * Manages administrative view of pre-booked / scheduled trip queue.
 * Note: Scheduled ride persistence is part of Phase C (Ride Dispatch & Lifecycle).
 * The mobile client lifecycle does not yet persist scheduled trips to MongoDB.
 */

const getScheduledRides = async (req, res) => {
  try {
    const { status, search, dateRange, page = 1, limit = 10 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // Phase B: No ScheduledRide / Trip collection exists in MongoDB yet.
    // Persistent scheduled-booking architecture is scheduled for Phase C.
    return res.status(200).json({
      success: true,
      scheduledRides: [],
      metrics: {
        totalScheduled: 0,
        assigned: 0,
        confirmed: 0,
        pendingMatch: 0,
        cancelled: 0,
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
          "Scheduled ride pre-booking persistence and the automated driver-match queue are scheduled for Phase C (Ride Dispatch & Lifecycle). The mobile booking flow does not yet write scheduled trips to MongoDB.",
      },
    });
  } catch (error) {
    console.error("Admin Get Scheduled Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching scheduled rides",
    });
  }
};

const getScheduledRideById = async (req, res) => {
  try {
    const { id } = req.params;
    return res.status(404).json({
      success: false,
      message: `Scheduled ride #${id} not found. Persistent scheduled ride records are scheduled for Phase C.`,
    });
  } catch (error) {
    console.error("Admin Get Scheduled Ride By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching scheduled ride details",
    });
  }
};

module.exports = {
  getScheduledRides,
  getScheduledRideById,
};
