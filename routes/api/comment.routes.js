const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const comment = require("../../controllers/comment.controller");

/* Public */
router.get("/blogs/:blogId/comments", comment.getComments);

/* Protected */
router.post("/blogs/:blogId/comments", auth, comment.addComment);
router.delete("/comments/:commentId", auth, comment.deleteComment);

module.exports = router;
