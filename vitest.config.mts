import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Testes de integração rodam em série para não disputarem o schema de teste.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
