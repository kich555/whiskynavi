import { defineConfig } from "orval";

export default defineConfig({
  blindTasting: {
    input: { target: "./openapi/blind-tasting-admin.json" },
    output: {
      target: "./src/apis/generated/blind-tasting.ts",
      mode: "single",
      client: "fetch",
      baseUrl: "",
      tsconfig: { compilerOptions: { target: "es2020" } },
      override: { mutator: { path: "./src/apis/blind-tasting-mutator.ts", name: "blindTastingFetch" } },
    },
  },
  whiskynavi: {
    input: {
      target: process.env.OPENAPI_URL ?? "https://api-ca01.whiskynavi.com/v3/api-docs",
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
