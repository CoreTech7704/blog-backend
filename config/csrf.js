const { doubleCsrf } = require("csrf-csrf");
const jwt = require("jsonwebtoken");

const getSessionIdentifier = (req) => {
  const token = req.cookies?.adminToken;

  if (!token) return "anonymous";

  try {
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET
    );

    return decoded.id; // unique per admin
  } catch {
    return "anonymous";
  }
};

const {
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier,
  cookieName: "__Host-csrf",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

module.exports = { doubleCsrfProtection };