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
      "*.config.js",
      "*.config.mjs",
      "jest.config.js",
      "tailwind.config.js",
      "postcss.config.js",
    ],
  },
  // Extend Next.js configurations for all files first
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Then override specific rules
  {
    plugins: {
      "unused-imports": (await import("eslint-plugin-unused-imports")).default,
    },
    rules: {
      // Unused imports and variables (autoflake-like functionality)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-vars": "off", // Turn off default rule in favor of unused-imports

      // Other existing rules
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",

      // Import ordering and organization
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // React-specific helpful rules
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",

      // General code quality
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
    },
  },
  // Disable TypeScript rules for JavaScript files
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    rules: {
      // Turn off TypeScript-specific rules for JS files
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Use JavaScript equivalents
      "no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
