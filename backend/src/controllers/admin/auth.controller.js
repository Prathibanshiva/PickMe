const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");

// The single strictly authorized administrator email identity
const AUTHORIZED_ADMIN_EMAIL = "prathibanshiva@gmail.com";

/**
 * POST /api/admin/auth/login
 * Verify administrator email and password, and directly issue authenticated admin session.
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email address and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Enforce single-account identity restriction strictly on the server side
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message:
          "Access restricted. You do not have administrator clearance.",
        code: "GATE-AUTH-403",
      });
    }

    // Determine password hash from environment variable or stored admin user record
    let passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      const existingUser = await User.findOne({
        email: AUTHORIZED_ADMIN_EMAIL,
      }).select("+password");

      if (existingUser && existingUser.password) {
        passwordHash = existingUser.password;
      }
    }

    if (!passwordHash) {
      return res.status(500).json({
        success: false,
        message:
          "Administrator password hash is not configured on the server. Please configure ADMIN_PASSWORD_HASH or run npm run admin:set-password.",
      });
    }

    // Verify password against hash
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        code: "GATE-AUTH-401",
      });
    }

    // Ensure administrator user record exists in database
    let adminUser = await User.findOne({ email: AUTHORIZED_ADMIN_EMAIL });

    if (!adminUser) {
      adminUser = await User.create({
        email: AUTHORIZED_ADMIN_EMAIL,
        defaultRole: "admin",
        name: "Prathiban Shiva",
      });
    } else {
      if (adminUser.defaultRole !== "admin") {
        adminUser.defaultRole = "admin";
        await adminUser.save();
      }
    }

    // Generate authenticated JWT session
    const token = generateToken(adminUser);

    return res.status(200).json({
      success: true,
      message: "Administrator authenticated successfully.",
      token,
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name || "Prathiban Shiva",
        role: "admin",
        phoneNumber: adminUser.phoneNumber || "",
        createdAt: adminUser.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during authentication.",
    });
  }
};

module.exports = {
  AUTHORIZED_ADMIN_EMAIL,
  loginAdmin,
};
