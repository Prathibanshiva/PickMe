const testAuth = (req, res) => {
  res.json({
    success: true,
    message: "Auth Controller Working Successfully 🚀",
  });
};

module.exports = {
  testAuth,
};