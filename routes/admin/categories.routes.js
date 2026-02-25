const router = require("express").Router();
const categories = require("../../controllers/admin/categories.controller");

router.get("/", categories.listCategories);
router.post("/", categories.createCategory);
router.post("/:id/delete", categories.deleteCategory);

module.exports = router;