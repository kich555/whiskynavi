import { defineConfig } from "orval";

export default defineConfig({
  whiskynavi: {
    input: {
      target: "https://api-ca01.whiskynavi.com/v3/api-docs",
    },
    output: {
      target: "./src/apis/generated/api.ts",
      mode: "single",
      client: "fetch",
      baseUrl: "",
      tsconfig: {
        compilerOptions: {
          target: "es2020",
        },
      },
      override: {
        mutator: {
          path: "./src/apis/mutator.ts",
          name: "customFetch",
        },
      },
    },
  },
});
