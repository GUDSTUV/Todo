export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userAvatar?: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}
