const router = require("express").Router();
const auth = require("../../controllers/auth.controller");

/* Auth */
router.post("/signup", auth.signup);
router.get("/verify-email/:token", auth.verifyEmail);

router.post("/login", auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password/:token", auth.resetPassword);

module.exports = router;
