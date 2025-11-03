import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotifications,
} from '../../hooks/useNotifications/useNotifications';
import type { Notification, NotificationCenterProps } from './NotificationCenter.type';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useNotifications({ limit: 20 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationsMutation = useDeleteNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate([notification._id]);
    }

    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationsMutation.mutate([notificationId]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return '🔔';
      case 'task_due':
        return '📅';
      case 'task_overdue':
        return '⚠️';
      case 'shared_list':
        return '👥';
      case 'comment':
        return '💬';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-2 top-16 sm:top-auto sm:inset-x-auto sm:mt-2 sm:right-0 sm:left-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-auto sm:w-96 max-h-[80vh] sm:max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap ml-2 flex-shrink-0"
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No notifications</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-3 sm:px-4 py-3 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-600 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {/* Icon */}
                      <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words line-clamp-3 sm:line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <button
                            onClick={(e) => handleDelete(notification._id, e)}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto px-2 py-1 sm:px-0 sm:py-0 -ml-2 sm:ml-0 rounded sm:rounded-none hover:bg-red-50 dark:hover:bg-red-900/20 sm:hover:bg-transparent transition-colors"
                            aria-label="Delete notification"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 dark:border-gray-700 text-center flex-shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page if you build one
                }}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
