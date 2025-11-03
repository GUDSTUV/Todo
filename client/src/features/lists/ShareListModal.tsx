import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shareList, removeCollaborator } from "../../api/lists/lists";
import { Modal } from "../../components/ui/modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/button/Button";
import type { ShareListModalProps } from "./ShareListModal.type";

const ShareListModal = ({ isOpen, onClose, list }: ShareListModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: ({ listId, email, role }: { listId: string; email: string; role: "viewer" | "editor" }) =>
      shareList(listId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list", list?._id] });
      setEmail("");
      setError("");
    },
    onError: (err: unknown) => {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || "Failed to share list");
      } else {
        setError("Failed to share list");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ listId, collaboratorId }: { listId: string; collaboratorId: string }) =>
      removeCollaborator(listId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list", list?._id] });
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || !email.trim()) return;

    shareMutation.mutate({ listId: list._id, email: email.trim(), role });
  };

  const handleRemove = (collaboratorId: string) => {
    if (!list) return;
    removeMutation.mutate({ listId: list._id, collaboratorId });
  };

  const isOwner = list && (typeof list.userId === "string" ? true : list.userId._id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${list?.name}"`}
      size="md"
    >
      <div className="space-y-6">
        {/* Share Form */}
        {isOwner && (
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Permission
              </label>
              <select
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as "viewer" | "editor")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="viewer">Viewer (Read only)</option>
                <option value="editor">Editor (Can edit tasks)</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={shareMutation.isPending || !email.trim()}
            >
              {shareMutation.isPending ? "Sharing..." : "Share List"}
            </Button>
          </form>
        )}

        {/* Collaborators List */}
        {list?.sharedWith && list.sharedWith.length > 0 && (
          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Shared with ({list.sharedWith.length})
            </h3>
            <div className="space-y-2">
              {list.sharedWith.map((collaborator) => (
                <div
                  key={collaborator.userId._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {collaborator.userId.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {collaborator.userId.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {collaborator.role}
                    </span>
                    {isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemove(collaborator.userId._id)}
                        disabled={removeMutation.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!list?.sharedWith || list.sharedWith.length === 0) && !isOwner && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>This list hasn't been shared with anyone yet.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareListModal;
