const Category = require("../../models/Category");
const Blog = require("../../models/blog");

/* LIST CATEGORIES */
exports.listCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  // Count blogs per category
  const categoryStats = await Blog.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const blogCountMap = {};
  categoryStats.forEach(item => {
    if (item._id) blogCountMap[item._id.toString()] = item.count;
  });

  res.render("admin/categories", {
    title: "Categories",
    activePage: "categories",
    categories,
    blogCountMap,
  });
};

/* CREATE CATEGORY */
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.redirect("/admin/categories");

  await Category.create({ name });
  res.redirect("/admin/categories");
};

/* DELETE CATEGORY */
exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.redirect("/admin/categories");
};