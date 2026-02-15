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
      default: null,
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

    readingTime: {
      type: Number, // minutes
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text search index
blogSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
});

/* ================= SLUG GENERATION ================= */
blogSchema.pre("save", function () {
  // Generate slug only if title changed
  if (this.isModified("title")) {
    this.slug =
      slugify(this.title, { lower: true, strict: true }) +
      "-" +
      Date.now().toString().slice(-5);
  }

  // Calculate reading time only if content changed
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content
      ? this.content.trim().split(/\s+/).length
      : 0;

    this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
});

module.exports = model("Blog", blogSchema);
