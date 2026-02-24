const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const email = "admin@voidwork.com";
    const username = "admin"; // must be unique
    const password = "123456789"; // change after login

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      fullname: "Void Work Admin",
      username,            
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,   
    });

    console.log("✅ Admin seeded successfully");
    console.log("Email:", email);
    console.log("Username:", username);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Admin seed failed", err);
    process.exit(1);
  }
};

seedAdmin();