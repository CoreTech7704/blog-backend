const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/admin/auth.middleware");
const { doubleCsrfProtection } = require("../config/csrf");
const csrfLocals = require("../middlewares/csrfLocals");

/* Auth */
router.get(
  "/login",
  doubleCsrfProtection,
  csrfLocals,
  admin.loginPage
);

router.post(
  "/login",
  doubleCsrfProtection,
  admin.login
);

/* Protected */
router.use(adminAuth, doubleCsrfProtection, csrfLocals);

router.get("/dashboard", admin.dashboard);
router.get("/blogs", admin.blogs);

router.post("/blogs/:id/publish", admin.publishBlog);
router.post("/blogs/:id/unpublish", admin.unpublishBlog);
router.post("/blogs/:id/delete", admin.deleteBlog);

router.get("/categories", admin.categories);
router.post("/categories", admin.createCategory);
router.post("/categories/:id/delete", admin.deleteCategory);

router.get("/users", admin.users);

module.exports = router;