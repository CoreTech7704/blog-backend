const Blog = require("../models/blog");
const { getCache, setCache } = require("../utils/cache");

exports.getHomeData = async (req, res) => {
  const cacheKey = "home:data";

  try {
    /* ================= CACHE HIT ================= */
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    /* ================= DB QUERY ================= */
    const latest = await Blog.find({ status: "published" })
      .select(
        "title slug excerpt coverImage readingTime createdAt"
      )
      .populate("author", "fullname avatar")
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .lean();

    const data = {
      latest,
    };

    /* ================= CACHE SET ================= */
    await setCache(cacheKey, data, 60); // 1 minute

    res.json(data);
  } catch (err) {
    console.error("HOME DATA ERROR:", err);
    res.status(500).json({ message: "Failed to load home data" });
  }
};
