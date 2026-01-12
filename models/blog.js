const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    excerpt: {
      type: String,
      maxlength: 300,
      default: "",
    },

    content: {
      type: String,
      required: true,
    },

    coverImage: {
      type: String,
      default: "/images/blog-default.jpg",
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    tags: [String],

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* ================= GET MY BLOGS ================= */
exports.getMyBlogs = async (req, res) => {
  const blogs = await Blog.find({
    author: req.user.id, // 🔥 THIS MATCHES YOUR DB
  })
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.json(blogs);
};

/* ================= SLUG GENERATION ================= */
blogSchema.pre("save", function () {
  if (!this.isModified("title")) return;

  this.slug =
    slugify(this.title, { lower: true, strict: true }) +
    "-" +
    Date.now().toString().slice(-5);
});

module.exports = model("Blog", blogSchema);
