const router = require("express").Router();
const blogs = require("../../controllers/admin/blogs.controller");

router.get("/", blogs.listBlogs);

router.post("/:id/toggle-status", blogs.toggleStatus);
router.post("/:id/toggle-featured", blogs.toggleFeatured);
router.post("/:id/delete", blogs.deleteBlog);

module.exports = router;