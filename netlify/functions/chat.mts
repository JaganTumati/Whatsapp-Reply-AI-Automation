import { GoogleGenAI } from "@google/genai";
import type { Config } from "@netlify/functions";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { menuCategories, menuItems, restaurants } from "../../db/schema.js";
import { error, json, readJson, stringValue } from "../../lib/http.js";

function createAiClient(): GoogleGenAI {
  return new GoogleGenAI({});
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return error("Method not allowed.", 405);

  try {
    const body = await readJson(request);
    const restaurantId = stringValue(body.restaurantId);
    const message = stringValue(body.message);
    if (!restaurantId || !message) return error("restaurantId and message are required.");

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);
    if (!restaurant) return error("Restaurant not found.", 404);

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

    const menu = items
      .filter((item) => item.available)
      .map((item) => {
        const category = categories.find((candidate) => candidate.id === item.categoryId)?.name ?? "Menu";
        return `${category}: ${item.name} — ${restaurant.currency} ${item.price}${item.vegetarian ? " (vegetarian)" : ""}`;
      })
      .join("\n");

    const response = await createAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are the concise ordering assistant for ${restaurant.name}. Only answer from the restaurant details and menu below. If information is missing, say so clearly.\n\nRestaurant status: ${restaurant.status}\nCuisine: ${restaurant.cuisineType ?? "unspecified"}\nMenu:\n${menu || "No available menu items."}\n\nCustomer: ${message}`,
            },
          ],
        },
      ],
    });

    return json({ response: response.text || "I could not generate a response." });
  } catch (cause) {
    console.error("Chat request failed", cause);
    return error("The AI assistant is temporarily unavailable.", 503);
  }
};

export const config: Config = {
  path: "/api/chat",
};
