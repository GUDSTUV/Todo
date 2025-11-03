import type { AppShellProps } from './AppShell.type';
import { useUIStore } from '../../store/uiStore';
import { ThemeToggleDropdown } from '../ui/ThemeToggle';
import NotificationCenter from '../ui/NotificationCenter';
import { ProfileDropdown } from '../ui/ProfileDropdown';



export const AppShell = ({ children }: AppShellProps) => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Todu</h1>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
          <ThemeToggleDropdown className="hidden md:block" />
          
          {/* Profile Dropdown - Now visible on all screen sizes */}
          <ProfileDropdown />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
};
