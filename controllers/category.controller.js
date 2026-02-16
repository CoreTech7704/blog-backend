const Category = require("../models/Category");
const Blog = require("../models/blog");
const mongoose = require("mongoose");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET ALL CATEGORIES ================= */
exports.getCategories = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    res.status(500).json({ message: "Failed to load categories" });
  }
};

/* ================= GET BLOGS BY CATEGORY ================= */
exports.getBlogsByCategory = async (req, res) => {
  try {
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
      total: blogs.length,
    };

    await setCache(cacheKey, data, 60);

    res.json(data);
  } catch (err) {
    console.error("GET BLOGS BY CATEGORY ERROR:", err);
    res.status(500).json({ message: "Failed to load category blogs" });
  }
};

/* ================= CREATE CATEGORY ================= */
exports.createCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Invalid category name" });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name });

    await delCache("categories:all");

    res.status(201).json(category);
  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Failed to create category" });
  }
};

/* ================= UPDATE CATEGORY ================= */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Invalid category name" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name;
    await category.save();

    await delCache([
      "categories:all",
      `category:blogs:${category.slug}`,
    ]);

    res.json(category);
  } catch (err) {
    console.error("UPDATE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

/* ================= DELETE CATEGORY ================= */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const blogCount = await Blog.countDocuments({ category: category._id });
    if (blogCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with existing blogs",
      });
    }

    const slug = category.slug;
    await category.deleteOne();

    await delCache([
      "categories:all",
      `category:blogs:${slug}`,
    ]);

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
