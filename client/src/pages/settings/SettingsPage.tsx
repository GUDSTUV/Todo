import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client/client';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/button/Button';
import { Select } from '../../components/ui/select/Select';
import { getAvatarUrl, getInitials } from '../../utils/avatar';

const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [avatarCacheKey, setAvatarCacheKey] = useState<number>(0);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences state
  const [timezone, setTimezone] = useState(user?.preferences?.timezone || 'UTC');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const getAxiosErrorMessage = (err: unknown, fallback: string): string => {
    const axErr = err as AxiosError<{ error?: string; message?: string }>;
    return (
      axErr?.response?.data?.error ||
      axErr?.response?.data?.message ||
      axErr?.message ||
      fallback
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // Only update name and email, not avatar
      const response = await api.patch('/auth/profile', { name, email });
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateAvatarUrl = async () => {
    if (!avatarUrl) {
      toast.error('Please enter an image URL');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await api.patch('/auth/profile', { avatarUrl });
      updateUser(response.data.user);
      setAvatarUrl('');
      setAvatarCacheKey(Date.now());
      toast.success('Profile picture URL updated successfully');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to update profile picture'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUpdatingProfile(true);
    try {
      const response = await api.patch('/auth/profile', { avatarUrl: '' });
      updateUser(response.data.user);
      setAvatarUrl('');
      setAvatarPreview(null);
  setAvatarCacheKey(0);
      toast.success('Profile picture removed');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to remove profile picture'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      setAvatarLoadFailed(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update user with the new avatar URL from server
      updateUser({
        ...user,
        avatarUrl: response.data.avatarUrl,
      });
      
      // Clear file selection and preview
      setAvatarUrl('');
      setAvatarFile(null);
      setAvatarPreview(null);
  setAvatarCacheKey(Date.now());
      
      // Clear file input
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast.success('Profile picture uploaded successfully');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to upload profile picture'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelUpload = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    
    // Clear file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to change password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPreferences(true);
    try {
      const response = await api.patch('/auth/profile', {
        preferences: { timezone, language },
      });
      updateUser(response.data.user);
      toast.success('Preferences updated successfully');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to update preferences'));
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (
      !window.confirm(
        'Are you absolutely sure? This action cannot be undone. All your tasks and lists will be permanently deleted.'
      )
    ) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.delete('/auth/account', {
        data: {
          password: deletePassword,
          confirmDelete: deleteConfirmText,
        },
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Failed to delete account'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profile Information
          </h2>
          
          {/* Avatar Section */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
                {(!avatarLoadFailed && (avatarPreview || user?.avatarUrl)) ? (
                  <img
                    src={avatarPreview || getAvatarUrl(user?.avatarUrl, avatarCacheKey)}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    onLoad={() => setAvatarLoadFailed(false)}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-2 border-gray-200 dark:border-gray-600">
                  {name ? getInitials(name) : 'U'}
                </div>
              )}
              <div className="flex-1 space-y-3">
                {/* File Upload */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <div className="flex gap-2">
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Choose File
                    </label>
                    {avatarFile && (
                      <>
                        <Button
                          size="sm"
                          onClick={handleUploadAvatar}
                          isLoading={isUploadingAvatar}
                        >
                          Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCancelUpload}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                  {avatarFile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Selected: {avatarFile.name}
                    </p>
                  )}
                </div>
                
                {/* URL Input */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Or enter image URL:</div>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      label=""
                    />
                    {avatarUrl && (
                      <Button
                        size="sm"
                        onClick={handleUpdateAvatarUrl}
                        disabled={isUpdatingProfile}
                      >
                        Update URL
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload an image file (max 5MB) or enter a URL to your profile picture.
                </p>
                {user?.avatarUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUpdatingProfile}
                  >
                    Remove Picture
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isUpdatingProfile}>
              Update Profile
            </Button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h2>
          {user?.id && !user?.email?.includes('@') ? (
            <p className="text-gray-600 dark:text-gray-400">
              Password management is not available for OAuth-only accounts.
            </p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isChangingPassword}>
                Change Password
              </Button>
            </form>
          )}
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Preferences
          </h2>
          <form onSubmit={handleUpdatePreferences} className="space-y-4">
            <Select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time (US)' },
                { value: 'America/Chicago', label: 'Central Time (US)' },
                { value: 'America/Denver', label: 'Mountain Time (US)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Europe/Paris', label: 'Paris' },
                { value: 'Asia/Tokyo', label: 'Tokyo' },
                { value: 'Asia/Shanghai', label: 'Shanghai' },
                { value: 'Australia/Sydney', label: 'Sydney' },
              ]}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'ja', label: 'Japanese' },
                { value: 'zh', label: 'Chinese' },
              ]}
            />
            <Button type="submit" isLoading={isUpdatingPreferences}>
              Update Preferences
            </Button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-900">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <Input
              label='Type "DELETE MY ACCOUNT" to confirm'
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              required
            />
            <Input
              label="Enter your password to confirm"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="danger"
              isLoading={isDeletingAccount}
              disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
            >
              Delete Account
            </Button>
          </form>
        </div>

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
