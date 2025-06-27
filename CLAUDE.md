# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start development server with Vite
npm run build        # TypeScript compile + Vite build for production  
npm run build:mac    # Build + run macOS post-build script
npm run build:win    # Build + run Windows post-build script
npm run lint         # Run ESLint analysis
npm run preview      # Preview production build locally
```

## Architecture Overview

This is **Life Tracker**, a comprehensive React PWA for personal productivity tracking built with a **Feature-First Architecture**. Each feature module is self-contained within `src/features/` with its own components, hooks, types, and utilities.

### Core Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Backend**: Firebase Firestore
- **State Management**: Custom hooks + React hooks
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Vite PWA plugin with service worker

### Feature Modules Structure
```
src/features/[module]/
├── components/     # Module-specific UI components
├── hooks/         # Custom hooks for business logic
├── types/         # TypeScript interfaces and types
├── utils/         # Module-specific utilities
└── readme.md      # Module documentation
```

### Key Feature Modules
- **habit**: Daily/weekly habit tracking with time-of-day grouping
- **task**: Task management with Eisenhower matrix, recurrence, private tasks 
- **pomodoro**: Configurable timer with notifications and session history
- **meal**: Weekly meal planning (5 meal types) with ingredient export
- **mood**: Mood and energy tracking with 1-5 scale and comments
- **exercise**: 50+ exercise types with calorie calculations and stats
- **water**: Hydration tracking with 15+ drink types
- **journal**: Markdown journal entries with local file reading and weekly export
- **negative-habits**: Tracking habits to avoid with categorization
- **shopping-list**: Kanban-style shopping with Firestore persistence

## Critical Patterns

### Date Handling
- **Always use ISO format (YYYY-MM-DD)** for date consistency
- Centralized date utilities in `src/utils/dates.ts`
- Consider timezone implications for display formatting

### Firebase Integration
- Custom hooks handle Firestore synchronization automatically
- All data operations should go through feature-specific hooks
- Collection naming follows: `[module-name]` pattern

### Component Architecture
- One component per file with descriptive names
- Props are strictly typed with TypeScript interfaces
- UI components in `src/components/ui/` are shared across features
- Feature components stay within their respective `src/features/[module]/components/`

### AI Configuration
- AI models and prompts configured in `src/config/ai.ts`
- Requires `VITE_GEMINI_API_KEY` environment variable
- Each module can have customized AI parameters (temperature, top_p)

## Build and Deployment

### Environment Variables
```
VITE_GEMINI_API_KEY=your_api_key
```

### Build Configuration
- Base path set to `/life-tracker/` for GitHub Pages deployment
- Chunk splitting optimized for React, Firebase, UI libraries, and charts
- PWA manifest configured for standalone app experience
- Service worker handles offline functionality

### Responsive Design
- Mobile-first approach with Tailwind breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Adaptive navigation: desktop sidebar, mobile bottom navigation
- Touch-optimized interactions for mobile devices

## Code Quality

### TypeScript Usage
- Strict typing enforced across all new code
- Interfaces defined in each module's `types/` directory
- Avoid `any` type; use proper type definitions

### ESLint Configuration
- Flat config format with TypeScript, React hooks, and React refresh plugins
- Unused variables allowed with underscore prefix
- Service worker and Node.js files have specific global configurations

### Performance Considerations
- Lazy loading implemented for feature modules
- Manual chunk splitting prevents large bundle sizes
- Firestore queries optimized to minimize reads
- React hooks properly memoized to prevent unnecessary re-renders