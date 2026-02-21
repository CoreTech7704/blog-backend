# ⚙️ Core Blog Backend API

A secure, scalable backend API for a modern blogging platform, built with **Node.js, Express, and MongoDB**.
Handles authentication, blog management, comments, categories, and media uploads with production-ready middleware and deployment.


## 🚀 Live API

**Base URL:**

```
https://blog-backend-3laz.onrender.com
```

> ⚠️ First request may be slow due to free-tier cold starts.



## 📦 Tech Stack

* **Node.js**
* **Express**
* **MongoDB Atlas**
* **Mongoose**
* **JWT Authentication**
* **Multer** (media uploads)
* **Redis** (optional caching)
* **Helmet** (security headers)
* **CORS**
* **Rate Limiting**
* **Compression**



## ✨ Features

### 🔐 Authentication & Security

* User signup & login
* JWT access + refresh token flow
* Role-based access control (admin/user)
* Protected routes
* CSRF protection for admin routes
* Rate limiting on sensitive endpoints



### 👤 User Management

* Fetch current user
* Update user profile
* Avatar upload with validation
* Secure user-only access



### 📝 Blog System

* Create, read, update, delete blogs
* Draft & publish workflow
* Markdown-based content
* Optional cover image upload
* SEO-friendly slugs
* Category association



### 🏷️ Categories

* Category CRUD (admin-only)
* Slug auto-generation
* Category-based blog filtering



### 💬 Comments

* Auth-protected comment creation
* Fetch comments by blog
* Comment deletion
* Rate limiting applied



### ⚡ Performance & Stability

* Gzip compression
* Graceful error handling
* Clean JSON API responses
* Redis caching (best-effort on free tier)
* Safe Linux filesystem handling

---

## 🧪 Tested & Verified

* Authentication & refresh flow
* Profile updates
* Avatar uploads
* Blog CRUD (with & without images)
* Category & comment APIs
* Rate limiting
* Error & timeout handling
* Render deployment stability



## ⚠️ Known Limitations

* Uploaded files stored on ephemeral filesystem (Render free tier)
* Files may reset on redeploy
* Redis availability depends on free-tier limits
* No email services yet



## 📌 API Version

```
v2.0.0 (Stable Beta)
```

---

## 🛠️ Environment Variables

Create a `.env` file in the root:

```env
PORT=8000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:8000
MONGO_URL=your_mongodb_atlas_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CSRF_SECRET=your_CSRF_secret_kry
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
```


## 🧑‍💻 Local Development

```bash
git clone https://github.com/CoreTech7704/blog-backend.git
cd blog-backend
npm install
npm run dev
```

Server will start at:

```
http://localhost:8000
```


## 📂 Project Structure

```
src/
├── controllers/
├── routes/
├── middlewares/
├── models/
├── utils/
├── public/uploads/
├── scripts/
├── index.js
```



## 🤝 Contributing

This backend is currently in **beta**.
Bug reports and improvement suggestions are welcome.



## 👨‍💻 Author

**Sarvam Patel**
GitHub: [https://github.com/CoreTech7704](https://github.com/CoreTech7704)



## 🏁 Final Note

This backend is designed to be **secure, scalable, and deployment-ready**, with real-world considerations like free-tier hosting, Linux filesystem behavior, and API hardening already handled.

Ready for production iteration 🚀
