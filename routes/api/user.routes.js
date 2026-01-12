const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const user = require("../../controllers/user.controller");
const upload = require("../../middlewares/upload.middleware");

// ✅ Current logged-in user
router.get("/me", auth, user.getProfile);
router.put("/me", auth, user.updateProfile);
router.put("/me/avatar", auth, upload.single("avatar"), user.updateAvatar);

// Dashboard
router.get("/dashboard", auth, user.dashboard);

module.exports = router;
