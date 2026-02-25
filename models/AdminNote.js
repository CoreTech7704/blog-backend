const adminNoteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);