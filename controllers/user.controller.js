const Blog = require("../models/Blog");
const User = require("../models/User");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:dashboard:${userId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  /* ---------- Aggregations ---------- */

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
