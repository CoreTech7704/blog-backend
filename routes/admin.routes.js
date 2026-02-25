const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("admin/overview", {
    layout: "admin/layout",
    title: "Dashboard",
    activePage: "dashboard",
  });
});

router.get("/users", (req, res) => {
  res.render("admin/users", {
    layout: "admin/layout",
    title: "User Management",
    activePage: "users",
  });
});

router.get("/blogs", (req, res) => {
  res.render("admin/blogs", {
    layout: "admin/layout",
    title: "Blog Moderation",
    activePage: "blogs",
  });
});

router.get("/categories", (req, res) => {
  res.render("admin/categories", {
    layout: "admin/layout",
    title: "Categories",
    activePage: "categories",
  });
});

router.get("/approvals", (req, res) => {
  res.render("admin/approvals", {
    layout: "admin/layout",
    title: "Admin Approvals",
    activePage: "approvals",
  });
});

router.get("/contacts", (req, res) => {
  res.render("admin/contacts", {
    layout: "admin/layout",
    title: "Contact Reports",
    activePage: "contacts",
  });
});

router.get("/analysis", (req, res) => {
  res.render("admin/analysis", {
    layout: "admin/layout",
    title: "Platform Analysis",
    activePage: "analysis",
  });
});

module.exports = router;