const Blog = require("../models/blog");
const Comment = require("../models/Comment");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const { getCache, setCache, delCache } = require("../utils/cache");
const deleteFile = require("../utils/deleteFile");

/* ================= GET MY BLOGS ================= */
exports.getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(blogs);
  } catch (err) {
    console.error("GET MY BLOGS ERROR:", err);
    res.status(500).json({ message: "Failed to load blogs" });
  }
};

/* ================= GET BLOG BY SLUG ================= */
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `blog:slug:${slug}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      Blog.updateOne({ _id: cached._id }, { $inc: { views: 1 } }).exec();
      return res.json(cached);
    }

    const blog = await Blog.findOne({
      slug,
      status: "published",
    })
      .populate("author", "fullname avatar")
      .lean();

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await setCache(cacheKey, blog, 600);
    Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).exec();

    res.json(blog);
  } catch (err) {
    console.error("GET BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to load blog" });
  }
};

/* ================= CREATE BLOG ================= */
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const blog = await Blog.create({
      title,
      content,
      excerpt,
      tags,
      category,
      status: status === "published" ? "published" : "draft",
      author: req.user.id,
      coverImage: req.file
        ? `/uploads/covers/${req.file.filename}`
        : null,
    });

    await delCache([
      "home:data",
      "blogs:latest",
      `user:dashboard:${req.user.id}`,
    ]);

    if (blog.category) {
      const cat = await Category.findById(blog.category).lean();
      if (cat) await delCache(`category:blogs:${cat.slug}`);
    }

    res.status(201).json(blog);
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

/* ================= UPDATE BLOG ================= */
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    delete req.body.author;
    delete req.body.slug;
    delete req.body.views;

    const oldCategory = blog.category?.toString();

    Object.assign(blog, req.body);
    await blog.save();

    await delCache([
      "home:data",
      "blogs:latest",
      `blog:slug:${blog.slug}`,
      `user:dashboard:${req.user.id}`,
    ]);

    if (oldCategory) {
      const cat = await Category.findById(oldCategory).lean();
      if (cat) await delCache(`category:blogs:${cat.slug}`);
    }

    if (blog.category && blog.category.toString() !== oldCategory) {
      const newCat = await Category.findById(blog.category).lean();
      if (newCat) await delCache(`category:blogs:${newCat.slug}`);
    }

    res.json(blog);
  } catch (err) {
    console.error("UPDATE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

/* ================= DELETE BLOG ================= */
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const slug = blog.slug;
    const categoryId = blog.category;

    await Comment.deleteMany({ blog: blog._id });
    deleteFile(blog.coverImage);
    await blog.deleteOne();

    await delCache([
      "home:data",
      "blogs:latest",
      `blog:slug:${slug}`,
      `user:dashboard:${req.user.id}`,
    ]);

    if (categoryId) {
      const cat = await Category.findById(categoryId).lean();
      if (cat) await delCache(`category:blogs:${cat.slug}`);
    }

    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error("DELETE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

/* ================= GET LATEST BLOGS ================= */
exports.getLatestBlogs = async (req, res) => {
  try {
    const cacheKey = "blogs:latest";

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const blogs = await Blog.find({ status: "published" })
      .populate("author", "fullname avatar")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    await setCache(cacheKey, blogs, 60);

    res.json(blogs);
  } catch (err) {
    console.error("GET LATEST BLOGS ERROR:", err);
    res.status(500).json({ message: "Failed to load latest blogs" });
  }
};

/* ================= GET BLOG FOR EDIT ================= */
exports.getBlogForEdit = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("category", "_id name");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(blog);
  } catch (err) {
    console.error("GET BLOG FOR EDIT ERROR:", err);
    res.status(500).json({ message: "Failed to load blog" });
  }
};

/* ================= UPDATE COVER ================= */
exports.updateCover = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    deleteFile(blog.coverImage);

    blog.coverImage = `/uploads/covers/${req.file.filename}`;
    await blog.save();

    await delCache(`blog:slug:${blog.slug}`);

    res.json({ coverImage: blog.coverImage });
  } catch (err) {
    console.error("UPDATE COVER ERROR:", err);
    res.status(500).json({ message: "Failed to update cover" });
  }
};
