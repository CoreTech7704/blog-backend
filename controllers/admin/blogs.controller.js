const Blog = require("../../models/blog");

/* LIST BLOGS */
exports.listBlogs = async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const blogs = await Blog.find(filter)
    .populate("author", "username")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.render("admin/blogs", {
    title: "Blog Moderation",
    activePage: "blogs",
    blogs,
  });
};

/* TOGGLE STATUS */
exports.toggleStatus = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.redirect("/admin/blogs");

  blog.status = blog.status === "published" ? "draft" : "published";
  await blog.save();

  res.redirect("/admin/blogs");
};

/* TOGGLE FEATURED */
exports.toggleFeatured = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.redirect("/admin/blogs");

  blog.featured = !blog.featured;
  await blog.save();

  res.redirect("/admin/blogs");
};

/* DELETE BLOG */
exports.deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/admin/blogs");
};