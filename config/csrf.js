const { doubleCsrf } = require("csrf-csrf");
const jwt = require("jsonwebtoken");

// ✅ DEV BYPASS (TOP PRIORITY)
if (process.env.NODE_ENV === "development") {
  console.warn("⚠️ CSRF DISABLED (development mode)");

  module.exports = {
    csrfProtection: (req, res, next) => next(),
  };

  return;
}

/* ===== PRODUCTION CSRF ===== */

const getSessionIdentifier = (req) => {
  const token = req.cookies?.adminToken;
  if (!token) return "anonymous";

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return decoded.id;
  } catch {
    return "anonymous";
  }
};

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier,
  cookieName: "__Host-csrf",
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  },
});

module.exports = {
  csrfProtection: doubleCsrfProtection,
};