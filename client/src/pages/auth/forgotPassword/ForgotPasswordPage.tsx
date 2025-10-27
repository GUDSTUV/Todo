import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import api from "../../../api/client/client";
import toast from "react-hot-toast";
import { Input } from "../../../components/ui/Input/Input";
import { Button } from "../../../components/ui/button/Button";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleBlur = () => {
    setTouched(true);
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log("Requesting password reset for:", email);

      const response = await api.post("/auth/forgot-password", { email });
      console.log("Password reset response:", response.data);

      setIsSuccess(true);
      toast.success(
        "If an account exists with this email, a password reset link has been sent."
      );
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const err = error as {
        response?: { data?: { error?: string }; status?: number };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        "Failed to process request. Please try again.";
      setErrors({ email: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          Todu
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Forgot Password
            </h2>
            {!isSuccess ? (
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Enter your email address and we'll send you a link to reset
                your password.
              </p>
            ) : (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ If an account exists with this email, a password reset link
                  has been sent. Please check your inbox and spam folder.
                </p>
              </div>
            )}
          </div>

          {!isSuccess && (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="Email address"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  error={touched && errors.email ? errors.email : undefined}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center space-y-2">
            <Link
              to="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Back to Login
            </Link>
            {isSuccess && (
              <div>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                    setTouched(false);
                    setErrors({});
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Try a different email
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
