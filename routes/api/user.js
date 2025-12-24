const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const User = require("../../models/user");

const router = Router();

/* ================= RATE LIMITERS ================= */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

/* ================= AUTH MIDDLEWARE ================= */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/* ================= SIGN UP ================= */
router.post(
  "/signup",
  authLimiter,
  [
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("fullname").trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input" });
    }

    try {
      const { fullname, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const user = await User.create({ fullname, email, password });

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("API signup error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= SIGN IN ================= */
router.post(
  "/signin",
  authLimiter,
  [
    body("email").isEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    try {
      const { email, password } = req.body;

      const user = await User.matchPassword(email, password);

      req.session.user = {
        _id: user._id,
        role: user.role,
      };

      return res.json({
        message: "Login successful",
        user,
      });
    } catch (err) {
      console.error("API signin error:", err.message);
      return res.status(401).json({ message: "Invalid credentials" });
    }
  }
);

/* ================= CURRENT USER ================= */
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: req.session.user,
  });
});

/* ================= LOGOUT ================= */
router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
