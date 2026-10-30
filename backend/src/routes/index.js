const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const driverRoutes = require("./driver.routes");
const adminRoutes = require("./admin.routes");
const rideRoutes = require("./ride.routes");
const mapsRoutes = require("./maps.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/driver", driverRoutes);
router.use("/admin", adminRoutes);
router.use("/rides", rideRoutes);
router.use("/maps", mapsRoutes);

module.exports = router;