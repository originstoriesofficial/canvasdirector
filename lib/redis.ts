import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.canvasdirector_KV_REST_API_URL!,
  token: process.env.canvasdirector_KV_REST_API_TOKEN!,
});
