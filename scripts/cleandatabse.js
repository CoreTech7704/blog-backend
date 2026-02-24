const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Blog = require("../models/blog");
const Contact = require("../models/Contact");
const Comment = require("../models/Comment")
const Token = require("../models/Token")
// ❗ DO NOT require Category

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    await Promise.all([
      User.deleteMany({}),
      Blog.deleteMany({}),
      Contact.deleteMany({}),
      Token.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    console.log("🧹 Database reset complete");
    console.log("✅ Categories preserved");

    process.exit(0);
  } catch (err) {
    console.error("❌ Reset failed", err);
    process.exit(1);
  }
};

resetDB();