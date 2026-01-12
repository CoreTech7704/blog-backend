const User = require("../models/User");
const Token = require("../models/Token");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

/* ================= ME ================= */
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "fullname email role"
  );

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json(user);
};

/* ================= SIGNUP ================= */
exports.signup = async (req, res) => {
  const { fullname, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Auto-generate username
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const username = `${base}_${suffix}`;

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    isEmailVerified: true, // ✅ forced true
  });

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
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    accessToken,
    user: {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    },
  });
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
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
    sameSite: "lax",
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
    sameSite: "lax",
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
