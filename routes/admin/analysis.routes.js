const router = require("express").Router();
const system = require("../../controllers/admin/system.controller");

router.get("/", system.systemStatus);

module.exports = router;