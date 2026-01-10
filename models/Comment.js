const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null, // for replies
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Comment", commentSchema);
