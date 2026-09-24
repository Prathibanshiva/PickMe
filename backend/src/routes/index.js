const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const driverRoutes = require("./driver.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/driver", driverRoutes);

module.exports = router;