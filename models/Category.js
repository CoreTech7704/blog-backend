const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", function () {
  if (!this.isModified("name")) return;
  this.slug = slugify(this.name, { lower: true, strict: true });
});

module.exports = model("Category", categorySchema);
