module.exports = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  const status = err.status || 500;

  if (req.originalUrl.startsWith("/api")) {
    return res.status(status).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    });
  }

  res.status(status).render("500");
};
