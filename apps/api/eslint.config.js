import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "drizzle"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Express's Request<Params, ResBody, ReqBody, Query> generic idiomatically
      // uses `{}` for unused positions throughout this codebase's controllers.
      "@typescript-eslint/no-empty-object-type": ["error", { allowObjectTypes: "always" }],
      "max-lines": ["error", { max: 380, skipBlankLines: true, skipComments: true }],
    },
  },
]);
