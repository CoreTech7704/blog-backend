require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");

async function seedCategories() {
  await mongoose.connect(process.env.MONGO_URL);

  await Category.deleteMany();

  const categories = [
    { name: "Backend" },
    { name: "Frontend" },
    { name: "React" },
    { name: "JavaScript" },
  ];

  for (const cat of categories) {
    await Category.create(cat);
  }

  console.log("✅ Categories seeded");
  process.exit();
}

seedCategories();
