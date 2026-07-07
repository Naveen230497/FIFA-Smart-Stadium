export default [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        console: "readonly",
        alert: "readonly"
      }
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": "warn",
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-proto": "error",
      "no-extend-native": "error",
      "curly": "error",
      "no-throw-literal": "error",
      "strict": ["error", "global"]
    }
  }
];
