const router = require("express").Router();
const admin = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/admin/auth.middleware");
const {
    doubleCsrfProtection,
    generateToken,
} = require("../config/csrf");

/* Auth */
router.get("/login", (req, res) => {
    res.render("admin/login", {
        csrfToken: generateToken(req, res),
    });
});
router.post(
    "/login",
    doubleCsrfProtection,
    admin.login
);

/* Protected */
router.get(
    "/dashboard",
    adminAuth,
    (req, res) => {
        res.render("admin/dashboard", {
            csrfToken: generateToken(req, res),
        });
    }
);

router.get(
    "/blogs",
    adminAuth,
    (req, res) => {
        res.render("admin/blogs", {
            csrfToken: generateToken(req, res),
        });
    }
);

router.post(
    "/blogs/:id/publish",
    adminAuth,
    doubleCsrfProtection,
    admin.publishBlog
);

router.post(
    "/blogs/:id/unpublish",
    adminAuth,
    doubleCsrfProtection,
    admin.unpublishBlog
);

router.post(
    "/blogs/:id/delete",
    adminAuth,
    doubleCsrfProtection,
    admin.deleteBlog
);

router.get(
    "/categories",
    adminAuth,
    (req, res) => {
        res.render("admin/categories", {
            csrfToken: generateToken(req, res),
        });
    }
);

router.post(
    "/categories",
    adminAuth,
    doubleCsrfProtection,
    admin.createCategory
);

router.post(
    "/categories/:id/delete",
    adminAuth,
    doubleCsrfProtection,
    admin.deleteCategory
);

router.get("/users", adminAuth, admin.users);

module.exports = router;
