const multer = require("multer");
const path = require("path");
const fs = require("fs");

// DEFINE BASE
const uploadBase = path.join(__dirname, "../public/uploads");

// DEFINE SUB BASE
const avatarDir = path.join(uploadBase, "avatars");
const coverDir = path.join(uploadBase, "covers");

// ENSURE ALL DIRECTORIES EXIST
[uploadBase, avatarDir, coverDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") {
      cb(null, coverDir);
    } else if (file.fieldname === "avatar") {
      cb(null, avatarDir);
    } else {
      cb(new Error("Invalid upload field"), null);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
