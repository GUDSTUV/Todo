export interface ProfileDropdownProps {
  className?: string;
}

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    timezone: string;
    language: string;
  };
}
