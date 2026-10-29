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
    "landing/**",
    "archives/**",
    "brag-output/**",
    "android/**",
  ]),
  {
    rules: {
      // Next 16 compiler plugin: treat as warnings until those screens are rewritten.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
