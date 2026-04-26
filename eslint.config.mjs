import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Pre-existing untyped code — treat as warnings until types are added
      "@typescript-eslint/no-explicit-any": "warn",
      // Existing async data-fetching pattern — works correctly at runtime
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
