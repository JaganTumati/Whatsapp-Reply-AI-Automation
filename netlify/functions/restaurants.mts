import type { Config, Context } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { restaurants } from "../../db/schema.js";
import { error, json, readJson, stringValue } from "../../lib/http.js";

const allowedStatuses = new Set(["OPEN", "CLOSED", "PAUSED"]);
type NewRestaurant = typeof restaurants.$inferInsert;

function sharedRestaurantValues(body: Record<string, unknown>): Partial<NewRestaurant> {
  const status = stringValue(body.status)?.toUpperCase();

  if (status && !allowedStatuses.has(status)) {
    throw new Error("Status must be OPEN, CLOSED, or PAUSED.");
  }

  return Object.fromEntries(
    Object.entries({
      cuisineType: stringValue(body.cuisineType),
      phone: stringValue(body.phone),
      currency: stringValue(body.currency)?.toUpperCase(),
      status,
      addressLine: stringValue(body.addressLine),
      city: stringValue(body.city),
      state: stringValue(body.state),
      postalCode: stringValue(body.postalCode),
      country: stringValue(body.country),
      updatedAt: new Date(),
    }).filter(([, value]) => value !== undefined),
  );
}

function createRestaurantValues(body: Record<string, unknown>): NewRestaurant {
  const name = stringValue(body.name);
  if (!name) throw new Error("Restaurant name is required.");
  return { ...sharedRestaurantValues(body), name };
}

function updateRestaurantValues(body: Record<string, unknown>): Partial<NewRestaurant> {
  const name = stringValue(body.name);
  return name ? { ...sharedRestaurantValues(body), name } : sharedRestaurantValues(body);
}

export default async (request: Request, context: Context): Promise<Response> => {
  try {
    const id = context.params.id;

    if (request.method === "GET" && !id) {
      const rows = await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
      return json(rows);
    }

    if (request.method === "GET" && id) {
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
      return restaurant ? json(restaurant) : error("Restaurant not found.", 404);
    }

    if (request.method === "POST" && !id) {
      const values = createRestaurantValues(await readJson(request));
      const [restaurant] = await db.insert(restaurants).values(values).returning();
      return json(restaurant, 201);
    }

    if (request.method === "PATCH" && id) {
      const values = updateRestaurantValues(await readJson(request));
      const [restaurant] = await db
        .update(restaurants)
        .set(values)
        .where(eq(restaurants.id, id))
        .returning();
      return restaurant ? json(restaurant) : error("Restaurant not found.", 404);
    }

    if (request.method === "DELETE" && id) {
      const [restaurant] = await db.delete(restaurants).where(eq(restaurants.id, id)).returning();
      return restaurant ? new Response(null, { status: 204 }) : error("Restaurant not found.", 404);
    }

    return error("Method not allowed.", 405);
  } catch (cause) {
    console.error("Restaurant request failed", cause);
    return error(cause instanceof Error ? cause.message : "Restaurant request failed.");
  }
};

export const config: Config = {
  path: ["/api/restaurants", "/api/restaurants/:id"],
};
