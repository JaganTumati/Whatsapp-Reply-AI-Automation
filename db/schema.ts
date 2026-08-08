import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cuisineType: text("cuisine_type"),
  phone: text("phone"),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("OPEN").notNull(),
  addressLine: text("address_line"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  ...timestamps(),
});

export const menuCategories = pgTable(
  "menu_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("menu_categories_restaurant_idx").on(table.restaurantId),
    uniqueIndex("menu_categories_restaurant_name_idx").on(table.restaurantId, table.name),
  ],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    vegetarian: boolean("vegetarian").default(false).notNull(),
    spicyLevel: integer("spicy_level").default(0).notNull(),
    available: boolean("available").default(true).notNull(),
    imageUrl: text("image_url"),
    ...timestamps(),
  },
  (table) => [
    index("menu_items_restaurant_idx").on(table.restaurantId),
    index("menu_items_category_idx").on(table.categoryId),
  ],
);
