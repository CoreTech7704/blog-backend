const express = require("express");
const router = express.Router();
const { searchBlogs } = require("../../controllers/search.controller");

router.get("/", searchBlogs);

module.exports = router;
