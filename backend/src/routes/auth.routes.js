const express = require("express");
const router = express.Router();

const { testAuth } = require("../controllers/auth/auth.controller");

router.get("/test", testAuth);

module.exports = router;