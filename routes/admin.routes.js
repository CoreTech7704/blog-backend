const router = require("express").Router();
const { overviewPage } = require("../controllers/admin/overview.controller");
const usersRoutes = require("./admin/users.routes");
const blogsRoutes = require("./admin/blogs.routes");
const categoriesRoutes = require("./admin/categories.routes");
const approvalsRoutes = require("./admin/approvals.routes");
const analysisRoutes = require("./admin/analysis.routes");
const contactsRoutes = require("./admin/contacts.routes");
const commentsRoutes = require("./admin/comments.routes");

router.get("/", overviewPage);
router.use("/users", usersRoutes);
router.use("/blogs", blogsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/approvals", approvalsRoutes);
router.use("/contacts", contactsRoutes);
router.use("/analysis", analysisRoutes);
router.use("/comments", commentsRoutes);

module.exports = router;