const Category = require("../models/Category");
const Blog = require("../models/Blog");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET ALL CATEGORIES ================= */
exports.getCategories = async (req, res) => {
  const cacheKey = "categories:all";

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const categories = await Category.find()
    .sort({ name: 1 })
    .lean();

  await setCache(cacheKey, categories, 600); // 10 min

  res.json(categories);
};

/* ================= GET BLOGS BY CATEGORY ================= */
exports.getBlogsByCategory = async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `category:blogs:${slug}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const category = await Category.findOne({ slug }).lean();
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const blogs = await Blog.find({
    category: category._id,
    status: "published",
  })
    .populate("author", "fullname avatar")
    .sort({ createdAt: -1 })
    .lean();

  const data = {
    category,
    blogs,
  };

  await setCache(cacheKey, data, 60);

  res.json(data);
};

/* ================= CREATE CATEGORY ================= */
exports.createCategory = async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
  });

  await delCache("categories:all");

  res.status(201).json(category);
};

/* ================= UPDATE CATEGORY ================= */
exports.updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.name = req.body.name;
  await category.save();

  await delCache([
    "categories:all",
    `category:blogs:${category.slug}`,
  ]);

  res.json(category);
};

/* ================= DELETE CATEGORY ================= */
exports.deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const slug = category.slug;

  await category.deleteOne();

  await delCache([
    "categories:all",
    `category:blogs:${slug}`,
  ]);

  res.json({ message: "Category deleted" });
};
