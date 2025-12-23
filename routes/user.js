const { Router } = require("express");
const User = require("../models/user");

const router = Router();

/* ================= SIGN IN ================= */

router.get("/signin", (req, res) => {
  res.render("signin", {
    error: req.query.error || null,
  });
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.matchPassword(
      email.toLowerCase(),
      password
    );

    // req.session.user = user; // later
    return res.redirect("/");
  } catch (err) {
    console.error("Signin error:", err.message);
    return res.redirect("/user/signin?error=Invalid email or password");
  }
});


/* ================= SIGN UP ================= */

router.get("/signup", (req, res) => {
  res.render("signup", {
    error: req.query.error || null,
  });
});

router.post("/signup", async (req, res) => {
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

    return res.redirect("/user/signin");
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.redirect("/user/signup?error=Email already in use");
    }

    return res.redirect("/user/signup?error=Something went wrong");
  }
});

module.exports = router;
