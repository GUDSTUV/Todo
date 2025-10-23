import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": ts, react, prettier },
    rules: {
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["warn"]
    }
  }
];
