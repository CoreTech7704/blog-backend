const Blog = require("../models/blog");
const redis = require("../config/redis");

exports.searchBlogs = async (req, res) => {
  let { q, page = 1, limit = 9 } = req.query;

  q = q?.trim();
  page = Math.max(1, Number(page));
  limit = Math.min(20, Math.max(1, Number(limit)));

  if (!q || q.length < 2) {
    return res.json({
      results: [],
      total: 0,
      page,
      pages: 0,
    });
  }

  const cacheKey = `search:${q.toLowerCase()}:${page}:${limit}`;

  try {
    /* ================= CACHE HIT ================= */
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    /* ================= DB QUERY ================= */
    const query = {
      status: "published",
      $text: { $search: q },
    };

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Blog.find(query, {
        score: { $meta: "textScore" },
      })
        .select("title slug excerpt tags readingTime createdAt")
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "fullname")
        .populate("category", "name")
        .lean(),

      Blog.countDocuments(query),
    ]);

    const response = {
      results,
      total,
      page,
      pages: Math.ceil(total / limit),
    };

    /* ================= CACHE SET ================= */
    await redis.set(
      cacheKey,
      JSON.stringify(response),
      "EX",
      300 // 5 minutes
    );

    res.json(response);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Search failed" });
  }
};
