const User = require("../models/User");
const Token = require("../models/Token");
const Blog = require("../models/blog");
const Comment = require("../models/Comment");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");
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

    let exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate unique username
    let username;
    do {
      const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const suffix = Math.floor(1000 + Math.random() * 9000);
      username = `${base}_${suffix}`;
      exists = await User.findOne({ username });
    } while (exists);

    const user = await User.create({
      fullname,
      username,
      email,
      password,
      isEmailVerified: false,
      avatar: {
        url: process.env.DEFAULT_AVATAR_URL,
        publicId: "default-avatar",
      },
    });

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = Token.hashToken(verifyToken);

    // Clean old verify tokens
    await Token.deleteMany({ user: user._id, type: "verify" });

    // Store token
    await Token.create({
      user: user._id,
      tokenHash: hashedToken,
      type: "verify",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyURL = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    // Send email (non-blocking)
    await sendEmail(
      user.email,
        "Verify your Void Work email",
        `
      <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="padding:25px;text-align:center;background:#0f172a;color:#ffffff;">
              <h2 style="margin:0;letter-spacing:1px;">Void Work</h2>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:35px;">
              <p style="font-size:16px;color:#333;">Hi ${user.fullname || "there"},</p>

              <p style="font-size:16px;color:#333;">
                Welcome to <strong>Void Work</strong> 🚀
              </p>

              <p style="font-size:15px;color:#555;">
                Please confirm your email address to activate your account and start exploring blogs, sharing ideas, and learning better.
              </p>

              <!-- BUTTON -->
              <div style="text-align:center;margin:35px 0;">
                <a href="${verifyURL}"
                  style="
                    background:linear-gradient(90deg,#06b6d4,#8b5cf6);
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                    display:inline-block;
                    font-size:15px;
                  ">
                  Verify Email
                </a>
              </div>

              <p style="font-size:13px;color:#777;">
                If the button doesn't work, copy and paste this link:
                </p>
                <p style="word-break:break-all;">
                ${verifyURL}
              </p>

              <p style="font-size:14px;color:#555;">
                This link will expire in <strong>24 hours</strong>.
              </p>

              <p style="font-size:14px;color:#555;">
                If you did not create this account, you can safely ignore this email.
              </p>

              <p style="margin-top:30px;font-size:14px;color:#333;">
                Cheers,<br/>
                <strong>Void Work Team</strong>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px;text-align:center;font-size:12px;color:#999;background:#f4f4f7;">
              © ${new Date().getFullYear()} Void Work. All rights reserved.
            </td>
          </tr>

        </table>
      </div>
    `,
    ).catch((err) => console.error("EMAIL VERIFICATION ERROR:", err));

    // Auth tokens
    const accessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ id: user._id });

    await Token.create({
      user: user._id,
      tokenHash: Token.hashToken(refreshToken),
      type: "refresh",
      expiresAt: new Date(Date.now() + COOKIE_OPTIONS.maxAge),
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      message: "Signup successful. Please verify your email.",
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};
/* ================= verifyEmail ================= */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenHash = Token.hashToken(token);

    const storedToken = await Token.findOne({
      tokenHash,
      type: "verify",
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return res.status(400).json({
        message: "Invalid or expired link",
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    await user.save();

    await Token.deleteMany({ user: user._id, type: "verify" });

    sendEmail(
      user.email,
      "Welcome to Void Work 🚀",
      `
      <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">

          <tr>
            <td style="padding:30px;text-align:center;background:#0f172a;color:#ffffff;">
              <h2 style="margin:0;">Void Work</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px;color:#333;">Hi ${user.fullname},</p>

              <p style="font-size:16px;color:#333;">
                Welcome to <strong>Void Work</strong> 🎉
              </p>

              <p style="font-size:15px;color:#555;">
                Your account has been successfully created.
                You can now explore blogs, share your ideas, and connect with others.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${process.env.CLIENT_URL}"
                  style="background:#06b6d4;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
                  Visit Void Work
                </a>
              </div>

              <p style="font-size:14px;color:#555;">
                If you ever have questions or feedback, feel free to reach out.
              </p>

              <p style="margin-top:30px;">
                Cheers,<br/>
                <strong>Sarvam Patel</strong><br/>
                Void Work
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;font-size:12px;color:#999;background:#f4f4f7;">
              © ${new Date().getFullYear()} Void Work
            </td>
          </tr>

        </table>
      </div>
    `,
    ).catch((err) => {
      console.error("WELCOME EMAIL ERROR:", err);
    });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
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
      type: "refresh",
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

    const storedToken = await Token.findOne({
      tokenHash,
      type: "refresh",
    });
    if (!storedToken) {
      return res.status(401).json({ message: "Token revoked" });
    }

    await storedToken.deleteOne();

    const newRefreshToken = signRefreshToken({ id: payload.id });
    const newAccessToken = signAccessToken({ id: payload.id });

    await Token.create({
      user: payload.id,
      tokenHash: Token.hashToken(newRefreshToken),
      type: "refresh",
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

    await Token.deleteMany({ user: user._id, type: "refresh" });

    // Send password change email
    try {
      await sendEmail(
        user.email,
        "Your Void Work password was changed",
        `
        <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
            
            <tr>
              <td style="padding:30px;text-align:center;background:#0f172a;color:#ffffff;">
                <h2 style="margin:0;">Void Work</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px;color:#333;">Hi ${user.fullname},</p>

                <p style="font-size:16px;color:#333;">
                  Your password was successfully changed.
                </p>

                <p style="font-size:14px;color:#555;">
                  If you made this change, no further action is required.
                </p>

                <p style="font-size:14px;color:#555;">
                  If you did <strong>not</strong> change your password,
                  please reset it immediately using the link below.
                </p>

                <div style="text-align:center;margin:30px 0;">
                  <a href="${process.env.CLIENT_URL}/forgot-password"
                     style="background:#ef4444;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
                    Secure Your Account
                  </a>
                </div>

                <p style="margin-top:30px;">
                  Cheers,<br/>
                  <strong>Void Work Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;text-align:center;font-size:12px;color:#999;background:#f4f4f7;">
                © ${new Date().getFullYear()} Void Work
              </td>
            </tr>

          </table>
        </div>
        `,
      );
    } catch (mailErr) {
      console.error("PASSWORD CHANGE EMAIL ERROR:", mailErr);
    }

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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send account deletion email
    try {
      await sendEmail(
        user.email,
        "Your Void Work account has been deleted",
        `
        <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
            
            <tr>
              <td style="padding:30px;text-align:center;background:#0f172a;color:#ffffff;">
                <h2 style="margin:0;">Void Work</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px;color:#333;">Hi ${user.fullname},</p>

                <p style="font-size:16px;color:#333;">
                  Your <strong>Void Work</strong> account has been successfully deleted.
                </p>

                <p style="font-size:14px;color:#555;">
                  We're sorry to see you go. If this action was not performed by you,
                  please contact support immediately.
                </p>

                <p style="margin-top:30px;">
                  Cheers,<br/>
                  <strong>Void Work Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;text-align:center;font-size:12px;color:#999;background:#f4f4f7;">
                © ${new Date().getFullYear()} Void Work
              </td>
            </tr>

          </table>
        </div>
        `,
      );
    } catch (mailErr) {
      console.error("DELETE EMAIL ERROR:", mailErr);
    }

    await Token.deleteMany({ user: user._id, type: "refresh" });
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

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If account exists, reset email sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = Token.hashToken(resetToken);

    await Token.deleteMany({ user: user._id, type: "reset" });

    await Token.create({
      user: user._id,
      tokenHash: hashedToken,
      type: "reset",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log("RESET TOKEN:", resetToken);

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset your Void Work password",
      `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
      
      <tr>
        <td style="padding:30px; text-align:center; background:#0f172a; color:#ffffff;">
          <h2 style="margin:0;">Void Work</h2>
        </td>
      </tr>

      <tr>
        <td style="padding:30px;">
          <p style="font-size:16px; color:#333;">Hi ${user.fullname || "there"},</p>

          <p style="font-size:16px; color:#333;">
            You recently requested to reset your password for your <strong>Void Work</strong> account.
            Click the button below to choose a new one.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${resetURL}"
              style="
                background:#06b6d4;
                color:#ffffff;
                padding:12px 24px;
                text-decoration:none;
                border-radius:6px;
                font-weight:bold;
                display:inline-block;
              ">
              Reset Password
            </a>
          </div>

          <p style="font-size:14px; color:#555;">
            For your security, this link will expire in <strong>15 minutes</strong>.
          </p>

          <p style="font-size:12px;color:#666;margin-top:30px;">
          This password reset request was received from our website.
          If you did not make this request, your account is still secure.
          </p>

          <p style="font-size:14px;color:#555;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>

          <p style="word-break:break-all;">
            ${resetURL}
          </p>

          <p style="font-size:14px; color:#333; margin-top:30px;">
            Cheers,<br/>
            <strong>Sarvam Patel</strong><br/>
            Void Work
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:20px; text-align:center; font-size:12px; color:#999; background:#f4f4f7;">
          © ${new Date().getFullYear()} Void Work. All rights reserved.
        </td>
      </tr>

    </table>
  </div>
  `,
    );

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = Token.hashToken(token);

    const storedToken = await Token.findOne({
      tokenHash,
      type: "reset",
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(storedToken.user).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.password = password;
    await user.save();

    await storedToken.deleteOne();
    await Token.deleteMany({ user: user._id });

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
};
