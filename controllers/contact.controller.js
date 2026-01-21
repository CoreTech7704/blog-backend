const Contact = require("../models/Contact");

/* ================= CREATE CONTACT (PUBLIC) ================= */
exports.createContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      message: "Name, email and message are required",
    });
  }

  await Contact.create({
    name,
    email,
    subject,
    message,
  });

  res.status(201).json({
    message: "Message sent successfully",
  });
};

/* ================= GET CONTACTS (ADMIN) ================= */
exports.getContacts = async (req, res) => {
  const contacts = await Contact.find()
    .sort({ isRead: 1, createdAt: -1 }) // unread first, latest first
    .lean();

  res.json(contacts);
};

/* ================= MARK AS READ ================= */
exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!contact) {
    return res.status(404).json({ message: "Message not found" });
  }

  res.json(contact);
};

/* ================= DELETE CONTACT ================= */
exports.deleteContact = async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findByIdAndDelete(id);

  if (!contact) {
    return res.status(404).json({ message: "Message not found" });
  }

  res.json({ message: "Message deleted" });
};
