const { Redis } = require("@upstash/redis");

let redis = null;

try {
  redis = Redis.fromEnv();
  console.log("✅ Upstash Redis initialized");
} catch (err) {
  console.error("❌ Redis init failed:", err.message);
}

module.exports = redis;
