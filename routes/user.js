const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const requireAuth = require("../middleware/requireAuth");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimit");
const Blog = require("../models/blog");
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

/* ================= USER DASHBOARD ================= */
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.session.user._id,
    }).sort({ createdAt: -1 });

    const totalBlogs = blogs.length;
    const publishedBlogs = blogs.filter(b => b.published).length;
    const draftBlogs = totalBlogs - publishedBlogs;

    res.render("dashboard", {
      user: req.session.user,
      blogs,
      stats: {
        total: totalBlogs,
        published: publishedBlogs,
        drafts: draftBlogs,
      },
    });
  } catch (err) {
    console.error("Dashboard load error:", err.message);
    res.render("dashboard", {
      user: req.session.user,
      blogs: [],
      stats: { total: 0, published: 0, drafts: 0 },
    });
  }
});

module.exports = router;