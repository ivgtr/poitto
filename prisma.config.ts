import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// .env.localを明示的に読み込む
config({ path: ".env.local" });

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env.local file.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
