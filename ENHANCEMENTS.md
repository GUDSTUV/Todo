# Todu - Optional Enhancements Implementation Guide

This document outlines the optional enhancements that have been implemented in the Todu application.

## ✅ Implemented Features

### 1. 🔍 Debounced Search Bar

**Location:** `client/src/components/ui/SearchBar.tsx`

**Features:**
- Real-time search with debouncing (300ms delay)
- Search icon with visual feedback
- Clear button to reset search
- Dark mode support
- Accessible design

**Hook:** `client/src/hooks/useDebounce.ts`
- Generic debounce hook with configurable delay
- Prevents excessive API calls during typing

**Usage:**
```tsx
import { SearchBar } from '@/components/ui/SearchBar';
import { useDebounce } from '@/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search tasks..."
/>
```

---

### 2. 🎛️ Advanced Filters UI

**Location:** `client/src/components/ui/FilterBar.tsx`

**Features:**
- **Status Filter**: All, To Do, In Progress, Done
- **Priority Filter**: All, Low, Medium, High, Urgent
- **Tags Filter**: Multi-select with visual chips
- **Sort Options**: Date Created, Due Date, Priority, Title
- **Sort Order**: Ascending/Descending toggle
- **Active Filters Summary**: Shows applied filters with quick remove
- **Clear All**: Reset all filters at once
- Dark mode support

**Interface:**
```typescript
interface FilterOptions {
  status?: string;
  priority?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

**Usage:**
```tsx
import { FilterBar, type FilterOptions } from '@/components/ui/FilterBar';

const [filters, setFilters] = useState<FilterOptions>({
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

<FilterBar
  filters={filters}
  onChange={setFilters}
  availableTags={['work', 'personal', 'urgent']}
/>
```

---

### 3. 🎯 Drag & Drop for Task Reordering

**Location:** `client/src/components/ui/DraggableTask.tsx`

**Features:**
- Drag handle appears on hover
- Visual feedback during dragging
- Smooth animations
- Touch support
- Accessible design

**Dependencies Required:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Usage:**
```tsx
import { DraggableTask } from '@/components/ui/DraggableTask';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
    {tasks.map((task) => (
      <DraggableTask key={task._id} id={task._id}>
        <TaskCard task={task} />
      </DraggableTask>
    ))}
  </SortableContext>
</DndContext>
```

---

### 4. 🌓 Dark Mode Theme Toggle

**Location:** 
- Store: `client/src/store/themeStore.ts`
- Components: `client/src/components/ui/ThemeToggle.tsx`
- Config: `client/tailwind.config.js`

**Features:**
- Three modes: Light, Dark, System
- Automatic system preference detection
- Persistent preference (localStorage)
- Smooth transitions
- Two toggle variants:
  - Simple toggle (cycles through modes)
  - Dropdown selector (choose specific mode)

**Configuration:**
```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Enable class-based dark mode
  // ...
}
```

**Theme Store:**
```typescript
interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}
```

**Usage:**
```tsx
import { ThemeToggle, ThemeToggleDropdown } from '@/components/ui/ThemeToggle';
import { useThemeStore } from '@/store/themeStore';

// Initialize theme on app mount
const initTheme = useThemeStore((state) => state.initTheme);
useEffect(() => {
  initTheme();
}, [initTheme]);

