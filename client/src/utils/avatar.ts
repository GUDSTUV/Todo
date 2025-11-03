const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_BASE_URL.replace('/api', '');

/**
 * Get the full avatar URL, handling both external URLs and server-uploaded images
 */
export const getAvatarUrl = (
  avatarUrl: string | undefined | null,
  cacheBust?: string | number
): string => {
  if (!avatarUrl || avatarUrl.trim() === '') return '';
  const base = avatarUrl.startsWith('http') ? avatarUrl : `${SERVER_URL}${avatarUrl}`;
  if (cacheBust === undefined || cacheBust === null) return base;
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}v=${encodeURIComponent(String(cacheBust))}`;
};

/**
 * Get user initials from name
 */
export const getInitials = (name: string | undefined | null): string => {
  if (!name || name.trim() === '') return '?';
  
  const initials = name
    .trim()
    .split(' ')
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return initials || '?';
};
 
