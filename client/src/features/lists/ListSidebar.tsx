import { useLists } from '../../hooks/useList/useLists';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/ui/button/Button';
import { Spinner } from '../../components/ui/spinner/Spinner';
import type { List } from '../../api/lists/lists';


export const ListSidebar = () => {
  const { data, isLoading } = useLists();
  const selectedListId = useUIStore((state) => state.selectedListId);
  const setSelectedListId = useUIStore((state) => state.setSelectedListId);
  const openListModal = useUIStore((state) => state.openListModal);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  const lists = data?.data || [];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Lists</h2>
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
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                aria-current={selectedListId === null ? 'page' : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <span>All Tasks</span>
                  </div>
                </div>
              </button>
            </li>

            {lists.map((list: List) => (
              <li key={list._id}>
                <button
                  onClick={() => setSelectedListId(list._id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg transition-colors
                    ${
                      selectedListId === list._id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  aria-current={selectedListId === list._id ? 'page' : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: list.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{list.name}</span>
                    </div>
                    {list.taskCount > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {list.taskCount}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
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
  );
};
