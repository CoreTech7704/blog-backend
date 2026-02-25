const User = require("../../models/User");
const Blog = require("../../models/blog");
const Category = require("../../models/Category");
const Contact = require("../../models/Contact");

exports.overviewPage = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBlogs,
      totalCategories,
      unreadReports,
      recentUsers,
      recentBlogs,
      recentContacts,
    ] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Category.countDocuments(),
      Contact.countDocuments({ isRead: false }),

      User.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select("username createdAt"),

      Blog.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("author", "username")
        .select("title author createdAt"),

      Contact.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select("name subject createdAt"),
    ]);

    // Unified activity feed
    const activity = [
      ...recentUsers.map(u => ({
        type: "user",
        message: `New user registered: ${u.username}`,
        time: u.createdAt,
        color: "green",
      })),

      ...recentBlogs.map(b => ({
        type: "blog",
        message: `New blog submitted: ${b.title}`,
        time: b.createdAt,
        color: "blue",
      })),

      ...recentContacts.map(c => ({
        type: "contact",
        message: `New contact message: ${c.subject || "No subject"}`,
        time: c.createdAt,
        color: "orange",
      })),
    ]
      .sort((a, b) => b.time - a.time)
      .slice(0, 6);

    res.render("admin/overview", {
      layout: "admin/layout",
      title: "Dashboard",
      activePage: "overview",

      stats: {
        totalUsers,
        totalBlogs,
        totalCategories,
        unreadReports,
      },

      activity,
    });
  } catch (err) {
    console.error("ADMIN OVERVIEW ERROR:", err);
    res.status(500).render("500");
  }
};