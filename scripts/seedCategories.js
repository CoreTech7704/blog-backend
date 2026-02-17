require("dotenv").config();
const mongoose = require("mongoose");
const slugify = require("slugify");

const Category = require("../models/Category");
const Blog = require("../models/blog");
const Comment = require("../models/Comment");

async function resetDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("📦 Connected to MongoDB");

    // 1️⃣ Delete dependent data FIRST
    await Comment.deleteMany();
    console.log("🧹 Comments cleared");

    await Blog.deleteMany();
    console.log("🧹 Blogs cleared");

    // 2️⃣ Delete categories
    await Category.deleteMany();
    console.log("🧹 Categories cleared");

    // 3️⃣ Reseed categories
    const categories = [
      "Technology",
      "Software Development",
      "Web Development",
      "Backend Engineering",
      "Frontend Engineering",
      "DevOps & Cloud",
      "Cybersecurity",
      "Data & AI",
      "System Design",
      "UI / UX Design",
      "Tutorials",
      "Career & Growth",
      "Tech News",
    ];

    for (const name of categories) {
      await Category.create({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      });
    }

    console.log("✅ Database reset & categories reseeded");
    process.exit();
  } catch (err) {
    console.error("❌ RESET FAILED:", err);
    process.exit(1);
  }
}

resetDatabase();
