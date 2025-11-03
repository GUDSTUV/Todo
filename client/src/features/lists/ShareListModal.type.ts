import type { List } from "../../api/lists/lists";

export interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: List | null;
}
