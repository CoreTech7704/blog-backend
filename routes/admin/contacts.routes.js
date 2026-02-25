
const router = require("express").Router();
const contacts = require("../../controllers/admin/contacts.controller");

router.get("/", contacts.listContacts);
router.post("/:id/read", contacts.markRead);
router.post("/:id/delete", contacts.deleteContact);

module.exports = router;