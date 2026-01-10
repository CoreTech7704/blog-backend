const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const admin = require("../../middlewares/admin.middleware");
const category = require("../../controllers/category.controller");

/* Public */
router.get("/", category.getCategories);
router.get("/:slug/blogs", category.getBlogsByCategory);

/* Admin only */
router.post("/", auth, admin, category.createCategory);
router.put("/:id", auth, admin, category.updateCategory);
router.delete("/:id", auth, admin, category.deleteCategory);

module.exports = router;
