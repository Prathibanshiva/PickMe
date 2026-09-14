// backend/src/controllers/places.controller.js

/**
 * Places Controller - Google Places API (New) Proxy
 * Keeps the Google Places API key strictly on the backend.
 */

// Bangalore fallback coordinates if client location is unavailable
const DEFAULT_FALLBACK_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
};

/**
 * POST /api/places/autocomplete
 * Request body: { input, sessionToken, latitude, longitude }
 */
const getAutocomplete = async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        code: "PLACES_API_KEY_MISSING",
        message:
          "Google Places backend service not configured. Please configure GOOGLE_PLACES_API_KEY in backend/.env",
      });
    }

    const { input, sessionToken, latitude, longitude } = req.body;

    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search input text is required",
      });
    }

    const biasLat =
      typeof latitude === "number" && !isNaN(latitude)
        ? latitude
        : DEFAULT_FALLBACK_LOCATION.latitude;
    const biasLng =
      typeof longitude === "number" && !isNaN(longitude)
        ? longitude
        : DEFAULT_FALLBACK_LOCATION.longitude;

    const requestBody = {
      input: input.trim(),
      locationBias: {
        circle: {
          center: {
            latitude: biasLat,
            longitude: biasLng,
          },
          radius: 50000.0, // 50km radius around pickup location
        },
      },
    };

    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error?.message || "Failed to fetch place suggestions",
        error: data.error,
      });
    }

    const suggestions = (data.suggestions || [])
      .map((item) => {
        const prediction = item.placePrediction;
        if (!prediction) return null;

        return {
          placeId: prediction.placeId,
          mainText:
            prediction.structuredFormat?.mainText?.text ||
            prediction.text?.text ||
            "",
          secondaryText:
            prediction.structuredFormat?.secondaryText?.text || "",
          fullText: prediction.text?.text || "",
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Error in getAutocomplete:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching place suggestions",
      error: error.message,
    });
  }
};

/**
 * GET /api/places/:placeId?sessionToken=...
 */
const getPlaceDetails = async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        code: "PLACES_API_KEY_MISSING",
        message:
          "Google Places backend service not configured. Please configure GOOGLE_PLACES_API_KEY in backend/.env",
      });
    }

    const { placeId } = req.params;
    const { sessionToken } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "placeId parameter is required",
      });
    }

    let url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeId
    )}`;
    if (sessionToken) {
      url += `?sessionToken=${encodeURIComponent(sessionToken)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error?.message || "Failed to fetch place details",
        error: data.error,
      });
    }

    const details = {
      placeId: data.id,
      title: data.displayName?.text || data.formattedAddress || "Selected Location",
      formattedAddress: data.formattedAddress || "",
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
    };

    return res.status(200).json({
      success: true,
      place: details,
    });
  } catch (error) {
    console.error("Error in getPlaceDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching place details",
      error: error.message,
    });
  }
};

module.exports = {
  getAutocomplete,
  getPlaceDetails,
};
