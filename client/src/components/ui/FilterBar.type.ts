export interface FilterOptions {
  status?: string;
  priority?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableTags?: string[];
  className?: string;
}
