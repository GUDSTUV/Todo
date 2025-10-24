# Dark Mode Setup Guide for Todu

This guide explains how dark mode is implemented across all pages in the Todu application.

## 🎨 How It Works

Dark mode in Todu uses Tailwind CSS's class-based dark mode system. When dark mode is enabled, the `dark` class is added to the root `<html>` element, which activates all `dark:` prefixed utility classes throughout the application.

## 📁 Key Files

### 1. Theme Store (`client/src/store/themeStore.ts`)
```typescript
// Manages theme state and persistence
- theme: 'light' | 'dark' | 'system'
- actualTheme: 'light' | 'dark' (resolved theme)
- setTheme(theme): Changes the theme
- initTheme(): Initializes theme on app mount
```

**Features:**
- Persists theme preference in localStorage
- Detects system theme preference
- Listens for system theme changes
- Applies/removes 'dark' class on `<html>` element

### 2. Theme Toggle Components (`client/src/components/ui/ThemeToggle.tsx`)

**ThemeToggle** - Simple button that cycles through themes
**ThemeToggleDropdown** - Dropdown selector with visual feedback

### 3. Tailwind Configuration (`client/tailwind.config.js`)
```javascript
export default {
  darkMode: 'class', // Enables class-based dark mode
  // ...
}
```

### 4. App Initialization (`client/src/App.tsx`)
```typescript
const initTheme = useThemeStore((state) => state.initTheme);

useEffect(() => {
  initTheme(); // Initializes theme on app mount
}, [initTheme]);
```

## 🌐 Pages with Dark Mode

All pages in the application now support dark mode:

### ✅ Home Page (`/home`)
- Gradient backgrounds adapted for dark mode
- Feature cards with dark backgrounds
- Navigation bar with dark mode
- Theme toggle in navigation

### ✅ Login Page (`/login`)
- Dark background and card
- Input fields with dark mode support
- Links with appropriate dark colors

### ✅ Signup Page (`/signup`)
- Dark background and card
- Form inputs styled for dark mode
- Links and buttons adapted

### ✅ Dashboard (`/dashboard`)
- AppShell header with theme toggle
- Dark backgrounds for main content
- Search and filter components with dark mode
- Task lists and cards styled for dark mode

## 🎨 Dark Mode Color Palette

### Backgrounds
```css
bg-white → dark:bg-gray-800
bg-gray-50 → dark:bg-gray-900
bg-gray-100 → dark:bg-gray-800
bg-gray-200 → dark:bg-gray-700

/* Gradients */
from-blue-50 → dark:from-gray-900
via-white → dark:via-gray-800
to-purple-50 → dark:to-gray-900
```

### Text Colors
```css
text-gray-900 → dark:text-white
text-gray-700 → dark:text-gray-300
text-gray-600 → dark:text-gray-400
text-gray-500 → dark:text-gray-500
```

### Borders
```css
border-gray-200 → dark:border-gray-700
border-gray-300 → dark:border-gray-600
```

### Interactive Elements
```css
hover:bg-gray-100 → dark:hover:bg-gray-700
hover:bg-gray-200 → dark:hover:bg-gray-600
```

### Component-Specific Colors
```css
/* Feature card backgrounds */
bg-blue-100 → dark:bg-blue-900/30
bg-purple-100 → dark:bg-purple-900/30
bg-green-100 → dark:bg-green-900/30
bg-orange-100 → dark:bg-orange-900/30

/* Icon colors */
text-blue-600 → dark:text-blue-400
text-purple-600 → dark:text-purple-400
text-green-600 → dark:text-green-400
```

## 🚀 Adding Dark Mode to New Components

When creating new components, follow these steps:

### 1. Add Dark Mode Classes to Backgrounds
```tsx
// Light mode only
<div className="bg-white">

// With dark mode
<div className="bg-white dark:bg-gray-800">
```

### 2. Add Dark Mode Classes to Text
```tsx
// Light mode only
<h1 className="text-gray-900">

// With dark mode
<h1 className="text-gray-900 dark:text-white">
```

### 3. Add Dark Mode Classes to Borders
```tsx
// Light mode only
<div className="border border-gray-200">

// With dark mode
<div className="border border-gray-200 dark:border-gray-700">
```

### 4. Add Dark Mode Classes to Interactive Elements
```tsx
// Light mode only
<button className="hover:bg-gray-100">

// With dark mode
<button className="hover:bg-gray-100 dark:hover:bg-gray-700">
```

## 📱 Example: Complete Component with Dark Mode

```tsx
const MyComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Title
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Description text
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Action Button
          </button>
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🔧 Testing Dark Mode

### Manual Testing
1. Open your app in a browser
2. Look for the theme toggle (sun/moon icon or dropdown)
3. Click to switch between Light, Dark, and System modes
4. Navigate through all pages to verify styling
5. Check that preference persists on page reload

### Browser DevTools
```javascript
// Open DevTools Console

// Check current theme
document.documentElement.classList.contains('dark')

// Toggle dark mode manually
document.documentElement.classList.toggle('dark')

// Check localStorage
localStorage.getItem('theme-storage')
```

### System Theme Testing
1. Set theme to "System" mode
2. Change your OS dark mode setting
3. Verify app updates automatically

## 🎯 Best Practices

### 1. Consistent Color Usage
- Use the same dark mode colors across similar elements
- Maintain proper contrast ratios (WCAG AA minimum)
- Test with color contrast checkers

### 2. Avoid Hardcoded Colors
```tsx
// ❌ Bad - hardcoded colors
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>

// ✅ Good - Tailwind classes with dark mode
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
```

### 3. Images and Icons
- Use SVGs that adapt to dark mode colors
- Consider different images for light/dark modes if necessary
- Test icon visibility in both themes

### 4. Gradients
- Adapt gradients for dark mode backgrounds
- Use semi-transparent colors for consistency

```tsx
// Light mode gradient
<div className="bg-gradient-to-r from-blue-500 to-purple-500">

// With dark mode consideration
<div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
```

## 🐛 Troubleshooting

### Dark Mode Not Working
1. Check if `tailwind.config.js` has `darkMode: 'class'`
2. Verify theme store is initialized in `App.tsx`
3. Check browser console for errors
4. Clear localStorage and try again

### Colors Not Changing
1. Ensure you're using `dark:` prefix classes
2. Check that classes are not being overridden
3. Inspect element to see which classes are applied

### Theme Not Persisting
1. Check localStorage permissions
2. Verify zustand persist middleware is configured
3. Check browser console for storage errors

### System Theme Not Detected
1. Verify browser supports `prefers-color-scheme`
2. Check that system theme is actually set to dark
3. Test with theme set to "System" mode explicitly

## 📊 Coverage Summary

| Component/Page | Dark Mode Support | Theme Toggle |
|---------------|-------------------|--------------|
| Home Page | ✅ | ✅ |
| Login Page | ✅ | ❌ |
| Signup Page | ✅ | ❌ |
| Dashboard | ✅ | ✅ |
| AppShell | ✅ | ✅ |
| SearchBar | ✅ | N/A |
| FilterBar | ✅ | N/A |
| TaskCard | ✅ | N/A |
| ListSidebar | ✅ | N/A |

**Note:** Login and Signup pages don't have theme toggle buttons to maintain clean, focused UI. Theme changes made elsewhere persist across these pages.

## 🎨 Future Enhancements

- [ ] Custom theme colors (blue, purple, green themes)
- [ ] Smooth transition animations between themes
- [ ] Per-component theme overrides
- [ ] High contrast mode
- [ ] Theme preview before applying
- [ ] Scheduled theme switching (dark at night)

---

Made with ❤️ for Todu
