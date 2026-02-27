const mongoose = require("mongoose");
const Blog = require("../models/blog");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const deleteCloudinary = require("../utils/deleteCloudinary");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET PROFILE ================= */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "fullname username email avatar bio role createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const blogs = await Blog.countDocuments({
      author: req.user.id,
      status: "published",
    });

    res.json({
      user,
      stats: { blogs },
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res) => {
  try {
    const { fullname, username, bio } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullname) user.fullname = fullname;
    if (bio !== undefined) user.bio = bio;

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    await user.save();

    await delCache(`user:dashboard:${req.user.id}`);

    res.json({
      message: "Profile updated",
      user: {
        fullname: user.fullname,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* ================= GET DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:dashboard:${userId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const [statsAgg, recentBlogs, user] = await Promise.all([
      Blog.aggregate([
        {
          $match: {
            author: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            totalBlogs: { $sum: 1 },
            publishedBlogs: {
              $sum: {
                $cond: [{ $eq: ["$status", "published"] }, 1, 0],
              },
            },
            totalViews: { $sum: "$views" },
          },
        },
      ]),

      Blog.find({ author: userId })
        .select("title slug status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.findById(userId)
        .select("fullname username avatar")
        .lean(),
    ]);

    const stats = statsAgg?.[0] || {};

    const data = {
      user,
      stats: {
        totalBlogs: stats.totalBlogs || 0,
        publishedBlogs: stats.publishedBlogs || 0,
        totalViews: stats.totalViews || 0,
      },
      recentBlogs,
    };

    await setCache(cacheKey, data, 30);

    res.json(data);
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* ================= UPDATE AVATAR ================= */
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar image provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // delete old avatar if exists
    if (user.avatar?.publicId) {
      await deleteCloudinary(user.avatar.publicId);
    }

    // upload new avatar
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `voidwork/avatars/${user._id}`,
        resource_type: "image",
      },
      async (error, result) => {
        if (error) return next(error);

        user.avatar = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        await user.save();

        await delCache(`user:dashboard:${req.user.id}`);
        
        res.json({
          message: "Avatar updated successfully",
          avatar: user.avatar,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    next(err);
  }
};
