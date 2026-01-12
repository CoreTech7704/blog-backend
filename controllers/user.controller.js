const Blog = require("../models/blog");
const User = require("../models/User");
const { getCache, setCache } = require("../utils/cache");
const deleteFile = require("../utils/deleteFile");

/* ================= GET PROFILE ================= */
exports.getProfile = async (req, res) => {
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
    stats: {
      blogs,
    },
  });
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res) => {
    const { fullname, username, bio } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (fullname) user.fullname = fullname;
  if (bio !== undefined) user.bio = bio;

  // username change (optional but safe)
  if (username && username !== user.username) {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: "Username already taken" });
    }
    user.username = username;
  }

  await user.save();

  res.json({
    message: "Profile updated",
    user: {
      fullname: user.fullname,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
    },
  });
};

/* ================= GET DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:dashboard:${userId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const [stats] = await Blog.aggregate([
    { $match: { author: userId } },
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
  ]);

  const recentBlogs = await Blog.find({ author: userId })
    .select("title slug status createdAt")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const user = await User.findById(userId)
    .select("fullname username avatar")
    .lean();

  const data = {
    user,
    stats: {
      totalBlogs: stats?.totalBlogs || 0,
      publishedBlogs: stats?.publishedBlogs || 0,
      totalViews: stats?.totalViews || 0,
    },
    recentBlogs,
  };

  await setCache(cacheKey, data, 30);

  res.json(data);
};

exports.updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // delete old avatar (helper already skips default)
  deleteFile(user.avatar);

  // save new path
  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  res.json({
    message: "Avatar updated",
    avatar: user.avatar,
  });
};

