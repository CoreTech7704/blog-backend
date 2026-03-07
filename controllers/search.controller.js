const Blog = require("../models/blog");
const Category = require("../models/Category");
const redis = require("../config/redis");
const User = require("../models/User");

exports.searchBlogs = async (req, res) => {
  let { q, page = 1, limit = 9, sort = "latest", type = "blog" } = req.query;

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

  const cacheKey = `search:${type}:${q.toLowerCase()}:${sort}:${page}:${limit}`;

  try {
    /* ================= CACHE ================= */
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    /* ================= FIND CATEGORY MATCH ================= */
    const matchingCategories = await Category.find({
      name: { $regex: q, $options: "i" },
    }).select("_id");

    const categoryIds = matchingCategories.map((c) => c._id);

    const skip = (page - 1) * limit;

    /* ================= TEXT SEARCH ================= */
    const textResults = await Blog.find(
      { status: "published", $text: { $search: q } },
      { score: { $meta: "textScore" } },
    )
      .select("title slug excerpt tags readingTime createdAt")
      .populate("author", "fullname")
      .populate("category", "name")
      .lean();

    /* ================= USER SEARCH ================= */

    if (type === "users") {
      const skip = (page - 1) * limit;

      const users = await User.find({
        $or: [
          { fullname: { $regex: q, $options: "i" } },
          { username: { $regex: q, $options: "i" } },
        ],
      })
        .select("fullname username avatar isAuthor isActive createdAt")
        .skip(skip)
        .limit(limit)
        .lean();

      /* count blogs per user */

      const userIds = users.map((u) => u._id);

      const blogCounts = await Blog.aggregate([
        { $match: { author: { $in: userIds }, status: "published" } },
        { $group: { _id: "$author", count: { $sum: 1 } } },
      ]);

      const countMap = {};
      blogCounts.forEach((b) => {
        countMap[b._id.toString()] = b.count;
      });

      const results = users.map((user) => ({
        ...user,
        blogCount: countMap[user._id.toString()] || 0,
      }));

      const total = await User.countDocuments({
        $or: [
          { fullname: { $regex: q, $options: "i" } },
          { username: { $regex: q, $options: "i" } },
        ],
      });

      const response = {
        results,
        total,
        page,
        pages: Math.ceil(total / limit),
      };

      await redis.set(cacheKey, response, { ex: 300 });

      return res.json(response);
    }

    /* ================= CATEGORY SEARCH ================= */
    let categoryResults = [];

    if (categoryIds.length > 0) {
      categoryResults = await Blog.find({
        status: "published",
        category: { $in: categoryIds },
      })
        .select("title slug excerpt tags readingTime createdAt")
        .populate("author", "fullname")
        .populate("category", "name")
        .lean();
    }

    /* ================= MERGE RESULTS ================= */

    const merged = [...textResults, ...categoryResults];

    const unique = Array.from(
      new Map(merged.map((blog) => [blog._id.toString(), blog])).values(),
    );

    /* ================= SORT ================= */

    if (sort === "oldest") {
      unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = unique.length;

    const paginated = unique.slice(skip, skip + limit);

    const response = {
      results: paginated,
      total,
      page,
      pages: Math.ceil(total / limit),
    };

    /* ================= CACHE ================= */

    await redis.set(cacheKey, response, { ex: 300 });

    res.json(response);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Search failed" });
  }
};
