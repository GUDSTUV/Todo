import { Modal } from "../../components/ui/modal/Modal";
import { Button } from "../../components/ui/button/Button";
import { useAuthStore } from "../../store/authStore";
import { getInitials, getAvatarUrl } from "../../utils/avatar";
import type { List } from "../../api/lists/lists";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: List | null;
  onRemove?: (collaboratorId: string) => void;
}

export const CollaboratorModal = ({
  isOpen,
  onClose,
  list,
  onRemove,
}: CollaboratorModalProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
  } | null>(null);

  if (!list) return null;

  const isOwner = 
    typeof list.userId === "string"
      ? list.userId === currentUser?._id || list.userId === currentUser?.id
      : list.userId._id === currentUser?._id || list.userId._id === currentUser?.id;

  const allCollaborators = [
    {
      _id: typeof list.userId === "string" ? list.userId : list.userId._id,
      name: typeof list.userId === "string" ? "Owner" : list.userId.name,
      email: typeof list.userId === "string" ? "" : list.userId.email,
      avatarUrl: typeof list.userId === "string" ? undefined : list.userId.avatarUrl,
      role: "owner",
      isOnline: false, // Placeholder for future online status
    },
    ...list.sharedWith.map((collab) => ({
      _id: collab.userId._id,
      name: collab.userId.name,
      email: collab.userId.email,
      avatarUrl: collab.userId.avatarUrl,
      role: collab.role,
      isOnline: false, // Placeholder for future online status
    })),
  ];

  const handleSendMessage = (collaborator: typeof allCollaborators[0]) => {
    // Navigate to messages page with this user
    onClose(); // Close the modal first
    navigate(`/messages?user=${collaborator._id}`);
  };

  const handleViewProfile = (collaborator: typeof allCollaborators[0]) => {
    setSelectedProfile({
      name: collaborator.name,
      email: collaborator.email,
      avatarUrl: collaborator.avatarUrl,
      role: collaborator.role,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Collaborators on "${list.name}"`} size="md">
      <div className="space-y-3">
        {allCollaborators.map((collaborator) => {
          const initials = getInitials(collaborator.name);
          const avatarUrl = getAvatarUrl(collaborator.avatarUrl);
          
          return (
            <div
              key={collaborator._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Avatar with online indicator */}
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={collaborator.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient avatar if image fails to load
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-blue-600"
                    style={{
                      display: avatarUrl ? "none" : "flex",
                    }}
                  >
                    {initials}
                  </div>
                  {/* Online status indicator - placeholder for future WebSocket integration */}
                  {collaborator.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {collaborator.name}
                  </span>
                  {collaborator._id === currentUser?._id && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {collaborator.email}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      collaborator.role === "owner"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : collaborator.role === "editor"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {collaborator.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Send message button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSendMessage(collaborator)}
                title="Send message"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Button>

              {/* View profile button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleViewProfile(collaborator)}
                title="View profile"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Button>

              {/* Remove button - only show for owner and not for themselves */}
              {isOwner &&
                collaborator.role !== "owner" &&
                collaborator._id !== currentUser?._id &&
                onRemove && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRemove(collaborator._id)}
                    title="Remove from project"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>

    {/* Profile View Modal */}
    {selectedProfile && (
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title="User Profile"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            {selectedProfile.avatarUrl ? (
              <img
                src={getAvatarUrl(selectedProfile.avatarUrl)}
                alt={selectedProfile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold bg-blue-600 border-4 border-gray-200 dark:border-gray-700">
                {getInitials(selectedProfile.name)}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedProfile.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedProfile.email}
            </p>
          </div>

          {/* Role Badge */}
          <div
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              selectedProfile.role === "owner"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : selectedProfile.role === "editor"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {selectedProfile.role.charAt(0).toUpperCase() + selectedProfile.role.slice(1)}
          </div>

          {/* Additional Info - Placeholder for future features */}
          <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Member since project creation</p>
              {/* TODO: Add more user stats like tasks completed, contributions, etc. */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedProfile.email) {
                  window.location.href = `mailto:${selectedProfile.email}`;
                }
              }}
              className="flex-1"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Email
            </Button>
            <Button onClick={() => setSelectedProfile(null)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>
  );
};
