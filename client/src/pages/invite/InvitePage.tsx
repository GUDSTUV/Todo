import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getInvite, acceptInvite, type InviteDetails } from "../../api/invites/invites";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button/Button";
import { getInitials } from "../../utils/avatar";
import toast from "react-hot-toast";

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [acceptedListId, setAcceptedListId] = useState<string | null>(null);

  // Fetch invite details
  const { data: invite, isLoading, error } = useQuery<InviteDetails>({
    queryKey: ["invite", token],
    queryFn: () => getInvite(token!),
    enabled: !!token,
    retry: false,
  });

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(token!),
    onSuccess: (data) => {
      toast.success("Invitation accepted! Redirecting to list...");
      setAcceptedListId(data.data._id);
      setTimeout(() => {
        navigate(`/dashboard?list=${data.data._id}`);
      }, 1500);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const errorMsg = err?.response?.data?.error || "Failed to accept invitation";
      toast.error(errorMsg);
    },
  });

  // Auto-accept if user is already logged in and email matches
  useEffect(() => {
    if (
      invite &&
      isAuthenticated &&
      user?.email?.toLowerCase() === invite.email.toLowerCase() &&
      !acceptMutation.isPending &&
      !acceptedListId
    ) {
      acceptMutation.mutate();
    }
  }, [invite, isAuthenticated, user, acceptMutation, acceptedListId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invitation Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This invitation link is invalid or has expired.
          </p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (acceptedListId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invitation Accepted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting you to the list...
          </p>
        </div>
      </div>
    );
  }

  const expiresInDays = Math.ceil(
    (new Date(invite.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-purple-600 dark:text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're Invited!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {invite.invitedBy.name} wants to share a list with you
          </p>
        </div>

        {/* Inviter Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
          {invite.invitedBy.avatarUrl ? (
            <img
              src={invite.invitedBy.avatarUrl}
              alt={invite.invitedBy.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {getInitials(invite.invitedBy.name)}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {invite.invitedBy.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {invite.invitedBy.email}
            </p>
          </div>
        </div>

        {/* List Info */}
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
            Shared List
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📋 {invite.list.name}
          </p>
          {invite.list.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {invite.list.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Your role:</span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium capitalize">
              {invite.role}
            </span>
          </div>
        </div>

        {/* Expiration Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⏰ This invitation expires in {expiresInDays} {expiresInDays === 1 ? "day" : "days"}
          </p>
        </div>

        {/* Action Buttons */}
        {isAuthenticated ? (
          user?.email?.toLowerCase() === invite.email.toLowerCase() ? (
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="w-full"
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept Invitation"}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                This invitation is for <strong>{invite.email}</strong>, but you're
                logged in as <strong>{user?.email}</strong>.
              </p>
              <Button
                onClick={() => {
                  useAuthStore.getState().logout();
                  toast.success("Logged out. Please sign in with the invited email.");
                }}
                variant="secondary"
                className="w-full"
              >
                Log out and sign in with correct email
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <Link to={`/login?redirect=/invite/${token}`}>
              <Button className="w-full">Sign In to Accept</Button>
            </Link>
            <Link to={`/signup?email=${encodeURIComponent(invite.email)}&redirect=/invite/${token}`}>
              <Button variant="secondary" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
