const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/admin/auth.middleware");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

/* Auth */
router.get("/login", admin.loginPage);
router.post("/login", admin.login);

/* Protected */
router.get("/dashboard", adminAuth, csrfProtection, admin.dashboard);

router.get("/blogs", adminAuth, csrfProtection, admin.blogs);
router.post("/blogs/:id/publish", adminAuth, csrfProtection, admin.publishBlog);
router.post("/blogs/:id/unpublish", adminAuth, csrfProtection, admin.unpublishBlog);
router.post("/blogs/:id/delete", adminAuth, csrfProtection, admin.deleteBlog);

router.get("/categories", adminAuth, csrfProtection, admin.categories);
router.post("/categories", adminAuth, csrfProtection, admin.createCategory);
router.post("/categories/:id/delete", adminAuth, csrfProtection, admin.deleteCategory);

router.get("/users", adminAuth, admin.users);

module.exports = router;
