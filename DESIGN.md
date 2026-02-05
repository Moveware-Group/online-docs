# Moveware Design System

## Brand Identity

### Colors

**Primary Palette:**
- Primary Blue: `#2563eb` (Tailwind: `bg-blue-600`)
- Primary Hover: `#1d4ed8` (Tailwind: `bg-blue-700`)
- Primary Light: `#60a5fa` (Tailwind: `bg-blue-400`)
- Primary Dark: `#1e40af` (Tailwind: `bg-blue-800`)

**Neutral Palette:**
- Background: `#f9fafb` (Tailwind: `bg-gray-50`)
- Surface: `#ffffff` (Tailwind: `bg-white`)
- Border: `#e5e7eb` (Tailwind: `border-gray-200`)
- Text Primary: `#111827` (Tailwind: `text-gray-900`)
- Text Secondary: `#6b7280` (Tailwind: `text-gray-600`)
- Text Muted: `#9ca3af` (Tailwind: `text-gray-400`)

**Semantic Colors:**
- Success: `#10b981` (Tailwind: `bg-green-500`)
- Warning: `#f59e0b` (Tailwind: `bg-amber-500`)
- Error: `#ef4444` (Tailwind: `bg-red-500`)
- Info: `#3b82f6` (Tailwind: `bg-blue-500`)

### Typography

**Font Family:**
- Primary: `Inter` (Google Fonts)
- Monospace: `'Fira Code', monospace`

**Font Scales:**
```tsx
// Headings
text-5xl font-bold  // Hero heading (48px)
text-4xl font-bold  // Page heading (36px)
text-3xl font-bold  // Section heading (30px)
text-2xl font-bold  // Subsection heading (24px)
text-xl font-semibold  // Card heading (20px)

// Body
text-lg font-normal    // Large body (18px)
text-base font-normal  // Body text (16px)
text-sm font-normal    // Small text (14px)
text-xs font-normal    // Caption (12px)
```

**Font Weights:**
- Regular: `font-normal` (400)
- Medium: `font-medium` (500)
- Semibold: `font-semibold` (600)
- Bold: `font-bold` (700)

## Layout

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

**Breakpoints:**
- Mobile: `< 640px`
- Tablet: `>= 640px` (sm:)
- Desktop: `>= 1024px` (lg:)
- Wide: `>= 1280px` (xl:)

### Spacing Scale

```tsx
// Padding/Margin
p-2   // 8px
p-4   // 16px
p-6   // 24px
p-8   // 32px
p-12  // 48px
p-16  // 64px
p-20  // 80px
p-24  // 96px

// Component-specific
py-12 sm:py-16 lg:py-20  // Section vertical padding
space-y-6                 // Stack spacing
gap-6                     // Grid gap
```

### Page Structure

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Navigation */}
    </div>
  </header>

  {/* Main Content */}
  <main>
    {/* Page content */}
  </main>

  {/* Footer */}
  <footer className="bg-white border-t border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Footer content */}
    </div>
  </footer>
</div>
```

## Components

### Button

**Primary Button:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
  Button Text
</button>
```

**Secondary Button:**
```tsx
<button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
  Button Text
</button>
```

**Ghost Button:**
```tsx
<button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200">
  Button Text
</button>
```

### Card

**Standard Card:**
```tsx
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
  {/* Card content */}
</div>
```

**Interactive Card (clickable):**
```tsx
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
  {/* Card content */}
</div>
```

### Form Input

**Text Input:**
```tsx
<div className="space-y-2">
  <label htmlFor="field" className="block text-sm font-medium text-gray-700">
    Field Label
  </label>
  <input
    type="text"
    id="field"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    placeholder="Placeholder text"
  />
</div>
```

### Badge

```tsx
// Status badges
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
  Active
</span>

<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
  Info
</span>
```

## Common Patterns

### Hero Section

```tsx
<section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
    <div className="max-w-3xl">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
        Welcome to Moveware
      </h1>
      <p className="text-xl sm:text-2xl text-blue-100 mb-8">
        Transform your workflow with our modern platform
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200">
          Get Started
        </button>
        <button className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg border-2 border-blue-400 transition-all duration-200">
          Learn More
        </button>
      </div>
    </div>
  </div>
</section>
```

### Content Section

```tsx
<section className="py-16 sm:py-20 lg:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
        Section Title
      </h2>
      <p className="text-lg text-gray-600 leading-relaxed">
        Content goes here
      </p>
    </div>
  </div>
</section>
```

### Feature Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-200">
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">Feature Title</h3>
    <p className="text-gray-600">Feature description</p>
  </div>
</div>
```

## Icons

**Library:** [Lucide React](https://lucide.dev)

```tsx
import { Home, User, Settings, ChevronRight } from 'lucide-react'

<Home className="w-5 h-5" />
```

## Animations

**Transitions:**
```tsx
transition-all duration-200      // Fast interaction
transition-all duration-300      // Standard
transition-shadow duration-200   // Shadow only
```

**Hover Effects:**
```tsx
hover:scale-105          // Slight grow
hover:scale-[1.02]       // Subtle grow
hover:-translate-y-1     // Lift up
hover:shadow-lg          // Shadow increase
```

## Accessibility

**Always Include:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`)
- ARIA labels where needed
- Keyboard navigation support
- Focus states (`focus:ring-2 focus:ring-blue-500`)
- Sufficient color contrast
- Alt text for images
