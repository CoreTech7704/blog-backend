const { createClient } = require("redis");

let redis;

if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
      keepAlive: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.error("❌ Redis reconnect failed after 5 attempts");
          return new Error("Redis reconnect failed");
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

redis.on("error", (err) => {
  if (!err.message.includes("Socket closed")) {
    console.error("❌ Redis error:", err.message);
  }
});


  (async () => {
    try {
      await redis.connect();
    } catch (err) {
      console.error("❌ Redis connection failed:", err.message);
    }
  })();
} else {
  console.warn("⚠️ REDIS_URL not set. Cache disabled.");
  redis = null;
}

module.exports = redis;
