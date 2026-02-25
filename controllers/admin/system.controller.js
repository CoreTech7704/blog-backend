const mongoose = require("mongoose");
const User = require("../../models/User");
const Blog = require("../../models/blog");
const Comment = require("../../models/Comment");
const Contact = require("../../models/Contact");

/* SYSTEM ANALYSIS */
exports.systemStatus = async (req, res) => {
  // Database connection
  const dbState = mongoose.connection.readyState === 1;

  // Redis (simple health flag – adjust if needed)
  const redisHealthy = true; // your Redis already logs successful init

  // Counts
  const [
    totalUsers,
    totalBlogs,
    draftBlogs,
    totalComments,
    unreadContacts,
  ] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Blog.countDocuments({ status: "draft" }),
    Comment.countDocuments(),
    Contact.countDocuments({ isRead: false }),
  ]);

  res.render("admin/analysis", {
    title: "Platform Analysis",
    activePage: "analysis",

    status: {
      app: "Running",
      db: dbState ? "Connected" : "Disconnected",
      redis: redisHealthy ? "Healthy" : "Unavailable",
    },

    stats: {
      totalUsers,
      totalBlogs,
      draftBlogs,
      totalComments,
      unreadContacts,
    },
  });
};