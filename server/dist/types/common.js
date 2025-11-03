"use strict";
// Common types used across the application
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
exports.isValidationError = isValidationError;
exports.getErrorMessage = getErrorMessage;
// Type guard for Error objects
function isError(error) {
    return error instanceof Error;
}
// Type guard for validation errors (Mongoose)
function isValidationError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ValidationError");
}
// Helper to get error message
function getErrorMessage(error) {
    if (isError(error)) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "An unknown error occurred";
}
