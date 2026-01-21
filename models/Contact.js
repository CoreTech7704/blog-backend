const { Schema, model } = require("mongoose");

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    subject: {
      type: String,
      maxlength: 150,
      default: "",
    },

    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

// TTL index (auto-delete after 30 days)
contactSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = model("Contact", contactSchema);
