const jwt = require("jsonwebtoken");

module.exports = function authAdmin(req, res, next) {
  try {
    // Read token from cookie
    const token = req.cookies?.admin_access_token;

    if (!token) {
      // Not logged in
      return res.redirect("/admin/login");
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_ACCESS_SECRET
    );

    // Validate token intent
    if (decoded.type !== "admin_access" || decoded.role !== "admin") {
      return res.redirect("/admin/login");
    }

    // Attach admin info to request
    req.admin = {
      id: decoded.sub,
      role: decoded.role,
    };

    // Allow access
    next();
  } catch (err) {
    // Token expired / invalid
    return res.redirect("/admin/login");
  }
};