const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // -----------------------------
    // Verification
    // -----------------------------

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // -----------------------------
    // Driver Personal Information
    // -----------------------------

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    aadhaarDocument: {
      type: String,
      default: "",
      trim: true,
    },

    drivingLicenceDocument: {
      type: String,
      default: "",
      trim: true,
    },

    // -----------------------------
    // Vehicle Information
    // -----------------------------

    vehicleType: {
      type: String,
      enum: [
        "bike",
        "auto",
        "car",
        "sedan",
        "suv",
      ],
      default: null,
    },

    vehicleNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    vehiclePhoto: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DriverProfile",
  driverProfileSchema
);