import type { Config, Context } from "@netlify/functions";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { menuCategories, menuItems } from "../../db/schema.js";
import {
  booleanValue,
  error,
  integerValue,
  json,
  readJson,
  stringValue,
} from "../../lib/http.js";

function pathKind(pathname: string): "category" | "item" | "menu" {
  if (pathname.includes("/categories")) return "category";
  if (pathname.includes("/items")) return "item";
  return "menu";
}

export default async (request: Request, context: Context): Promise<Response> => {
  const url = new URL(request.url);
  const kind = pathKind(url.pathname);
  const id = context.params.id;
  const restaurantId = url.searchParams.get("restaurantId") ?? undefined;

  try {
    if (request.method === "GET" && kind === "menu") {
      if (!restaurantId) return error("restaurantId is required.");
      const [categories, items] = await Promise.all([
        db
          .select()
          .from(menuCategories)
          .where(eq(menuCategories.restaurantId, restaurantId))
          .orderBy(asc(menuCategories.displayOrder)),
        db
          .select()
          .from(menuItems)
          .where(eq(menuItems.restaurantId, restaurantId))
          .orderBy(asc(menuItems.name)),
      ]);
      return json({ categories, items });
    }

    if (request.method === "GET" && kind === "category") {
      if (!restaurantId) return error("restaurantId is required.");
      const rows = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, restaurantId))
        .orderBy(asc(menuCategories.displayOrder));
      return json(rows);
    }

    if (request.method === "GET" && kind === "item") {
      if (!restaurantId) return error("restaurantId is required.");
      const rows = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId))
        .orderBy(asc(menuItems.name));
      return json(rows);
    }

    if (request.method === "POST" && kind === "category" && !id) {
      const body = await readJson(request);
      const categoryRestaurantId = stringValue(body.restaurantId);
      const name = stringValue(body.name);
      if (!categoryRestaurantId || !name) return error("restaurantId and name are required.");
      const [category] = await db
        .insert(menuCategories)
        .values({
          restaurantId: categoryRestaurantId,
          name,
          displayOrder: integerValue(body.displayOrder) ?? 0,
          active: booleanValue(body.active) ?? true,
        })
        .returning();
      return json(category, 201);
    }

    if (request.method === "POST" && kind === "item" && !id) {
      const body = await readJson(request);
      const itemRestaurantId = stringValue(body.restaurantId);
      const categoryId = stringValue(body.categoryId);
      const name = stringValue(body.name);
      const price = stringValue(body.price) ?? (typeof body.price === "number" ? String(body.price) : undefined);
      if (!itemRestaurantId || !categoryId || !name || !price) {
        return error("restaurantId, categoryId, name, and price are required.");
      }
      const spicyLevel = integerValue(body.spicyLevel) ?? 0;
      if (spicyLevel < 0 || spicyLevel > 3) return error("spicyLevel must be between 0 and 3.");
      const [item] = await db
        .insert(menuItems)
        .values({
          restaurantId: itemRestaurantId,
          categoryId,
          name,
          description: stringValue(body.description),
          price,
          vegetarian: booleanValue(body.vegetarian) ?? false,
          spicyLevel,
          available: booleanValue(body.available) ?? true,
          imageUrl: stringValue(body.imageUrl),
        })
        .returning();
      return json(item, 201);
    }

    if (request.method === "PATCH" && id && kind === "category") {
      const body = await readJson(request);
      const values = Object.fromEntries(
        Object.entries({
          name: stringValue(body.name),
          displayOrder: integerValue(body.displayOrder),
          active: booleanValue(body.active),
          updatedAt: new Date(),
        }).filter(([, value]) => value !== undefined),
      );
      const [category] = await db
        .update(menuCategories)
        .set(values)
        .where(eq(menuCategories.id, id))
        .returning();
      return category ? json(category) : error("Category not found.", 404);
    }

    if (request.method === "PATCH" && id && kind === "item") {
      const body = await readJson(request);
      const price = stringValue(body.price) ?? (typeof body.price === "number" ? String(body.price) : undefined);
      const values = Object.fromEntries(
        Object.entries({
          categoryId: stringValue(body.categoryId),
          name: stringValue(body.name),
          description: stringValue(body.description),
          price,
          vegetarian: booleanValue(body.vegetarian),
          spicyLevel: integerValue(body.spicyLevel),
          available: booleanValue(body.available),
          imageUrl: stringValue(body.imageUrl),
          updatedAt: new Date(),
        }).filter(([, value]) => value !== undefined),
      );
      const [item] = await db.update(menuItems).set(values).where(eq(menuItems.id, id)).returning();
      return item ? json(item) : error("Menu item not found.", 404);
    }

    if (request.method === "DELETE" && id && kind === "category") {
      const [category] = await db.delete(menuCategories).where(eq(menuCategories.id, id)).returning();
      return category ? new Response(null, { status: 204 }) : error("Category not found.", 404);
    }

    if (request.method === "DELETE" && id && kind === "item") {
      const [item] = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
      return item ? new Response(null, { status: 204 }) : error("Menu item not found.", 404);
    }

    return error("Method not allowed.", 405);
  } catch (cause) {
    console.error("Menu request failed", cause);
    return error(cause instanceof Error ? cause.message : "Menu request failed.");
  }
};

export const config: Config = {
  path: [
    "/api/menu",
    "/api/menu/categories",
    "/api/menu/categories/:id",
    "/api/menu/items",
    "/api/menu/items/:id",
  ],
};
