const Contact = require("../models/Contact");
const mongoose = require("mongoose");
const { sendEmail } = require("../utils/mailer");
const User = require("../models/User");

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

    // Send auto-reply email
    sendEmail(
      email,
      "We received your message 📩",
      `
      <div style="font-family: Arial, sans-serif; background:#f4f4f7;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">

          <tr>
            <td style="padding:30px;text-align:center;background:#0f172a;color:#ffffff;">
              <h2 style="margin:0;">Void Work</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px;color:#333;">Hi ${name},</p>

              <p style="font-size:16px;color:#333;">
                Thanks for contacting <strong>Void Work</strong> 🙌
              </p>

              <p style="font-size:15px;color:#555;">
                We’ve received your message and will get back to you as soon as possible.
              </p>

              <div style="background:#f1f5f9;padding:15px;border-radius:6px;margin:20px 0;">
                <p style="margin:0;font-size:14px;color:#333;"><strong>Your Message:</strong></p>
                <p style="margin-top:10px;font-size:14px;color:#555;">${message}</p>
              </div>

              <p style="font-size:14px;color:#555;">
                If your query is urgent, feel free to reply to this email.
              </p>

              <p style="margin-top:30px;">
                Regards,<br/>
                <strong>Sarvam Patel</strong><br/>
                Void Work
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;font-size:12px;color:#999;background:#f4f4f7;">
              © ${new Date().getFullYear()} Void Work
            </td>
          </tr>

        </table>
      </div>
      `
    ).catch((err) => {
      console.error("CONTACT AUTO-REPLY ERROR:", err);
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
