const { createClient } = require("redis");

const redis = createClient({
  url: "redis://localhost:6379"
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

module.exports = {
  redis,
  connectRedis
};
