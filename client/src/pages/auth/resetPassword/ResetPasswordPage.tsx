import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import api from "../../../api/client/client";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";
import { Input } from "../../../components/ui/Input/Input";
import { Button } from "../../../components/ui/button/Button";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { resetToken } = useParams<{ resetToken: string }>();
  const loginToStore = useAuthStore((s) => s.login);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<{
    password: boolean;
    confirmPassword: boolean;
  }>({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword")
          fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleBlur = (field: "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    if (!validate()) return;

    if (!resetToken) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Resetting password with token:", resetToken);

      const response = await api.put(`/auth/reset-password/${resetToken}`, {
        password,
      });
      console.log("Reset password response:", response.data);

      const { token, user } = response.data as {
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          preferences: {
            theme: "light" | "dark" | "system";
            timezone: string;
            language: string;
          };
        };
      };

      loginToStore(user, token);
      toast.success("Password reset successful! You are now logged in.");
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const err = error as {
        response?: { data?: { error?: string }; status?: number };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error || "Failed to reset password. Please try again.";
      
      if (errorMessage.includes("Invalid or expired")) {
        setErrors({ password: errorMessage });
        toast.error(errorMessage);
      } else {
        setErrors({ password: errorMessage });
        toast.error(errorMessage);
      }
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
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="New Password"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                error={
                  touched.password && errors.password
                    ? errors.password
                    : undefined
                }
                placeholder=""
                required
              />

              <Input
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                error={
                  touched.confirmPassword && errors.confirmPassword
                    ? errors.confirmPassword
                    : undefined
                }
                placeholder=""
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
