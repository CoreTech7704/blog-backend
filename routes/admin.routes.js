const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("admin/overview", {
    title: "Overview",
  });
});

router.get("/users", (req, res) => {
  res.render("admin/users", {
    title: "User Management",
  });
});

router.get("/blogs", (req, res) => {
  res.render("admin/blogs", {
    title: "Blog Moderation",
  });
});

router.get("/categories", (req, res) => {
  res.render("admin/categories", {
    title: "Categories",
  });
});

router.get("/approvals", (req, res) => {
  res.render("admin/approvals", {
    title: "Admin Approvals",
  });
});

router.get("/contacts", (req, res) => {
  res.render("admin/contacts", {
    title: "Contact Reports",
  });
});

router.get("/analysis", (req, res) => {
  res.render("admin/analysis", {
    title: "Platform Analysis",
  });
});

module.exports = router;