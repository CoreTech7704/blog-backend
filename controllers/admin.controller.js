const User = require("../models/User");
const Blog = require("../models/blog");
const Category = require("../models/Category");
const { delCache } = require("../utils/cache");


/* ================= LOGIN PAGE ================= */
exports.loginPage = (req, res) => {
  res.render("admin/login");
};

/* ================= ADMIN LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const admin = await User.findOne({ email, role: "admin" }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    return res.render("admin/login", { error: "Invalid credentials" });
  }

  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.redirect("/admin/dashboard");
};

/* ================= DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  const [users, blogs, categories] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Category.countDocuments(),
  ]);

  res.render("admin/dashboard", {
    users,
    blogs,
    categories,
    csrfToken: req.csrfToken(), 
  });
};

/* ================= BLOGS ================= */
exports.blogs = async (req, res) => {
  const blogs = await Blog.find()
    .populate("author", "fullname")
    .sort({ createdAt: -1 });

  res.render("admin/blogs", {
    blogs,
    csrfToken: req.csrfToken(), 
  });
};

exports.publishBlog = async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, { status: "published" });

  await delCache(["home:data", "blogs:latest"]);

  res.redirect("/admin/blogs");
};

exports.unpublishBlog = async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, { status: "draft" });

  await delCache(["home:data", "blogs:latest"]);

  res.redirect("/admin/blogs");
};

exports.deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);

  await delCache(["home:data", "blogs:latest"]);

  res.redirect("/admin/blogs");
};

/* ================= CATEGORIES ================= */
exports.categories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  res.render("admin/categories", {
    categories,
    csrfToken: req.csrfToken(), 
  });
};

exports.createCategory = async (req, res) => {
  await Category.create({ name: req.body.name });
  await delCache("categories:all");
  res.redirect("/admin/categories");
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  await delCache("categories:all");
  res.redirect("/admin/categories");
};

/* ================= USERS ================= */
exports.users = async (req, res) => {
  const users = await User.find().select("fullname email role createdAt");

  res.render("admin/users", {
    users,
    csrfToken: req.csrfToken(), 
  });
};
