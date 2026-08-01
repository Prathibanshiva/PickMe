const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/database/mongodb");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PickMe Backend running on http://localhost:${PORT}`);
});