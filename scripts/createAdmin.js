require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const exists = await User.findOne({ email: "admin@example.com" });
    if (exists) {
      console.log("❌ Admin already exists");
      process.exit(0);
    }

    const admin = await User.create({
      fullname: "Admin User",
      username: "admin",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
      isEmailVerified: true,
    });

    console.log("✅ Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
