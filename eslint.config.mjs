// Flat config for the site's browser scripts (plain scripts, no bundler).
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", ".claude/**", "_site/**"],
  },
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        gsap: "readonly",
        ScrollTrigger: "readonly",
        Lenis: "readonly",
        // Defined in js/viz.js, which loads before main.js.
        renderViz: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { args: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
