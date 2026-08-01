const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

// Mount all API routes
app.use("/api", routes);

// Temporary Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚖 PickMe Backend Running Successfully!",
    version: "1.0.0",
  });
});

module.exports = app;