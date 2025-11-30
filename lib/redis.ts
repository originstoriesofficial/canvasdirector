import { Redis } from "@upstash/redis";

// The Upstash → Vercel integration automatically sets the correct env vars,
// so we can use fromEnv() without manual URL/token handling.
export const redis = Redis.fromEnv();
