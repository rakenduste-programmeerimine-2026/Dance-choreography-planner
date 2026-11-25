// Vitest runs unit tests only; Playwright specs live in e2e/.
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { exclude: ["e2e/**", "node_modules/**"] } });
