import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTaskComments,
  createComment,
  deleteComment,
  type Comment,
} from "../../api/comments/comments";
import { Button } from "../../components/ui/button/Button";
import { Textarea } from "../../components/ui/textarea/Textarea";
import { useAuthStore } from "../../store/authStore";
import { highlightMentions } from "../../utils/mentions";
import { getInitials, getAvatarUrl } from "../../utils/avatar";

interface CommentsSectionProps {
  taskId: string;
}

export const CommentsSection = ({ taskId }: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => getTaskComments(taskId),
    enabled: !!taskId,
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => createComment(taskId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setNewComment("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const comments = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {currentUser && currentUser.avatarUrl && getAvatarUrl(currentUser.avatarUrl) ? (
              <img
                src={getAvatarUrl(currentUser.avatarUrl)}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-blue-600"
              style={{
                display:
                  currentUser && currentUser.avatarUrl && getAvatarUrl(currentUser.avatarUrl)
                    ? "none"
                    : "flex",
              }}
            >
              {currentUser ? getInitials(currentUser.name) : "?"}
            </div>
          </div>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewComment(e.target.value)
              }
              placeholder="Write a comment..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!newComment.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment: Comment) => {
            const initials = getInitials(comment.userId.name);
            const avatarUrl = getAvatarUrl(comment.userId.avatarUrl);
            
            return (
              <div key={comment._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={comment.userId.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-blue-600"
                    style={{
                      display: avatarUrl ? "none" : "flex",
                    }}
                  >
                    {initials}
                  </div>
                </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.userId.name}
                    </span>
                    {currentUser?._id === comment.userId._id && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                    {currentUser?._id === comment.userId._id && (
                      <button
                        onClick={() => deleteMutation.mutate(comment._id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        disabled={deleteMutation.isPending}
                        title="Delete comment"
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
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p 
                  className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                />
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};
