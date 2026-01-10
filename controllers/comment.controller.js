const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET COMMENTS ================= */
exports.getComments = async (req, res) => {
  const { blogId } = req.params;
  const cacheKey = `blog:comments:${blogId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const comments = await Comment.find({ blog: blogId, isApproved: true })
    .populate("user", "fullname avatar")
    .sort({ createdAt: 1 })
    .lean();

  await setCache(cacheKey, comments, 60);

  res.json(comments);
};

/* ================= ADD COMMENT ================= */
exports.addComment = async (req, res) => {
  const { blogId } = req.params;
  const { content, parent } = req.body;

  const blogExists = await Blog.exists({ _id: blogId });
  if (!blogExists) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const comment = await Comment.create({
    blog: blogId,
    user: req.user.id,
    content,
    parent: parent || null,
  });

  await delCache(`blog:comments:${blogId}`);

  res.status(201).json(comment);
};

/* ================= DELETE COMMENT ================= */
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // permission check
  if (
    comment.user.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const blogId = comment.blog;

  await Comment.deleteMany({ parent: comment._id }); // delete replies
  await comment.deleteOne();

  await delCache(`blog:comments:${blogId}`);

  res.json({ message: "Comment deleted" });
};
