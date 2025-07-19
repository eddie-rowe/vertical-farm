import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores - must be first
  {
    ignores: [
      "test-results/**/*",
      "playwright-report/**/*",
      "**/*.json", 
      "next-env.d.ts",
      ".next/**/*",
      "out/**/*",
      "dist/**/*",
      "node_modules/**/*",
      "jest.config.js",
      "*.config.js",
    ],
  },
  // Extend Next.js configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn", 
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
