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
      "jest.config.js",
      "tailwind.config.js",
      "postcss.config.js",
    ],
  },
  // Extend Next.js configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rules
  {
    rules: {
      // Relaxed rules for development productivity
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      
      // Promote to errors - critical issues
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error", 
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      
      // Helpful warnings that don't block CI
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
      
      // React-specific helpful rules
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      
      // Import/export rules
      "import/no-unresolved": "error",
      "import/no-cycle": "warn",
      "import/order": [
        "warn",
        {
          "groups": [
            "builtin",
            "external", 
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],
    },
  },
];

export default eslintConfig;
