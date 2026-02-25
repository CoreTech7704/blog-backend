const Comment = require("../../models/Comment");

/* LIST COMMENTS */
exports.listComments = async (req, res) => {
  const comments = await Comment.find()
    .populate("user", "username")
    .populate("blog", "title")
    .sort({ createdAt: -1 });

  res.render("admin/comments", {
    title: "Comment Moderation",
    activePage: "comments",
    comments,
  });
};

/* APPROVE COMMENT */
exports.approveComment = async (req, res) => {
  await Comment.findByIdAndUpdate(req.params.id, {
    isApproved: true,
  });

  res.redirect("/admin/comments");
};

/* DELETE COMMENT */
exports.deleteComment = async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect("/admin/comments");
};