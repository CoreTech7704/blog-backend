const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

module.exports = {
  loginLimiter,
  signupLimiter,
};