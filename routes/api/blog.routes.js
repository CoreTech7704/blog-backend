const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const blogController = require("../../controllers/blog.controller");
const upload = require("../../middlewares/upload.middleware");


/* ================= PUBLIC ================= */
router.get("/latest", blogController.getLatestBlogs);
router.get("/edit/:id", auth, blogController.getBlogForEdit);
router.put(
  "/:id/cover",
  auth,
  upload.single("cover"),
  blogController.updateCover
);

/* ================= PROTECTED ================= */

router.get("/me", auth, blogController.getMyBlogs);
router.post("/", auth, blogController.createBlog);
router.put("/:id", auth, blogController.updateBlog);
router.delete("/:id", auth, blogController.deleteBlog);

/* ================= PUBLIC (LAST) ================= */
router.get("/:slug", blogController.getBlogBySlug);

module.exports = router;
