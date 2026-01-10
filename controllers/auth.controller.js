const User = require("../models/User");
const Token = require("../models/Token");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { generateToken, hashToken } = require("../utils/token");
const { sendEmail } = require("../utils/email");

const crypto = require("crypto");

/* ================= SIGNUP ================= */
exports.signup = async (req, res) => {
  const { fullname, username, email, password } = req.body;

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const verifyToken = generateToken();

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    emailVerifyToken: hashToken(verifyToken),
    emailVerifyExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const verifyURL = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `
      <h3>Welcome to Core Blog</h3>
      <p>Click below to verify your email:</p>
      <a href="${verifyURL}">${verifyURL}</a>
    `,
  });

  res.status(201).json({
    message: "Signup successful. Please verify your email.",
  });
};

/* ================= VERIFY EMAIL ================= */
exports.verifyEmail = async (req, res) => {
  const token = hashToken(req.params.token);

  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email" });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({ id: user._id });

  await Token.create({
    user: user._id,
    tokenHash: Token.hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    },
  });
};

/* ================= REFRESH ================= */
exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const tokenHash = Token.hashToken(token);
  const storedToken = await Token.findOne({ tokenHash });

  if (!storedToken) {
    return res.status(401).json({ message: "Token revoked" });
  }

  // Rotate token
  await storedToken.deleteOne();

  const newRefreshToken = signRefreshToken({ id: payload.id });
  await Token.create({
    user: payload.id,
    tokenHash: Token.hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const newAccessToken = signAccessToken({ id: payload.id });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
};

/* ================= LOGOUT ================= */
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await Token.deleteOne({ tokenHash: Token.hashToken(token) });
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "Email sent if account exists" });

  const resetToken = generateToken();

  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
    subject: "Password reset",
    html: `
      <p>Reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
    `,
  });

  res.json({ message: "Email sent if account exists" });
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  const token = hashToken(req.params.token);
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Invalidate all refresh tokens
  await Token.deleteMany({ user: user._id });

  await user.save();

  res.json({ message: "Password reset successful" });
};

