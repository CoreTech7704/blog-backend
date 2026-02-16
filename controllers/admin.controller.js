const User = require("../models/User");
const Blog = require("../models/blog");
const Category = require("../models/Category");
const { delCache } = require("../utils/cache");
const jwt = require("jsonwebtoken");

const ADMIN_COOKIE = "adminToken";

/* ================= LOGIN PAGE ================= */
exports.loginPage = (req, res) => {
  res.render("admin/login");
};

/* ================= ADMIN LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({
      email,
      role: "admin",
    }).select("+password");

    if (!admin || !(await admin.comparePassword(password))) {
      return res.render("admin/login", {
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.render("admin/login", {
      error: "Something went wrong",
    });
  }
};

/* ================= LOGOUT ================= */
exports.logout = (req, res) => {
  res.clearCookie(ADMIN_COOKIE);
  res.redirect("/admin/login");
};

/* ================= DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).send("Failed to load dashboard");
  }
};

/* ================= BLOGS ================= */
exports.blogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "fullname")
      .sort({ createdAt: -1 });

    res.render("admin/blogs", {
      blogs,
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    console.error("ADMIN BLOGS ERROR:", err);
    res.status(500).send("Failed to load blogs");
  }
};

exports.publishBlog = async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, {
    status: "published",
  });

  await delCache([
    "home:data",
    "blogs:latest",
  ]);

  res.redirect("/admin/blogs");
};

exports.unpublishBlog = async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, {
    status: "draft",
  });

  await delCache([
    "home:data",
    "blogs:latest",
  ]);

  res.redirect("/admin/blogs");
};

exports.deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);

  await delCache([
    "home:data",
    "blogs:latest",
  ]);

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
  const users = await User.find()
    .select("fullname email role createdAt");

  res.render("admin/users", {
    users,
    csrfToken: req.csrfToken(),
  });
};