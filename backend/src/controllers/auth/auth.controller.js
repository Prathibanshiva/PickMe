const generateOTP = require("../../utils/otpGenerator");
const { saveOTP } = require("../../services/otp.service");
const OTP = require("../../models/OTP");
const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");
const testAuth = (req, res) => {
  res.json({
    success: true,
    message: "Auth Controller Working Successfully 🚀",
  });
};

const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const otp = generateOTP();

    await saveOTP(phoneNumber, otp);

    // Mock SMS (Development Only)
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Find the latest OTP for this phone number
    const otpRecord = await OTP.findOne({ phoneNumber }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    // Check if OTP has already been used
    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "OTP already used",
      });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark OTP as used
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists
    let user = await User.findOne({ phoneNumber });

    // Enforce account status for existing users
    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked. Please contact customer support.",
        });
      }

      if (user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended. Please contact customer support.",
        });
      }
    }

    // Create new user if not found
    if (!user) {
      user = await User.create({
        phoneNumber,
      });
    }

    // Generate JWT
    const token = generateToken(user);

    return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    user: {
    id: user._id,
    phoneNumber: user.phoneNumber,
    name: user.name,
    email: user.email,
    gender: user.gender,
    defaultRole: user.defaultRole,
    isBlocked: user.isBlocked,
    isSuspended: user.isSuspended,
  },
});

  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


module.exports = {
  sendOTP,
  testAuth,
  verifyOTP,
};