const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.redirect("/admin/login");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).send("Forbidden");
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.redirect("/admin/login");
  }
};
