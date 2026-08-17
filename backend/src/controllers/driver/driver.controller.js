const DriverProfile = require("../../models/DriverProfile");

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
        vehicleType:
          driverProfile.vehicleType,
        vehicleNumber:
          driverProfile.vehicleNumber,
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

module.exports = {
  createOrGetDriverProfile,
};