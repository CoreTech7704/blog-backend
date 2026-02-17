const Blog = require("../models/blog");
const User = require("../models/User");

async function updateAuthorStatus(userId) {
  const count = await Blog.countDocuments({
    author: userId,
    status: "published",
  });

  await User.findByIdAndUpdate(userId, {
    isAuthor: count > 0,
  });
}

module.exports = updateAuthorStatus;
