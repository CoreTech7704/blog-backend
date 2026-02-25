const { Schema, model } = require("mongoose");

const adminNoteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 150,
    },

    body: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: ["normal", "high", "critical"],
      default: "normal",
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("AdminNote", adminNoteSchema);