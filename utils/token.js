const crypto = require("crypto");

exports.generateToken = () =>
  crypto.randomBytes(32).toString("hex");


exports.hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};