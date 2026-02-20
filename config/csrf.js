const { doubleCsrf } = require("csrf-csrf");

const {
  doubleCsrfProtection,
  generateToken,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: "__Host-csrf",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

module.exports = {
  doubleCsrfProtection,
  generateToken,
};