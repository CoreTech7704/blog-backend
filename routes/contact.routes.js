const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");
const contact = require("../controllers/contact.controller");
const rateLimit = require("express-rate-limit");

/* ================= RATE LIMIT ================= */
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many messages, please try later",
});

/* ================= PUBLIC ================= */
router.post("/contact", contactLimiter, contact.createContact);

/* ================= ADMIN ================= */
router.get("/admin/contacts", auth, admin, contact.getContacts);
router.put("/admin/contacts/:id/read", auth, admin, contact.markAsRead);
router.delete("/admin/contacts/:id", auth, admin, contact.deleteContact);

module.exports = router;
