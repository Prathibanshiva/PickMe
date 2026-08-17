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

    verifiedAt: {
      type: Date,
      default: null,
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