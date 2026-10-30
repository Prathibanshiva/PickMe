// backend/src/controllers/maps/maps.controller.js
//
// Secure server-side proxy for Google Maps Platform APIs.
// The GOOGLE_MAPS_SERVER_API_KEY environment variable must be set.
// This key MUST be a server-restricted (HTTP-referrer or IP-restricted) key —
// never the Android/iOS SDK key used in app.json.
// Endpoints:
//   GET /api/maps/autocomplete   – Places Autocomplete (New API)
//   GET /api/maps/place-details  – Place Details (New API)
//   GET /api/maps/reverse-geocode – Geocoding API (reverse)

const GOOGLE_MAPS_SERVER_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY || "";

const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places/";
const GOOGLE_GEOCODING_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

/** Returns a 503 when the server-side API key is not configured. */
function missingKeyResponse(res) {
  return res.status(503).json({
    success: false,
    code: "MAPS_NOT_CONFIGURED",
    message:
      "Google Maps is not configured on this server. " +
      "Set the GOOGLE_MAPS_SERVER_API_KEY environment variable and restart the backend.",
  });
}

/**
 * GET /api/maps/autocomplete
 * Query parameters:
 *   input        (required) – text string to autocomplete
 *   sessiontoken (optional) – UUID string for billing session grouping
 *   lat / lng    (optional) – bias results toward this coordinate
 *   radius       (optional) – bias radius in metres (default 35000)
 *
 * Uses the Places API (New) via the POST /v1/places:autocomplete endpoint.
 * Returns a JSON array of predictions each containing:
 *   placeId, title, subtitle, description
 */
async function autocompletePlaces(req, res) {
  try {
    const { input, sessiontoken, lat, lng, radius } = req.query;

    if (!input || !String(input).trim()) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message: "Query parameter 'input' is required and must not be blank.",
      });
    }

    if (!GOOGLE_MAPS_SERVER_API_KEY) {
      return missingKeyResponse(res);
    }

    const body = {
      input: String(input).trim(),
      languageCode: "en",
      regionCode: "IN",
    };

    if (sessiontoken) {
      body.sessionToken = String(sessiontoken);
    }

    if (lat && lng) {
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      if (!isNaN(latF) && !isNaN(lngF)) {
        body.locationBias = {
          circle: {
            center: { latitude: latF, longitude: lngF },
            radius: parseFloat(radius) || 35000,
          },
        };
      }
    }

    const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_SERVER_API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Google Places Autocomplete] API error:", data);
      return res.status(502).json({
        success: false,
        code: "UPSTREAM_ERROR",
        message:
          data?.error?.message ||
          "Google Places Autocomplete returned an unexpected error.",
      });
    }

    const suggestions = (data.suggestions || []).map((s) => {
      const pred = s.placePrediction;
      return {
        placeId: pred.placeId,
        title:
          pred.structuredFormat?.mainText?.text ||
          pred.text?.text ||
          "",
        subtitle:
          pred.structuredFormat?.secondaryText?.text || "",
        description: pred.text?.text || "",
      };
    });

    return res.json({
      success: true,
      predictions: suggestions,
    });
  } catch (error) {
    console.error("[Maps] autocompletePlaces error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error during place autocomplete.",
    });
  }
}

/**
 * GET /api/maps/place-details
 * Query parameters:
 *   place_id     (required) – Google Place ID
 *   sessiontoken (optional) – UUID string to close billing session
 *
 * Returns:
 *   placeId, name, formattedAddress, latitude, longitude
 */
async function getPlaceDetails(req, res) {
  try {
    const { place_id, sessiontoken } = req.query;

    if (!place_id) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message: "Query parameter 'place_id' is required.",
      });
    }

    if (!GOOGLE_MAPS_SERVER_API_KEY) {
      return missingKeyResponse(res);
    }

    const fieldsHeader =
      "places.id,places.displayName,places.formattedAddress,places.location";

    let url = `${GOOGLE_PLACES_DETAILS_URL}${encodeURIComponent(String(place_id))}`;
    if (sessiontoken) {
      url += `?sessionToken=${encodeURIComponent(String(sessiontoken))}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": GOOGLE_MAPS_SERVER_API_KEY,
        "X-Goog-FieldMask": fieldsHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Google Places Details] API error:", data);
      return res.status(502).json({
        success: false,
        code: "UPSTREAM_ERROR",
        message:
          data?.error?.message ||
          "Google Place Details returned an unexpected error.",
      });
    }

    const { id, displayName, formattedAddress, location } = data;

    if (!location) {
      return res.status(422).json({
        success: false,
        code: "NO_GEOMETRY",
        message:
          "Google Place Details did not return location geometry for this place.",
      });
    }

    return res.json({
      success: true,
      details: {
        placeId: id || String(place_id),
        name: displayName?.text || formattedAddress || "",
        formattedAddress: formattedAddress || "",
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });
  } catch (error) {
    console.error("[Maps] getPlaceDetails error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error fetching place details.",
    });
  }
}

/**
 * GET /api/maps/reverse-geocode
 * Query parameters:
 *   lat (required) – latitude as a decimal number
 *   lng (required) – longitude as a decimal number
 *
 * Returns:
 *   title, subtitle, formattedAddress, latitude, longitude
 *
 * Falls back gracefully: when Google API returns no result, returns a
 * coordinate string so the caller always gets a valid (non-fabricated)
 * address derived from the actual coordinates.
 */
async function reverseGeocode(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message:
          "Valid numeric query parameters 'lat' and 'lng' are required.",
      });
    }

    if (!GOOGLE_MAPS_SERVER_API_KEY) {
      return missingKeyResponse(res);
    }

    const url = new URL(GOOGLE_GEOCODING_URL);
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", GOOGLE_MAPS_SERVER_API_KEY);
    url.searchParams.set("language", "en");
    url.searchParams.set("result_type", "street_address|route|sublocality|neighborhood|locality");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Google Geocoding] API error:", data);
      return res.status(502).json({
        success: false,
        code: "UPSTREAM_ERROR",
        message:
          data?.error_message ||
          "Google Geocoding API returned an unexpected error.",
      });
    }

    if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
      return res.status(502).json({
        success: false,
        code: data.status,
        message: data.error_message || `Geocoding API returned: ${data.status}`,
      });
    }

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const first = data.results[0];
      const components = first.address_components || [];

      // Prefer route → sublocality_level_1 → sublocality → neighbourhood → locality
      const getPart = (...types) => {
        for (const type of types) {
          const c = components.find((x) => x.types.includes(type));
          if (c) return c.long_name;
        }
        return null;
      };

      const title =
        getPart("route", "sublocality_level_1", "sublocality", "neighborhood") ||
        first.formatted_address.split(",")[0];

      const secondary = first.formatted_address
        .split(",")
        .slice(1, 4)
        .join(", ")
        .trim();

      return res.json({
        success: true,
        address: {
          title: title || "Selected Location",
          subtitle: secondary || "",
          formattedAddress: first.formatted_address,
          latitude: lat,
          longitude: lng,
        },
      });
    }

    // Geocoding succeeded but returned ZERO_RESULTS — return coordinate string
    // (accurate, not fabricated)
    return res.json({
      success: true,
      address: {
        title: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        subtitle: "Selected Map Coordinates",
        formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat,
        longitude: lng,
      },
      note: "Reverse geocoding returned no named result for these coordinates.",
    });
  } catch (error) {
    console.error("[Maps] reverseGeocode error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error during reverse geocoding.",
    });
  }
}

module.exports = {
  autocompletePlaces,
  getPlaceDetails,
  reverseGeocode,
};
