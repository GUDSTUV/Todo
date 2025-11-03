import { useState } from 'react';
import { useLists, useDeleteList } from '../../hooks/useList/useLists';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button/Button';
import { Spinner } from '../../components/ui/spinner/Spinner';
import ShareListModal from './ShareListModal';
import { CollaboratorModal } from './CollaboratorModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCollaborator } from '../../api/lists/lists';
import { getInitials, getAvatarUrl } from '../../utils/avatar';
import type { List } from '../../api/lists/lists';


export const ListSidebar = () => {
  const { data, isLoading } = useLists();
  const { mutate: deleteList } = useDeleteList();
  const selectedListId = useUIStore((state) => state.selectedListId);
  const setSelectedListId = useUIStore((state) => state.setSelectedListId);
  const openListModal = useUIStore((state) => state.openListModal);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);

  const lists = data?.data || [];

  const removeMutation = useMutation({
    mutationFn: ({ listId, collaboratorId }: { listId: string; collaboratorId: string }) =>
      removeCollaborator(listId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  const handleShareClick = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedList(list);
    setShareModalOpen(true);
  };

  const handleCollaboratorsClick = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedList(list);
    setCollaboratorModalOpen(true);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    if (selectedList) {
      removeMutation.mutate({ listId: selectedList._id, collaboratorId });
    }
  };

  const handleDeleteClick = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (list.isDefault) {
      alert('Cannot delete the default list');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${list.name}"? Tasks will be moved to Inbox.`)) {
      deleteList({ id: list._id });
    }
  };

  const isOwner = (list: List) => {
    const ownerId = typeof list.userId === "string" ? list.userId : list.userId._id;
    return ownerId === currentUser?._id || ownerId === currentUser?.id;
  };

  const getOwnerName = (list: List) => {
    if (typeof list.userId === "string") return "Unknown";
    return list.userId.name;
  };

  const handleListSelect = (listId: string | null) => {
    setSelectedListId(listId);
    // Auto-close sidebar on mobile after selection
    // Only auto-close on small screens (mobile) to avoid closing on tablet where we show two-column layout
    if (window.innerWidth < 768) {
      useUIStore.getState().setSidebarOpen(false);
    }
  };

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className="fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transform transition-transform duration-300 lg:transform-none"
        style={{
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lists</h2>
        </div>

        <nav className="flex-1 overflow-y-auto p-2" aria-label="Task lists">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <ul className="space-y-1">
              {/* All Tasks */}
              <li>
                <button
                  onClick={() => setSelectedListId(null)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg transition-colors
                    ${
                      selectedListId === null
                        ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-100'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  {...(selectedListId === null && { 'aria-current': 'page' })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <span>All Tasks</span>
                    </div>
                  </div>
                </button>
              </li>

            {lists.map((list: List) => {
              const owner = isOwner(list);
              const collaborators = list.sharedWith || [];
              
              return (
                <li key={list._id}>
                  <div className="relative group">
                    <div
                      onClick={() => handleListSelect(list._id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer
                        ${
                          selectedListId === list._id
                            ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-100'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }
                      `}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleListSelect(list._id);
                        }
                      }}
                      {...(selectedListId === list._id && { 'aria-current': 'page' })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{list.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {list.taskCount > 0 && (
                            <span className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                              {list.taskCount}
                            </span>
                          )}
                          
                          {/* Collaborator Avatars */}
                          {collaborators.length > 0 && (
                            <div
                              onClick={(e) => handleCollaboratorsClick(list, e)}
                              className="flex -space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                              title="View collaborators"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedList(list);
                                  setCollaboratorModalOpen(true);
                                }
                              }}
                            >
                              {collaborators.slice(0, 3).map((collab) => {
                                const initials = getInitials(collab.userId.name);
                                const avatarUrl = getAvatarUrl(collab.userId.avatarUrl);
                                return (
                                  <div
                                    key={collab.userId._id}
                                    className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-800 overflow-hidden flex-shrink-0"
                                    title={`${collab.userId.name} (${collab.role})`}
                                  >
                                    {avatarUrl ? (
                                      <img
                                        src={avatarUrl}
                                        alt={collab.userId.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fallback = e.currentTarget.nextElementSibling;
                                          if (fallback) (fallback as HTMLElement).style.display = "flex";
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className="w-full h-full flex items-center justify-center text-white text-xs font-semibold bg-blue-600"
                                      style={{
                                        display: avatarUrl ? "none" : "flex",
                                      }}
                                    >
                                      {initials}
                                    </div>
                                  </div>
                                );
                              })}
                              {collaborators.length > 3 && (
                                <div
                                  className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-gray-800"
                                  title={`+${collaborators.length - 3} more`}
                                >
                                  +{collaborators.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Share button - always visible for owners */}
                          {owner && (
                            <>
                              <button
                                onClick={(e) => handleShareClick(list, e)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Share list"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-600 dark:text-gray-400"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                              </button>
                              
                              {/* Delete button */}
                              {!list.isDefault && (
                                <button
                                  onClick={(e) => handleDeleteClick(list, e)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Delete list"
                                >
                                  <svg
                                    className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
                            </>
                          )}
                        </div>
                      </div>
                      {!owner && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          Shared by {getOwnerName(list)}
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button fullWidth variant="secondary" onClick={() => openListModal()}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          New List
        </Button>
      </div>
    </aside>

      <ShareListModal
