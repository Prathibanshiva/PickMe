const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
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
    console.error(
      "Get Current User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile",
    });
  }
};

module.exports = {
  getCurrentUser,
};