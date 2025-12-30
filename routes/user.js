const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const rateLimit = require("express-rate-limit");
const requireAuth = require("../middleware/requireAuth");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimit");

const router = Router();

/* ================= SIGN IN ================= */
router.get("/signin", (req, res) => {
  res.render("signin", { error: req.query.error || null });
});

router.post("/signin", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.matchPassword(email.toLowerCase(), password);

    req.session.user = {
      _id: user._id,
      role: user.role,
      fullname: user.fullname,
    };

    res.redirect("/");
  } catch (err) {
    console.error("Signin error:", err.message);
    res.redirect("/user/signin?error=Invalid email or password");
  }
});

/* ================= SIGN UP ================= */
router.get("/signup", (req, res) => {
  res.render("signup", { error: req.query.error || null });
});

router.post("/signup", signupLimiter,
  [
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("fullname").trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect("/user/signup?error=Invalid input");
    }

    try {
      const { fullname, email, password } = req.body;

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return res.redirect("/user/signup?error=Email already in use");
      }

      await User.create({
        fullname,
        email: email.toLowerCase(),
        password,
      });

      res.redirect("/user/signin");
    } catch (err) {
      console.error(err);
      res.redirect("/user/signup?error=Something went wrong");
    }
  }
);


/* ================= LOGOUT ================= */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/user/signin");
  });
});

/* ================= PROTECTED ROUTE ================= */
router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard");
});

module.exports = router;
