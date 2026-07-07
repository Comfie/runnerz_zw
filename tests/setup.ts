import { config } from "dotenv";

config({ path: ".env.test", override: true });

if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL must come from .env.test and point at a test database (name must contain 'test').",
  );
}
