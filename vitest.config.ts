import { defineConfig, defineProject } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: false,
    include: [],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
    projects: [
      defineProject({
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "src"),
          },
        },
        esbuild: {
          jsx: "automatic",
          jsxImportSource: "react",
        },
        test: {
          name: "frontend",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
        },
      }),
      defineProject({
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "src"),
          },
        },
        test: {
          name: "backend",
          environment: "node",
          include: ["tests/**/*.spec.ts"],
        },
      }),
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
