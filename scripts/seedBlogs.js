require("dotenv").config();
const mongoose = require("mongoose");

const Blog = require("../models/blog");
const User = require("../models/User");
const Category = require("../models/Category");

async function seedBlogs() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected");

    const author = await User.findOne();
    if (!author) {
      throw new Error("No users found. Create a user first.");
    }

    // 🧹 Clear existing data
    await Blog.deleteMany();
    await Category.deleteMany();

    console.log("🗑️ Existing blogs & categories cleared");

    const categoryDocs = [];

    for (const name of ["Backend", "Frontend", "React", "Programming"]) {
      const category = await Category.create({ name }); // ✅ triggers pre("save")
      categoryDocs.push(category);
    }

    // Helper
    const getCategory = (name) => categoryDocs.find((c) => c.name === name)._id;

    // 📝 Blog data with categories
    const blogs = [
      {
        title: "Understanding Event Loop in Node.js",
        excerpt:
          "A deep dive into how the Node.js event loop works and why it matters.",
        content:
          "The event loop allows Node.js to perform non-blocking I/O operations...",
        tags: ["Node.js", "JavaScript"],
        category: getCategory("Backend"),
        status: "published",
        views: 120,
        author: author._id,
        featured: true,
      },
      {
        title: "React Rendering Explained Simply",
        excerpt: "Learn how React renders components efficiently.",
        content: "React uses a virtual DOM to efficiently update the UI...",
        tags: ["React"],
        category: getCategory("React"),
        status: "published",
        views: 95,
        author: author._id,
      },
      {
        title: "Why Understanding Systems Beats Memorizing Code",
        excerpt: "Good developers focus on systems, not snippets.",
        content:
          "Memorizing code helps short-term, but systems knowledge scales...",
        tags: ["Career", "Programming"],
        category: getCategory("Programming"),
        status: "published",
        views: 210,
        author: author._id,
        featured: true,
      },
    ];

    // 🚀 Create blogs (triggers slug middleware)
    for (const blog of blogs) {
      await Blog.create(blog);
    }

    console.log("🚀 Categories & blogs seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

seedBlogs();
