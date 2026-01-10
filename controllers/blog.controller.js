const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET BLOG BY SLUG (CACHED) ================= */
exports.getBlogBySlug = async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `blog:slug:${slug}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    // increment views asynchronously
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

  await setCache(cacheKey, blog, 600); // 10 min cache

  Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).exec();

  res.json(blog);
};

/* ================= CREATE BLOG ================= */
exports.createBlog = async (req, res) => {
  const { title, content, excerpt, tags, category, status } = req.body;

  const blog = await Blog.create({
    title,
    content,
    excerpt,
    tags,
    category,
    status: status || "draft",
    author: req.user.id,
  });

  await delCache([
    "home:data",
    "blogs:latest",
    `user:dashboard:${req.user.id}`,
  ]);

  if (blog.category) {
    await delCache(`category:blogs:${blog.category}`);
  }

  res.status(201).json(blog);
};

/* ================= UPDATE BLOG ================= */
exports.updateBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  Object.assign(blog, req.body);
  await blog.save();

  await delCache([
    "home:data",
    "blogs:latest",
    `blog:slug:${slug}`,
    `user:dashboard:${req.user.id}`,
  ]);

  if (blog.category) {
    await delCache(`category:blogs:${blog.category}`);
  }

  res.json(blog);
};

/* ================= DELETE BLOG ================= */
exports.deleteBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const slug = blog.slug;

  await Comment.deleteMany({ blog: blog._id });
  await blog.deleteOne();

  await delCache([
    "home:data",
    "blogs:latest",
    `blog:slug:${slug}`,
    `user:dashboard:${req.user.id}`,
  ]);

  if (blog.category) {
    await delCache(`category:blogs:${blog.category}`);
  }

  res.json({ message: "Blog deleted" });
};

/* ================= GET LATEST BLOGS (CACHED) ================= */
exports.getLatestBlogs = async (req, res) => {
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
};
