const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const blog = require("../../controllers/blog.controller");

/* Public */
router.get("/latest", blog.getLatestBlogs);
router.get("/:slug", blog.getBlogBySlug);

/* Protected */
router.post("/", auth, blog.createBlog);
router.put("/:id", auth, blog.updateBlog);
router.delete("/:id", auth, blog.deleteBlog);

module.exports = router;
