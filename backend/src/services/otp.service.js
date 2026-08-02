const OTP = require("../models/OTP");

const saveOTP = async (phoneNumber, otp) => {
  // Remove any existing OTP for this phone number
  await OTP.deleteMany({ phoneNumber });

  // Set expiry to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Create and save new OTP
  const otpRecord = new OTP({
    phoneNumber,
    otp,
    expiresAt,
  });

  await otpRecord.save();

  return otpRecord;
};

module.exports = {
  saveOTP,
};