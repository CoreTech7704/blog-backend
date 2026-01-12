const router = require("express").Router();
const authController = require("../../controllers/auth.controller");
const auth = require("../../middlewares/auth.middleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", auth, authController.me);

module.exports = router;
