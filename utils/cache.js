const redis = require("../config/redis");

/* ================= GET CACHE ================= */
exports.getCache = async (key) => {
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ?? null;
  } catch (err) {
    console.error("❌ Redis GET failed:", err.message);
    return null;
  }
};

/* ================= SET CACHE ================= */
exports.setCache = async (key, value, ttl = 60) => {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttl });
  } catch (err) {
    console.error("❌ Redis SET failed:", err.message);
  }
};

/* ================= DELETE CACHE ================= */
exports.delCache = async (keys) => {
  if (!redis) return;

  try {
    if (Array.isArray(keys)) {
      await Promise.all(keys.map((k) => redis.del(k)));
    } else {
      await redis.del(keys);
    }
  } catch (err) {
    console.error("❌ Redis DEL failed:", err.message);
  }
};
