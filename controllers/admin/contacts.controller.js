const Contact = require("../../models/Contact");

/* LIST CONTACT REPORTS */
exports.listContacts = async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status === "unread") filter.isRead = false;
  if (status === "read") filter.isRead = true;

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 });

  res.render("admin/contacts", {
    title: "Contact Reports",
    activePage: "contacts",
    contacts,
  });
};

/* MARK AS READ */
exports.markRead = async (req, res) => {
  await Contact.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });

  res.redirect("/admin/contacts");
};

/* DELETE CONTACT */
exports.deleteContact = async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.redirect("/admin/contacts");
};