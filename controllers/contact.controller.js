const Contact = require("../models/Contact");
const mongoose = require("mongoose");

/* ================= CREATE CONTACT (PUBLIC) ================= */
exports.createContact = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;

    name = name?.trim();
    email = email?.trim();
    subject = subject?.trim();
    message = message?.trim();

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email and message are required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        message: "Message is too short",
      });
    }

    await Contact.create({
      name,
      email,
      subject: subject || "",
      message,
    });

    res.status(201).json({
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error("CREATE CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

/* ================= GET CONTACTS (ADMIN) ================= */
exports.getContacts = async (req, res) => {
  try {
    let { page = 1, limit = 20 } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Math.max(1, Number(limit)));
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find()
        .sort({ isRead: 1, createdAt: -1 }) // unread first
        .skip(skip)
        .limit(limit)
        .lean(),

      Contact.countDocuments(),
    ]);

    res.json({
      contacts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET CONTACTS ERROR:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

/* ================= MARK AS READ ================= */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).lean();

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(contact);
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    res.status(500).json({ message: "Failed to update message" });
  }
};

/* ================= DELETE CONTACT ================= */
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("DELETE CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to delete message" });
  }
};
