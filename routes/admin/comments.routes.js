const router = require("express").Router();
const comments = require("../../controllers/admin/comments.controller");

router.get("/", comments.listComments);
router.post("/:id/approve", comments.approveComment);
router.post("/:id/delete", comments.deleteComment);

module.exports = router;