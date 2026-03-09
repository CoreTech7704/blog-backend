const Blog = require("../models/blog");
const Comment = require("../models/Comment");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const { getCache, setCache, delCache } = require("../utils/cache");
const cloudinary = require("../utils/cloudinary");
const deleteCloudinary = require("../utils/deleteCloudinary");
const updateAuthorStatus = require("../utils/updateAuthorStatus");

// Helper to clear relevant caches after blog creation/update
async function postCreateCleanup(blog, userId) {
  // clear global + user caches
  await delCache([
    "home:data",
    "blogs:latest",
    `user:dashboard:${userId}`,
  ]);

  // clear category cache
  if (blog.category) {
    const cat = await Category.findById(blog.category).lean();
    if (cat) {
      await delCache(`category:blogs:${cat.slug}`);
    }
  }

  // update author status if published
  if (blog.status === "published") {
    await updateAuthorStatus(userId);
  }
}

/* ================= GET MY BLOGS ================= */
exports.getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(blogs);
  } catch (err) {
    console.error("GET MY BLOGS ERROR:", err);
    res.status(500).json({ message: "Failed to load blogs" });
  }
};

/* ================= GET BLOG BY SLUG ================= */
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `blog:slug:${slug}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      Blog.updateOne({ _id: cached._id }, { $inc: { views: 1 } }).exec();
      return res.json(cached);
    }

    const blog = await Blog.findOne({
      slug,
      status: "published",
    })
      .populate("author", "fullname username avatar")
      .lean();

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await setCache(cacheKey, blog, 600);
    Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).exec();

    res.json(blog);
  } catch (err) {
    console.error("GET BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to load blog" });
  }
};

/* ================= CREATE BLOG ================= */
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    let parsedTags = ["General"];
    if (req.body.tags) {
      try {
        parsedTags = JSON.parse(req.body.tags);
        if (!Array.isArray(parsedTags) || !parsedTags.length) {
          parsedTags = ["General"];
        }
      } catch {
        parsedTags = ["General"];
      }
    }

    const blog = new Blog({
      title,
      content,
      excerpt,
      tags: parsedTags,
      category,
      status: status === "published" ? "published" : "draft",
      author: req.user.id,
    });

    // 🔥 CLOUDINARY COVER UPLOAD
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `voidwork/blog-covers/${blog._id}`,
        },
        async (err, result) => {
          if (err) throw err;

          blog.cover = {
            url: result.secure_url,
            publicId: result.public_id,
          };

          await blog.save();
          await postCreateCleanup(blog, req.user.id);

          res.status(201).json(blog);
        }
      );

      uploadStream.end(req.file.buffer);
      return;
    }

    await blog.save();
    await postCreateCleanup(blog, req.user.id);
    res.status(201).json(blog);
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

/* ================= UPDATE BLOG ================= */
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    delete req.body.author;
    delete req.body.slug;
    delete req.body.views;

    const oldCategory = blog.category?.toString();
    const oldStatus = blog.status;

    // Handle tags safely
    if (req.body.tags) {
      if (Array.isArray(req.body.tags) && req.body.tags.length > 0) {
        blog.tags = req.body.tags.map(t => t.trim()).filter(Boolean);
      } else {
        blog.tags = ["General"];
      }
      delete req.body.tags;
    }

    Object.assign(blog, req.body);
    await blog.save();

    await delCache([
      "home:data",
      "blogs:latest",
      `blog:slug:${blog.slug}`,
      `user:dashboard:${req.user.id}`,
    ]);

    if (oldCategory) {
      const cat = await Category.findById(oldCategory).lean();
      if (cat) await delCache(`category:blogs:${cat.slug}`);
    }

    if (blog.category && blog.category.toString() !== oldCategory) {
      const newCat = await Category.findById(blog.category).lean();
      if (newCat) await delCache(`category:blogs:${newCat.slug}`);
    }

    if (oldStatus !== blog.status) {
      await updateAuthorStatus(blog.author);
    }

    res.json(blog);
  } catch (err) {
    console.error("UPDATE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

/* ================= DELETE BLOG ================= */
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const slug = blog.slug;
    const categoryId = blog.category;

    await Comment.deleteMany({ blog: blog._id });
    if (blog.cover?.publicId) {
      await deleteCloudinary(blog.cover.publicId);
    }
    await blog.deleteOne();

    await delCache([
      "home:data",
      "blogs:latest",
      `blog:slug:${slug}`,
      `user:dashboard:${req.user.id}`,
    ]);

    if (categoryId) {
      const cat = await Category.findById(categoryId).lean();
      if (cat) await delCache(`category:blogs:${cat.slug}`);
    }

    await updateAuthorStatus(blog.author);
    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error("DELETE BLOG ERROR:", err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

/* ================= GET LATEST BLOGS ================= */
exports.getLatestBlogs = async (req, res) => {
  try {
    const cacheKey = "blogs:latest";

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const blogs = await Blog.find({ status: "published" })
      .populate("author", "fullname username avatar")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    await setCache(cacheKey, blogs, 60);

    res.json(blogs);
  } catch (err) {
    console.error("GET LATEST BLOGS ERROR:", err);
    res.status(500).json({ message: "Failed to load latest blogs" });
  }
};

/* ================= GET BLOG FOR EDIT ================= */
exports.getBlogForEdit = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "category",
      "_id name",
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(blog);
  } catch (err) {
    console.error("GET BLOG FOR EDIT ERROR:", err);
    res.status(500).json({ message: "Failed to load blog" });
  }
};

/* ================= UPDATE COVER ================= */
exports.updateCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No cover image provided" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // delete old cover
    if (blog.cover?.publicId) {
      await deleteCloudinary(blog.cover.publicId);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `voidwork/blog-covers/${blog._id}`,
      },
      async (err, result) => {
        if (err) throw err;

        blog.cover = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        await blog.save();
        await delCache(`blog:slug:${blog.slug}`);

        res.json({ cover: blog.cover });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error("UPDATE COVER ERROR:", err);
    res.status(500).json({ message: "Failed to update cover" });
  }
};
