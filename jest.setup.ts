import "@testing-library/jest-dom";
import "whatwg-fetch";

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by react-router-dom and other libraries)
if (typeof globalThis.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
