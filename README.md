# ⚙️ Core Blog Backend API - v2.5.0

A **secure, production-ready backend API** for a modern blogging platform, built with **Node.js, Express 5, and MongoDB**.

This service powers authentication, blog management, comments, categories, **Cloudinary-backed media uploads**, and an **admin panel**, with real-world security, performance, and deployment constraints already handled.


## 🚀 Live Deployment

**Base URL**

```
https://blog-backend-3laz.onrender.com
```

> ⚠️ First request may be slow due to free-tier cold starts (Render).


## 📦 Tech Stack

### Core

* **Node.js**
* **Express 5**
* **MongoDB Atlas**
* **Mongoose**

### Auth & Security

* **JWT Authentication (access + refresh)**
* **Role-based access control (admin / user)**
* **Helmet** (security headers)
* **CORS**
* **Rate Limiting**

### Media & Performance

* **Multer (memory storage)**
* **Cloudinary (image storage + CDN)**
* **Redis (Upstash)** – optional caching
* **Compression**


## ✨ Features

### 🔐 Authentication & Security

* User signup & login
* JWT access + refresh token flow
* Protected API routes
* Role-based permissions
* Rate limiting on sensitive endpoints
* Secure HTTP-only cookies (admin)
* Clean `npm audit` (no known vulnerabilities)

### 👤 User Management

* Fetch authenticated user
* Update profile data
* Avatar upload with validation
* Cloudinary-hosted avatars
* Automatic image replacement & cleanup
* Strict ownership checks

### 📝 Blog System

* Create, read, update, delete blogs
* Draft & publish workflow
* Markdown-based content
* Optional cover image upload
* Cloudinary-hosted blog covers
* SEO-friendly slugs
* Reading-time calculation
* Author status updates

### 🏷️ Categories

* Category CRUD (**admin-only**)
* Slug auto-generation
* Category-based blog filtering
* Cache-aware invalidation

### 💬 Comments

* Auth-protected comment creation
* Fetch comments per blog
* Comment deletion
* Endpoint-level rate limiting

### ⚡ Performance & Stability

* Redis caching (best-effort on free tier)
* Cache invalidation strategy
* Gzip compression
* Graceful error handling
* Consistent JSON responses
* Safe async controller patterns
* Production-ready middleware ordering

## 🧪 Tested & Verified

* Authentication & refresh flow
* Admin login & protection
* Profile updates & avatar uploads
* Blog CRUD (with & without covers)
* Cloudinary persistence across restarts
* Category & comment APIs
* Cache invalidation correctness
* Rate limiting
* Render deployment stability

## ⚠️ Known Limitations

* Free-tier hosting causes cold starts
* Redis availability depends on free-tier limits
* No email / notification service yet

## 🧑‍💼 Admin Panel

* Secure admin login (JWT + cookies)
* Blog moderation (publish / unpublish / delete)
* Category management
* User overview
* Server-rendered views (EJS)

## 📌 API Versioning

```
v2.5.0 — Stable
```

> v2.5 introduces **Cloudinary-based media storage**, improved schema design, and production-safe image lifecycle handling.


## 🛠️ Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production/development
PORT=8000

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:8000

MONGO_URL=your_mongodb_atlas_url

UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
UPSTASH_REDIS_REST_URL=your_upstash_redis_url

JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

ADMIN_JWT_ACCESS_SECRET=your_admin_jwt_access_secret
ADMIN_JWT_REFRESH_SECRET=your_admin_jwt_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_pass
```

## 🧑‍💻 Local Development

```bash
git clone https://github.com/CoreTech7704/blog-backend.git
cd blog-backend
npm install
npm run dev
```

Server runs at:

```
http://localhost:8000
```

## 📂 Project Structure

```
src/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── utils/
├── views/          # Admin panel (EJS)
├── index.js
```

## 🤝 Contributing

This project is **stable and actively evolving**.

* Bug reports
* Security feedback
* Performance suggestions

are all welcome.

## 👨‍💻 Author

**Sarvam Patel**
GitHub: [https://github.com/CoreTech7704](https://github.com/CoreTech7704)
