const {
  sendOTP,
  verifyOTP,
} = require("../controllers/auth/auth.controller");
const express = require("express");
const router = express.Router();

const { testAuth } = require("../controllers/auth/auth.controller");

router.get("/test", testAuth);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
module.exports = router;