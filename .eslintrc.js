module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ["prettier"],
  plugins: ["prettier", "html"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
  },
};
