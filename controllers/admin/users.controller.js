const User = require("../../models/User");

/* USERS LIST */
exports.listUsers = async (req, res) => {
  const users = await User.find()
    .select("fullname username email role isAuthor isActive createdAt")
    .sort({ createdAt: -1 });

  res.render("admin/users", {
    title: "User Management",
    activePage: "users",
    users,
  });
};

/* TOGGLE ACTIVE STATUS */
exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.redirect("/admin/users");

  user.isActive = !user.isActive;
  await user.save();

  res.redirect("/admin/users");
};