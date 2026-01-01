const { Router } = require("express");
const Blog = require("../models/blog");
const upload = require("../middleware/upload");
const requireAuth = require("../middleware/requireAuth");

const router = Router();

/* ================= NEW BLOG FORM ================= */
router.get("/new", requireAuth, (req, res) => {
  res.render("addBlog");
});

/* ================= CREATE NEW BLOG ================= */
router.post("/new", requireAuth, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const published = req.body.published === "on";
    const tagsArray = req.body.tags
      ? req.body.tags.split(",").map((tag) => tag.trim())
      : [];

    const coverImageURL = req.file
      ? `/uploads/blog/${req.file.filename}`
      : undefined;

    const blog = await Blog.create({
      title,
      content,
      tags: tagsArray,
      coverImageURL,
      author: req.session.user._id,
      published,
    });

    res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.redirect("/blog/new");
  }
});

/* ================= VIEW SINGLE BLOG ================= */
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "fullname");

    if (!blog) {
      return res.status(404).render("404");
    }

    // If blog is not published, only author can view
    if (!blog.published) {
      if (!req.session.user || 
          blog.author._id.toString() !== req.session.user._id) {
        return res.status(403).send("Not authorized");
      }
    }

    res.render("viewBlog", { blog });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(400).send("Invalid blog ID");
  }
});

/* ================= EDIT BLOG FORM ================= */
router.get("/:id/edit", requireAuth, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.status(404).render("404");

  if (blog.author.toString() !== req.session.user._id) {
    return res.status(403).send("Not authorized");
  }

  res.render("editBlog", { blog });
});

/* ================= UPDATE BLOG ================= */
router.put("/:id", requireAuth, upload.single("coverImage"), async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.status(404).render("404");

  if (blog.author.toString() !== req.session.user._id) {
    return res.status(403).send("Not authorized");
  }

  blog.title = req.body.title;
  blog.content = req.body.content;

  if (req.file) {
    blog.coverImageURL = `/uploads/blog/${req.file.filename}`;
  }

  await blog.save();

  res.redirect(`/blog/${blog._id}`);
});

/* ================= DELETE BLOG ================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.status(404).render("404");

  if (blog.author.toString() !== req.session.user._id) {
    return res.status(403).send("Not authorized");
  }

  await blog.deleteOne();

  res.redirect("/");
});

/* ================= TOGGLE PUBLISH ================= */
router.post("/:id/toggle-publish", requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Ownership check
    if (blog.author.toString() !== req.session.user._id) {
      return res.status(403).send("Not authorized");
    }

    blog.published = !blog.published;
    await blog.save();

    res.redirect("/user/dashboard");
  } catch (err) {
    console.error("Toggle publish error:", err.message);
    res.redirect("/user/dashboard");
  }
});

module.exports = router;
