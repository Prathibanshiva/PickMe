const mongoose = require("mongoose");
const { CANONICAL_VEHICLE_CAPACITIES, RIDE_MODES, validateRideRequest } = require("../../../shared/constants/vehicles");

/**
 * Ride Schema — Persistent MongoDB Model for PickMe Ride Lifecycle
 *
 * Enforces canonical product rules:
 * - Driver excluded from passenger capacities (Bike 1, Auto 3, Car 4, Sedan 4, SUV 6).
 * - Shared Ride: Bike strictly prohibited; requested seats 1 to (capacity - 1).
 * - Personal Ride: Reserves entire vehicle; all vehicle types allowed.
 * - Server-authoritative lifecycle state machine:
 *   requested -> accepted -> arrived -> in_progress -> completed (or cancelled).
 */

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (coords) {
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90
          );
        },
        message: "Coordinates must be [longitude, latitude] within valid geographic ranges",
      },
    },
  },
  { _id: false }
);

const rideLocationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: pointSchema,
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    rideId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      default: function () {
        const timestampSuffix = Date.now().toString().slice(-4);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        return `PKM-${timestampSuffix}${randomSuffix}`;
      },
    },

    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    vehicleType: {
      type: String,
      enum: ["bike", "auto", "car", "sedan", "suv"],
      required: true,
      lowercase: true,
      trim: true,
    },

    rideMode: {
      type: String,
      enum: [RIDE_MODES.SHARED, RIDE_MODES.PERSONAL],
      default: RIDE_MODES.SHARED,
      lowercase: true,
      trim: true,
    },

    requestedSeats: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 6,
      validate: function (seats) {
        const res = validateRideRequest(this.vehicleType, this.rideMode, seats);
        if (!res.valid) {
          throw new Error(res.reason);
        }
      },
    },

    pickup: {
      type: rideLocationSchema,
      required: true,
    },

    destination: {
      type: rideLocationSchema,
      required: true,
    },

    distanceKm: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationMin: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedFare: {
      type: Number,
      required: true,
      min: 0,
    },

    finalFare: {
      type: Number,
      default: null,
      min: 0,
    },

    driverEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
      index: true,
    },

    verificationOtp: {
      type: String,
      required: true,
      trim: true,
    },

    timeline: {
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      assignedAt: {
        type: Date,
        default: null,
      },
      arrivedAt: {
        type: Date,
        default: null,
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      cancelledAt: {
        type: Date,
        default: null,
      },
    },

    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["passenger", "driver", "admin", "system", null],
        default: null,
      },
      reason: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial 2dsphere indexes
rideSchema.index({ "pickup.location": "2dsphere" });
rideSchema.index({ "destination.location": "2dsphere" });

// Compound query indexes
rideSchema.index({ passengerId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ status: 1, createdAt: -1 });

// Pre-validate hook for calculated fields
rideSchema.pre("validate", function () {
  // Calculate driver earnings (85% net payout standard) if not set
  if (!this.driverEarnings && this.estimatedFare) {
    this.driverEarnings = Math.round(this.estimatedFare * 0.85);
  }
});

module.exports = mongoose.model("Ride", rideSchema);
