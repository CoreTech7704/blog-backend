const router = require("express").Router();
const { overviewPage } = require("../controllers/admin/overview.controller");
const usersRoutes = require("./admin/users.routes");
const blogsRoutes = require("./admin/blogs.routes");
const categoriesRoutes = require("./admin/categories.routes");
const approvalsRoutes = require("./admin/approvals.routes");
const analysisRoutes = require("./admin/analysis.routes");
const contactsRoutes = require("./admin/contacts.routes");
const commentsRoutes = require("./admin/comments.routes");
const adminLogin = require("../controllers/admin/adminAuth.controller").adminLogin;
const authAdmin = require("../middlewares/authAdmin");

// Admin auth controller
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});
router.post("/auth/login", adminLogin);

// Protected admin routes
router.get("/dashboard", authAdmin, overviewPage);
router.use("/users", authAdmin, usersRoutes);
router.use("/blogs", authAdmin, blogsRoutes);
router.use("/categories", authAdmin, categoriesRoutes);
router.use("/approvals", authAdmin, approvalsRoutes);
router.use("/contacts", authAdmin, contactsRoutes);
router.use("/analysis", authAdmin, analysisRoutes);
router.use("/comments", authAdmin, commentsRoutes);

router.post("/logout", (req, res) => {
  res
    .clearCookie("admin_access_token")
    .clearCookie("admin_refresh_token");

  return res.redirect("/admin/login");
});

module.exports = router;