const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const user = require("../../controllers/user.controller");

router.get("/profile", auth, user.getProfile);
router.put("/profile", auth, user.updateProfile);
router.get("/dashboard", auth, user.dashboard);

module.exports = router;
