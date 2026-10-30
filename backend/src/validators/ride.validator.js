const { z } = require("zod");
const { CANONICAL_VEHICLE_CAPACITIES, RIDE_MODES, validateRideRequest } = require("../../../shared/constants/vehicles");

const coordinatesSchema = z
  .array(z.number())
  .length(2, "Coordinates must be [longitude, latitude]")
  .refine(
    ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
    "Coordinates must be valid [longitude, latitude] geographic ranges"
  );

const locationSchema = z.object({
  address: z.string().trim().min(1, "Location address is required"),
  title: z.string().trim().optional().default(""),
  subtitle: z.string().trim().optional().default(""),
  coordinates: coordinatesSchema,
});

const createRideSchema = z
  .object({
    pickup: locationSchema,
    destination: locationSchema,
    vehicleType: z.enum(["bike", "auto", "car", "sedan", "suv"], {
      errorMap: () => ({ message: "vehicleType must be one of: bike, auto, car, sedan, suv" }),
    }),
    rideMode: z.enum([RIDE_MODES.SHARED, RIDE_MODES.PERSONAL], {
      errorMap: () => ({ message: "rideMode must be either 'shared' or 'personal'" }),
    }),
    requestedSeats: z.number().int().min(1).max(6).optional().default(1),
    estimatedFare: z.number().positive("Estimated fare must be greater than zero"),
    distanceKm: z.number().min(0).optional().default(0),
    durationMin: z.number().min(0).optional().default(0),
    paymentMethod: z.enum(["cash", "card", "upi", "wallet"]).optional().default("cash"),
  })
  .superRefine((data, ctx) => {
    const validation = validateRideRequest(data.vehicleType, data.rideMode, data.requestedSeats);
    if (!validation.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validation.reason,
        path: ["requestedSeats"],
      });
    }
  });

const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Verification OTP must be a 4-digit numeric code"),
});

const cancelRideSchema = z.object({
  reason: z.string().trim().max(500, "Cancellation reason cannot exceed 500 characters").optional().default(""),
});

module.exports = {
  createRideSchema,
  verifyOtpSchema,
  cancelRideSchema,
};
