const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const driverRoutes = require("./driver.routes");
const placesRoutes = require("./places.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/driver", driverRoutes);
router.use("/places", placesRoutes);

module.exports = router;