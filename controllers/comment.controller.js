const Comment = require("../models/Comment");
const Blog = require("../models/blog");
const mongoose = require("mongoose");
const { getCache, setCache, delCache } = require("../utils/cache");

/* ================= GET COMMENTS ================= */
exports.getComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const cacheKey = `blog:comments:${blogId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const comments = await Comment.find({
      blog: blogId,
      isApproved: true,
    })
      .populate("user", "fullname avatar")
      .sort({ createdAt: 1 })
      .lean();

    const response = {
      total: comments.length,
      comments,
    };

    await setCache(cacheKey, response, 60);

    res.json(response);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load comments" });
  }
};

/* ================= ADD COMMENT ================= */
exports.addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    let { content, parent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    content = content?.trim();

    if (!content || content.length < 2) {
      return res.status(400).json({ message: "Comment is too short" });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: "Comment is too long" });
    }

    const blogExists = await Blog.exists({
      _id: blogId,
      status: "published",
    });

    if (!blogExists) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ message: "Invalid parent comment ID" });
    }

    const comment = await Comment.create({
      blog: blogId,
      user: req.user.id,
      content,
      parent: parent || null,
      isApproved: true, // or false if you want moderation later
    });

    await delCache(`blog:comments:${blogId}`);

    res.status(201).json(comment);
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

/* ================= DELETE COMMENT ================= */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const blogId = comment.blog;

    await Comment.deleteMany({ parent: comment._id });
    await comment.deleteOne();

    await delCache(`blog:comments:${blogId}`);

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};
