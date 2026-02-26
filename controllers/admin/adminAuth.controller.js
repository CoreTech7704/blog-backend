const jwt = require("jsonwebtoken");
const User = require("../../models/User");

// ==================== TOKEN HELPERS ====================
const signAdminAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: "admin",
      type: "admin_access",
    },
    process.env.ADMIN_JWT_ACCESS_SECRET,
    { expiresIn: "30m" }
  );
};

const signAdminRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      type: "admin_refresh",
    },
    process.env.ADMIN_JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ==================== ADMIN LOGIN ====================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).render("login", {
        error: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).render("login", {
        error: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render("login", {
        error: "Invalid credentials",
      });
    }

    // Check admin role
    if (user.role !== "admin") {
      return res.status(403).render("login", {
        error: "Admin access only",
      });
    }

    // Check active status
    if (!user.isActive) {
      return res.status(403).render("login", {
        error: "Account disabled",
      });
    }

    // Issue tokens
    const accessToken = signAdminAccessToken(user);
    const refreshToken = signAdminRefreshToken(user);

    // Set cookies & redirect
    res
      .cookie("admin_access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60 * 1000,
      })
      .cookie("admin_refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    return res.redirect("/admin/dashboard");

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).render("login", {
      error: "Something went wrong. Please try again.",
    });
  }
};