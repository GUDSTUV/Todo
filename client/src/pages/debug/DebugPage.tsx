import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import api from '../../api/client/client';

export const DebugPage = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    // Test API connection
    api.get('/auth/me')
      .then(() => {
        setApiStatus('ok');
      })
      .catch((err) => {
        setApiStatus('error');
        setApiError(err.message || 'Unknown error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Debug Information
        </h1>

        {/* Authentication Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Authentication Status
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Authenticated:</span>{' '}
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Has Token:</span>{' '}
              <span className={token ? 'text-green-600' : 'text-red-600'}>
                {token ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Has User:</span>{' '}
              <span className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? 'Yes' : 'No'}
              </span>
            </p>
          </div>

          {user && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">User Data:</h3>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {token && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Token (first 20 chars):</h3>
              <code className="text-xs text-gray-700 dark:text-gray-300">
                {token.substring(0, 20)}...
              </code>
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            API Connection
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Status:</span>{' '}
              <span
                className={
                  apiStatus === 'ok'
                    ? 'text-green-600'
                    : apiStatus === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }
              >
                {apiStatus === 'ok' ? 'Connected' : apiStatus === 'error' ? 'Error' : 'Checking...'}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">API URL:</span>{' '}
              <code className="text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
              </code>
            </p>
            {apiError && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Error:</span> {apiError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Storage
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">LocalStorage:</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>authToken: {localStorage.getItem('authToken') ? '✓' : '✗'}</li>
                <li>authUser: {localStorage.getItem('authUser') ? '✓' : '✗'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">SessionStorage:</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>authToken: {sessionStorage.getItem('authToken') ? '✓' : '✗'}</li>
                <li>authUser: {sessionStorage.getItem('authUser') ? '✓' : '✗'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Login
          </a>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Try Dashboard
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};
