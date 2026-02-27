# ⚙️ Core Blog Backend API

A **secure, production-ready backend API** for a modern blogging platform, built with **Node.js, Express 5, and MongoDB**.

This service powers authentication, blog management, comments, categories, media uploads, and an **admin panel**, with real-world security, performance, and deployment considerations already handled.

---

## 🚀 Live Deployment

**Base URL**

```
https://blog-backend-3laz.onrender.com
```

> ⚠️ First request may be slow due to free-tier cold starts (Render).

---

## 📦 Tech Stack

* **Node.js**
* **Express 5**
* **MongoDB Atlas**
* **Mongoose**
* **JWT Authentication**
* **csrf-csrf** (Admin CSRF protection)
* **Multer** (media uploads)
* **Redis (Upstash)** – optional caching
* **Helmet** (security headers)
* **CORS**
* **Rate Limiting**
* **Compression**

---

## ✨ Features

### 🔐 Authentication & Security

* User signup & login
* JWT access + refresh token flow
* Role-based access control (**admin / user**)
* Protected API routes
* **CSRF protection for admin panel**
* Rate limiting on sensitive endpoints
* Secure HTTP-only cookies for admin auth
* Clean `npm audit` (no known vulnerabilities)

---

### 👤 User Management

* Fetch current user
* Update user profile
* Avatar upload with validation
* Secure user-only access

---

### 📝 Blog System

* Create, read, update, delete blogs
* Draft & publish workflow
* Markdown-based content
* Optional cover image upload
* SEO-friendly slugs
* Category association

---

### 🏷️ Categories

* Category CRUD (**admin-only**)
* Slug auto-generation
* Category-based blog filtering

---

### 💬 Comments

* Auth-protected comment creation
* Fetch comments by blog
* Comment deletion
* Endpoint-level rate limiting

---

### ⚡ Performance & Stability

* Gzip compression
* Graceful error handling
* Consistent JSON API responses
* Redis caching (best-effort on free tier)
* Safe Linux filesystem handling
* Production-ready middleware ordering

---

## 🧪 Tested & Verified

* Authentication & refresh token flow
* Admin login & CSRF protection
* Profile updates
* Avatar uploads
* Blog CRUD (with & without images)
* Category & comment APIs
* Rate limiting
* Error handling & edge cases
* Render deployment stability

---

## ⚠️ Known Limitations

* Uploaded files are stored on an **ephemeral filesystem** (Render free tier)
* Files may reset on redeploy
* Redis availability depends on free-tier limits
* No email / notification service yet

---

### 🧑‍💼 Admin Panel (v3)

* Secure admin login (JWT + cookies)
* Blog moderation (publish / unpublish / delete)
* Category management
* User overview
* CSRF-protected admin actions
* Server-rendered views (EJS)

---

## 📌 API Versioning

```
v2.0.0 — Stable (Beta Release)
```

> v3 development will focus on feature expansion, admin panel and UX improvements.

---

## 🛠️ Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production/development

PORT=8000 (only when using on localhost)

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:8000

MONGO_URL=your_mongodb_atlas_url

UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
UPSTASH_REDIS_REST_URL=your_upstash_redis_url

ADMIN_JWT_ACCESS_SECRET=your_admin_jwt_access_secret
ADMIN_JWT_REFRESH_SECRET=your_admin_jwt_refresh_secret

JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

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

---

## 📂 Project Structure

```
src/
├── config/
├── controllers/
├── middlewares/
├── models/
├── public/uploads/
├── routes/
├── scripts/
├── utils/
├── views/
├── index.js
```

---

## 🤝 Contributing

This project is currently in **beta**.

* Bug reports
* Security feedback
* Performance suggestions

are all welcome.

---

## 👨‍💻 Author

**Sarvam Patel**  
GitHub: [https://github.com/CoreTech7704](https://github.com/CoreTech7704)

---

## 🏁 Final Note

This backend is built with **real production constraints in mind**:
free-tier hosting, Linux filesystem behavior, security hardening, and modern middleware choices.

A solid foundation for long-term iteration 🚀
