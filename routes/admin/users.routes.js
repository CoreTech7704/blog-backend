const router = require("express").Router();
const users = require("../../controllers/admin/users.controller");

router.get("/", users.listUsers);
router.post("/:id/toggle-status", users.toggleUserStatus);

module.exports = router;