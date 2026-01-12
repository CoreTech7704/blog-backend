require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const cors = require("cors");
const compression = require("compression");
const csrfProtection = csrf({ cookie: true });

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const PORT = process.env.PORT || 8000;

/* =============== Rate Limits ================ */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, try later",
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use("/api/blogs/:blogId/comments", commentLimiter);

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* ================= EXPRESS SETTINGS ================= */
app.set("trust proxy", 1);

/* ================= VIEW ENGINE (ADMIN ONLY) ================= */
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.resolve("./public")));
app.use(methodOverride("_method"));

/* ================= RATE LIMIT ================= */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

/* ================= ROUTES ================= */

// API routes (React frontend)
app.use("/api/auth", authLimiter, require("./routes/api/auth.routes"));
app.use("/api/blogs", require("./routes/api/blog.routes"));
app.use("/api/categories", require("./routes/api/category.routes"));
app.use("/api/user", require("./routes/api/user.routes"));
app.use("/api/home", require("./routes/api/home.routes"));

// Admin (EJS only)
app.use("/admin", csrfProtection, require("./routes/admin.routes"));

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  res.status(404).render("404");
});

/* ================= ERROR HANDLER ================= */
app.use(require("./middlewares/error.middleware"));

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
