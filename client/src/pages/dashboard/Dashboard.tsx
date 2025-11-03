import { AppShell } from '../../components/appShell/AppShell';
import { ListSidebar } from '../../features/lists/ListSidebar';
import { ListModal } from '../../features/lists/ListModal';
import { TaskList } from '../../features/tasks/taskList/TaskList';
import { TaskModal } from '../../features/tasks/TaskModal';
import { QuickAdd } from '../../features/tasks/QuickAdd';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterBar, type FilterOptions } from '../../components/ui/FilterBar';
import { ActivityFeed } from '../../components/ActivityFeed/ActivityFeed';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

const Dashboard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(true);

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <ListSidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks..."
              className="flex-1"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                showFilters
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <FilterBar
              filters={filters}
              onChange={setFilters}
              availableTags={['work', 'personal', 'urgent', 'meeting']}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Use tablet (md) as the breakpoint for two-column layout so tablets show activity feed side-by-side */}
          <div className="flex flex-col md:flex-row gap-4 p-4 h-full">
            {/* Main Task List */}
            <div className="flex-1 min-w-0">
              <TaskList searchQuery={debouncedSearch} filters={filters} />
            </div>

            {/* Activity Feed Sidebar (hidden on mobile) */}
            <div className="hidden md:block md:w-80 lg:w-96 flex-shrink-0">
              <div className="sticky top-4">
                <ActivityFeed />
              </div>
            </div>
          </div>
        </div>
        <QuickAdd />
      </main>
      <TaskModal />
      <ListModal />
    </AppShell>
  );
};

export default Dashboard;
