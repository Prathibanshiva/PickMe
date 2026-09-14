// backend/src/routes/places.routes.js

const express = require("express");
const placesController = require("../controllers/places.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Autocomplete and place details protected with standard JWT authentication
router.post("/autocomplete", authenticate, placesController.getAutocomplete);
router.get("/:placeId", authenticate, placesController.getPlaceDetails);

module.exports = router;
