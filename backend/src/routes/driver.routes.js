const express = require("express");

const {
  createOrGetDriverProfile,
} = require("../controllers/driver/driver.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/profile",
  authenticate,
  createOrGetDriverProfile
);

module.exports = router;