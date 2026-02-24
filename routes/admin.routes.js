const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/admin/auth.middleware");
const { csrfProtection } = require("../config/csrf");

// GET login page → CSRF middleware GENERATES token
router.get(
  "/login",
  csrfProtection,
  (req, res) => {
    res.render("admin/login", {
      csrfToken: req.csrfToken,
      error: null,
    });
  }
);

// POST login → CSRF validates token
router.post("/login", csrfProtection, admin.login);

router.use(adminAuth);

router.get("/dashboard", admin.dashboard);
router.get("/blogs", admin.blogs);

router.post("/blogs/:id/publish", csrfProtection, admin.publishBlog);
router.post("/blogs/:id/unpublish", csrfProtection, admin.unpublishBlog);
router.post("/blogs/:id/delete", csrfProtection, admin.deleteBlog);

router.get("/categories", admin.categories);
router.post("/categories", csrfProtection, admin.createCategory);
router.post("/categories/:id/delete", csrfProtection, admin.deleteCategory);

router.get("/users", admin.users);

router.post("/logout", csrfProtection, admin.logout);

module.exports = router;