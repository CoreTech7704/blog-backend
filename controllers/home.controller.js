const Blog = require("../models/Blog");
const { getCache, setCache } = require("../utils/cache");

exports.getHomeData = async (req, res) => {
  const cacheKey = "home:data";

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const latest = await Blog.find({ status: "published" })
    .populate("author", "fullname avatar")
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const data = {
    latest,
  };

  await setCache(cacheKey, data, 60);

  res.json(data);
};