// Use toggle component
<ThemeToggle />
// or dropdown variant
<ThemeToggleDropdown />
```

**Dark Mode Classes:**
All components now support dark mode using Tailwind's `dark:` prefix:
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

---

## 📋 Integration Example (Dashboard)

The Dashboard component integrates all enhancements:

```tsx
const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  return (
    <AppShell>
      <ListSidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 border-b p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks..."
              className="flex-1"
            />
            <button onClick={() => setShowFilters(!showFilters)}>
              Filters
            </button>
          </div>
          
          {showFilters && (
            <FilterBar
              filters={filters}
              onChange={setFilters}
              availableTags={['work', 'personal', 'urgent']}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <TaskList searchQuery={debouncedSearch} filters={filters} />
        </div>
        <QuickAdd />
      </main>
      <TaskModal />
      <ListModal />
    </AppShell>
  );
};
```

---

## 🧪 5. Testing (To Be Implemented)

### Unit Tests with Jest

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Example Test:**
```typescript
// SearchBar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });
    
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('shows clear button when value exists', () => {
    render(<SearchBar value="test" onChange={() => {}} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });
});
```

### E2E Tests with Playwright

**Setup:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Example Test:**
```typescript
// dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('search tasks', async ({ page }) => {
    await page.fill('input[placeholder="Search tasks..."]', 'meeting');
    await page.waitForTimeout(500); // Wait for debounce
    
    const tasks = await page.locator('[data-testid="task-card"]').count();
    expect(tasks).toBeGreaterThan(0);
  });

  test('filter by priority', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.selectOption('select[name="priority"]', 'high');
    
    await expect(page.locator('[data-priority="high"]')).toBeVisible();
  });

  test('toggle dark mode', async ({ page }) => {
    await page.click('[aria-label="Theme options"]');
    await page.click('button:has-text("Dark")');
    
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^7.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "zustand": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0"
  }
}
```

---

## 🎨 Dark Mode Design Tokens

All components use consistent dark mode colors:

```css
/* Backgrounds */
bg-white → dark:bg-gray-800
bg-gray-50 → dark:bg-gray-900
bg-gray-100 → dark:bg-gray-800
bg-gray-200 → dark:bg-gray-700

/* Text */
text-gray-900 → dark:text-white
text-gray-700 → dark:text-gray-300
text-gray-600 → dark:text-gray-400
text-gray-500 → dark:text-gray-500

/* Borders */
border-gray-200 → dark:border-gray-700
border-gray-300 → dark:border-gray-600

/* Interactive States */
hover:bg-gray-100 → dark:hover:bg-gray-700
hover:bg-gray-200 → dark:hover:bg-gray-600
```

---

## 🚀 Performance Optimizations

1. **Debouncing**: Search input debounced to 300ms to reduce API calls
2. **Memoization**: Filter components use React.memo to prevent unnecessary re-renders
3. **Lazy Loading**: Theme initialization happens only once on mount
4. **LocalStorage**: Theme preference cached to avoid flicker on page load

---

## ♿ Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant in both light and dark modes
- **Semantic HTML**: Proper use of semantic elements

---

## 📱 Responsive Design

All enhancements are fully responsive:
- Mobile: Stacked layout, touch-friendly targets
- Tablet: Optimized grid layouts
- Desktop: Full feature set with hover states

---

## 🔧 Customization

### Adjusting Debounce Delay

```typescript
// Faster response (150ms)
const debouncedSearch = useDebounce(searchQuery, 150);

// Slower response for expensive operations (500ms)
const debouncedSearch = useDebounce(searchQuery, 500);
```

### Adding Custom Themes

```typescript
// themeStore.ts
type Theme = 'light' | 'dark' | 'system' | 'blue' | 'purple';

// Apply custom theme
const applyTheme = (theme: string) => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
};
```

### Custom Filter Options

```typescript
const customStatusOptions = [
  { value: '', label: 'All' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];
```

---

## 📝 Next Steps

1. **Install drag-and-drop dependencies**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. **Implement full drag-and-drop in TaskList component**
3. **Set up testing infrastructure**
4. **Write unit tests for all new components**
5. **Create E2E test suite for critical flows**
6. **Add performance monitoring**
7. **Implement analytics for feature usage**

---

## 🐛 Troubleshooting

### Dark Mode Not Working
- Ensure `tailwind.config.js` has `darkMode: 'class'`
- Check that theme store is initialized in App.tsx
- Verify HTML element has `class="dark"` when dark mode is active

### Search Not Debouncing
- Confirm `useDebounce` hook is imported correctly
- Check that debounced value is being used, not the raw state
- Verify delay parameter is set appropriately

### Filters Not Applying
- Ensure filter state is being passed to TaskList component
- Check API endpoint supports filter parameters
- Verify query parameters are properly formatted

---

Made with ❤️ for Todu
