# Restaurant AI on Netlify

This repository now contains a Netlify-native deployment at the repository root. The original Spring Boot application remains in `restaurant-ai-platform/restaurant-ai-platform` as a reference implementation, while the deployable service uses Netlify Functions, Netlify Database, and Netlify AI Gateway.

## Deployment structure

- `public/` contains the operational landing page.
- `netlify/functions/` contains the serverless API endpoints.
- `db/schema.ts` defines the managed Postgres schema with Drizzle ORM.
- `netlify/database/migrations/` contains migrations applied automatically by Netlify.
- `netlify.toml` configures the publish and functions directories.

No database connection string or Gemini API key is required in the repository. Netlify provisions the database connection and AI Gateway credentials at runtime.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check the function runtime and database connection |
| `GET`, `POST` | `/api/restaurants` | List or create restaurants |
| `GET`, `PATCH`, `DELETE` | `/api/restaurants/:id` | Manage a restaurant |
| `GET` | `/api/menu?restaurantId=:id` | Fetch a restaurant's full menu |
| `GET`, `POST` | `/api/menu/categories` | List or create categories |
| `PATCH`, `DELETE` | `/api/menu/categories/:id` | Manage a category |
| `GET`, `POST` | `/api/menu/items` | List or create menu items |
| `PATCH`, `DELETE` | `/api/menu/items/:id` | Manage a menu item |
| `POST` | `/api/chat` | Generate a menu-aware customer response |

List routes for categories and items require a `restaurantId` query parameter. Create routes require `restaurantId` in the JSON body. The chat route accepts `restaurantId` and `message`.

## Local validation

Install dependencies with `npm install` and run static validation with `npm run typecheck`. Netlify applies database migrations automatically during deployment.
