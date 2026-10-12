/**
 * Secure Administrator Password Setup Script
 *
 * Usage:
 *   node scripts/set-admin-password.js
 *   or:
 *   node scripts/set-admin-password.js <your-password>
 *   or:
 *   npm run admin:set-password
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load backend/.env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const AUTHORIZED_ADMIN_EMAIL = "prathibanshiva@gmail.com";

const promptHiddenPassword = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Handle hidden input in terminal
    process.stdout.write(query);

    let password = "";
    process.stdin.setRawMode?.(true);
    process.stdin.resume?.();

    const onData = (char) => {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener?.("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(password);
          break;
        case "\u0003": // Ctrl+C
          process.stdout.write("\nProcess cancelled.\n");
          process.exit(1);
          break;
        case "\u0008":
        case "\x7f": // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    };

    if (process.stdin.setRawMode) {
      process.stdin.on("data", onData);
    } else {
      // Fallback for non-TTY environments
      rl.question("", (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
};

const updateEnvFile = (hash) => {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `ADMIN_PASSWORD_HASH=${hash}\n`, "utf8");
    return;
  }

  let content = fs.readFileSync(envPath, "utf8");
  if (content.includes("ADMIN_PASSWORD_HASH=")) {
    content = content.replace(
      /ADMIN_PASSWORD_HASH=.*/g,
      `ADMIN_PASSWORD_HASH=${hash}`
    );
  } else {
    content = content.trimEnd() + `\nADMIN_PASSWORD_HASH=${hash}\n`;
  }

  fs.writeFileSync(envPath, content, "utf8");
};

const syncDatabaseAdmin = async (hash) => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("ℹ Note: MONGODB_URI not configured. Only .env was updated.");
    return;
  }

  const mongoose = require("mongoose");
  try {
    await mongoose.connect(mongoUri);
    const User = require("../src/models/User");

    let adminUser = await User.findOne({ email: AUTHORIZED_ADMIN_EMAIL });
    if (!adminUser) {
      adminUser = await User.create({
        email: AUTHORIZED_ADMIN_EMAIL,
        password: hash,
        defaultRole: "admin",
        name: "Prathiban Shiva",
      });
      console.log("✓ Created admin user document in MongoDB.");
    } else {
      adminUser.password = hash;
      adminUser.defaultRole = "admin";
      await adminUser.save();
      console.log("✓ Synchronized password hash and role to MongoDB admin record.");
    }
    await mongoose.disconnect();
  } catch (err) {
    console.warn("⚠ Warning: Could not synchronize with MongoDB directly:", err.message);
    console.log("  (The backend will still use ADMIN_PASSWORD_HASH from .env upon login).");
  }
};

const main = async () => {
  console.log("==================================================");
  console.log(" PickMe Operations Console — Admin Password Setup ");
  console.log(" Target Identity: " + AUTHORIZED_ADMIN_EMAIL);
  console.log("==================================================");

  let rawPassword = process.argv[2];

  if (!rawPassword) {
    rawPassword = await promptHiddenPassword("Enter new administrator password (min 8 characters): ");
  }

  if (!rawPassword || rawPassword.length < 8) {
    console.error("\n❌ Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  console.log("\nHashing password with bcrypt (12 rounds)...");
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(rawPassword, salt);

  console.log("Updating backend/.env configuration...");
  updateEnvFile(hash);
  console.log("✓ Stored ADMIN_PASSWORD_HASH in backend/.env.");

  await syncDatabaseAdmin(hash);

  console.log("\n==================================================");
  console.log("✅ Admin credentials configured successfully!");
  console.log("You can now log in to the PickMe Admin Portal with:");
  console.log("  Email: " + AUTHORIZED_ADMIN_EMAIL);
  console.log("  Password: [The password you entered]");
  console.log("==================================================");
  process.exit(0);
};

main().catch((err) => {
  console.error("\n❌ Setup failed:", err);
  process.exit(1);
});
