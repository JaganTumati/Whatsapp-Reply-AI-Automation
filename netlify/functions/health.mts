import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { restaurants } from "../../db/schema.js";
import { error, json } from "../../lib/http.js";

export default async (request: Request): Promise<Response> => {
  if (request.method !== "GET") {
    return error("Method not allowed.", 405);
  }

  try {
    await db.select({ id: restaurants.id }).from(restaurants).limit(1);
    return json({ status: "ok", database: "connected", runtime: "netlify-functions" });
  } catch (cause) {
    console.error("Health check failed", cause);
    return json({ status: "degraded", database: "unavailable" }, 503);
  }
};

export const config: Config = {
  path: "/api/health",
};
