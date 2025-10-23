import React from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../api/auths/auth';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-600">Welcome to your Todu dashboard!</p>
          <p className="text-sm text-gray-500 mt-2">You are successfully logged in.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
