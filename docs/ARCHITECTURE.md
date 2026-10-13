# Architecture guide

This guide explains where to start when you are new to the Kinlii codebase.

## Read the app in this order

1. `src/main.jsx` — the browser starts here.
2. `src/App.tsx` — the top-level state and navigation live here.
3. `src/data/kinliiData.ts` — this is the sample content rendered by the app.
4. `src/screens/onboarding/OnboardingScreens.tsx` — the complete first-run flow.
5. `src/screens/events/EventDetailsScreen.tsx` — the event page and its actions.
6. `src/styles.css` — the visual design shared by those screens.

## State ownership

`App.tsx` owns values needed by more than one screen: onboarding progress, the active tab, joined and saved events, accessibility settings, and modal visibility. It passes only the values and update functions a child screen needs.

Persistent values use `usePersistentState`. This hook behaves like React's `useState`, then mirrors each value to `localStorage`. Temporary interface state—such as whether a sheet is open—uses ordinary `useState`.

## Data flow

```text
kinliiData.ts
     ↓
  App.tsx  ←→ local hooks and services
     ↓
screen components
     ↓
reusable UI components
```

Screens never load or mutate external data directly. A future backend should be introduced through focused service functions, keeping the screen components concerned with display and interaction.

## Styling

The existing selectors and class names in `styles.css` correspond to the approved prototype. Structural refactors should retain those class names and DOM relationships unless a visual change is intentional. Prettier keeps CSS and source files consistently readable.

## Current production boundaries

This repository is intentionally frontend-only. The assistant, verification flow, event records, calendar connection, notification settings, and carpool requests are local simulations. They provide stable UI contracts that can later be backed by authenticated APIs and a database.
