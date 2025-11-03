// Common types used across the application

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  count?: number;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Type guard for Error objects
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for validation errors (Mongoose)
export function isValidationError(error: unknown): error is {
  name: string;
  errors: any;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as any).name === "ValidationError"
  );
}

// Helper to get error message
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
