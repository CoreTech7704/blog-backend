const User = require("../models/User");
const Token = require("../models/Token");
const Blog = require("../models/blog");
const Comment = require("../models/Comment");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ================= ME ================= */
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("fullname email role")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

/* ================= SIGNUP ================= */
exports.signup = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${base}_${suffix}`;

    const user = await User.create({
      fullname,
      username,
      email,
      password,
      isEmailVerified: true,
    });

    const accessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ id: user._id });

    await Token.deleteMany({ user: user._id });

    await Token.create({
      user: user._id,
      tokenHash: Token.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + COOKIE_OPTIONS.maxAge),
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await Token.deleteMany({ user: user._id });

    const accessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ id: user._id });

    await Token.create({
      user: user._id,
      tokenHash: Token.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + COOKIE_OPTIONS.maxAge),
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= REFRESH ================= */
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const tokenHash = Token.hashToken(token);

    const storedToken = await Token.findOne({ tokenHash });
    if (!storedToken) {
      return res.status(401).json({ message: "Token revoked" });
    }

    await storedToken.deleteOne();

    const newRefreshToken = signRefreshToken({ id: payload.id });
    const newAccessToken = signAccessToken({ id: payload.id });

    await Token.create({
      user: payload.id,
      tokenHash: Token.hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + COOKIE_OPTIONS.maxAge),
    });

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* ================= LOGOUT ================= */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await Token.deleteOne({
        tokenHash: Token.hashToken(token),
      });
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    await Token.deleteMany({ user: user._id });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Password update failed" });
  }
};

/* ================= DELETE ACCOUNT ================= */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await Token.deleteMany({ user: userId });
    await Blog.deleteMany({ author: userId });
    await Comment.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
};
