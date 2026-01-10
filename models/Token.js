const { Schema, model } = require("mongoose");
const crypto = require("crypto");

const tokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* Hash refresh token before saving */
tokenSchema.statics.hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = model("Token", tokenSchema);
