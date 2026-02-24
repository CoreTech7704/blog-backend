const { Schema, model } = require("mongoose");

const adminNoteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["normal", "high", "critical"],
      default: "normal",
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