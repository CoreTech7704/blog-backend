const router = require("express").Router();
const notes = require("../../controllers/admin/notes.controller");

router.get("/", notes.listNotes);
router.post("/", notes.createNote);
router.post("/:id/delete", notes.deleteNote);

module.exports = router;