const AdminNote = require("../../models/AdminNote");

/* LIST NOTES */
exports.listNotes = async (req, res) => {
  const notes = await AdminNote.find()
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });

  res.render("admin/approvals", {
    title: "Admin Notes",
    activePage: "approvals",
    notes,
  });
};

/* CREATE NOTE */
exports.createNote = async (req, res) => {
  const { title, body, priority } = req.body;

  if (!title || !body) {
    return res.redirect("/admin/approvals");
  }

  await AdminNote.create({
    title,
    body,
    priority,
    // TEMP: replace with logged-in admin later
    createdBy: req.user?._id || "000000000000000000000000",
  });

  res.redirect("/admin/approvals");
};

/* DELETE NOTE */
exports.deleteNote = async (req, res) => {
  await AdminNote.findByIdAndDelete(req.params.id);
  res.redirect("/admin/approvals");
};
