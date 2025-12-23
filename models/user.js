const { Schema, model } = require("mongoose");
const { createHmac, randomBytes } = require("crypto");

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageURL: {
      type: String,
      default: "/images/default.jpg",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(this.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedPassword;
});

// Static method to match password
userSchema.statics.matchPassword = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user || !user.salt) {
    throw new Error("Invalid credentials");
  }

  const hashedInput = createHmac("sha256", user.salt)
    .update(password)
    .digest("hex");

  if (hashedInput !== user.password) {
    throw new Error("Invalid credentials");
  }

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.salt;

  return userObj;
};

const User = model("User", userSchema);
module.exports = User;
