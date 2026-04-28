## Goal
Make the installed PWA feel like a real mobile app — not just a website in a standalone window. Installing only hides browser chrome; the UI itself still needs to be redesigned for mobile-app patterns.

## What changes (UI/UX)

### 1. Bottom tab bar navigation (mobile only)
Replace the top `Navbar` on mobile with a fixed **bottom tab bar** — the universal mobile-app pattern (like Instagram, WhatsApp).

Tabs:
- **Home** (`/dashboard`)
- **Resume** (`/resume`)
- **Interview** (`/interview`)
- **Results** (latest result or list)
- **Profile** (sign out, install, settings)

Desktop keeps the existing top navbar.

### 2. Mobile app shell layout
- Fixed top header (compact, page title + back button on inner pages)
- Scrollable content area between header and bottom tabs
- Safe-area insets (`env(safe-area-inset-bottom)`) so it works on notched phones
- No horizontal scroll, full-width cards, larger tap targets (min 44px)

### 3. Native-feeling interactions
- **Page transitions**: slide-in animations between routes (mobile only)
- **Pull-to-refresh** on Dashboard and Results
- **Haptic feedback** (`navigator.vibrate`) on key actions: start interview, submit answer, finish
- **Swipe-back gesture** support via browser history
- Active state press animations on buttons (scale down 0.97)

### 4. Mobile-optimized screens
- **Interview page**: full-screen recording mode with big mic button, waveform, timer at top — like a voice-recorder app instead of a web form
- **Resume page**: full-screen drop area, big "Upload" CTA at bottom
- **Results**: card-stack feel with score ring at top, swipeable sections
- **Dashboard**: stat cards in 2-col grid, recent sessions as tappable list rows

### 5. Splash screen + status bar
- Add proper PWA splash screens (iOS + Android sizes) referenced in `index.html`
- `theme-color` meta matching app background so the status bar blends in
- Standalone-mode detection — hide any "open in browser" affordances when installed

### 6. Lock to portrait + disable text selection on UI chrome
- `orientation: portrait` in manifest
- `user-select: none` on nav/buttons (keep on inputs and content)
- Disable double-tap zoom on interactive elements

## Files to change

- `src/components/MobileTabBar.tsx` — **new**, bottom tab navigation
- `src/components/MobileHeader.tsx` — **new**, compact top bar with back button
- `src/components/AppShell.tsx` — **new**, wraps pages with header + tabs on mobile, normal layout on desktop
- `src/components/Navbar.tsx` — hide on mobile, keep on `md+`
- `src/App.tsx` — wrap routes in `AppShell`, add route transitions
- `src/pages/Interview.tsx` — full-screen mobile recording UI
- `src/pages/Resume.tsx` — mobile-first upload screen
- `src/pages/Dashboard.tsx` — mobile card grid + list rows
- `src/pages/Results.tsx` — mobile score-ring layout
- `src/index.css` — safe-area utilities, no-select, tap highlight removal, transition classes
- `src/lib/haptics.ts` — **new**, tiny vibration helper
- `src/lib/pwa.ts` — add `isStandalone()` helper
- `public/manifest.webmanifest` (or wherever it lives) — `orientation: portrait`, `display: standalone`
- `index.html` — splash link tags, `theme-color`, `apple-mobile-web-app-status-bar-style`

## What I will NOT change
- Backend, scoring logic, AI models, DB schema
- Desktop layout (stays the same on `md` and up)
- Auth flow

## Honest expectations
After this, on a phone (installed or in browser) it will feel like a real mobile app: bottom tabs, transitions, haptics, full-screen recording. On desktop, it stays the polished web app it is today. This is a UI/UX overhaul — no backend risk.