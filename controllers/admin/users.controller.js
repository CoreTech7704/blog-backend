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

/* SEARCH USERS */
exports.listUsers = async (req, res) => {
  const q = req.query.q;

  let filter = {};

  if (q) {
    filter = {
      $or: [
        { fullname: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    };
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.render("admin/users", {
    title: "Users",
    activePage: "users",
    users,
    query: { q },
  });
};