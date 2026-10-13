# Kinlii

Kinlii is a mobile-first student activity prototype that helps verified students find, join, and host small real-world gatherings. Its product promise is **Less Screen. More Seen.**

## Start the app

You need a current Node.js LTS release.

```bash
npm install
npm run dev
```

Vite opens the app at `/app.html`. Changes under `src/` appear automatically while the development server is running.

Before committing a change, run:

```bash
npm run format
npm run build
```

`npm run format:check` checks formatting without modifying files.

## Source map

```text
src/
├── app/
│   └── types.ts                 Shared navigation and personality types
├── components/
│   └── ui/                      Small reusable visual components
├── data/
│   └── kinliiData.ts            Interests, quiz questions, and sample events
├── hooks/
│   └── usePersistentState.js    React state backed by localStorage
├── screens/
│   ├── events/                  Event details
│   └── onboarding/              Welcome, verification, interests, and quiz
├── services/
│   ├── communityAssistant.js    Local assistant service boundary
│   ├── duplicateEventService.js Similar-event detection
│   └── storageService.js        Safe localStorage access
├── App.tsx                      App state, navigation, and main signed-in views
├── main.jsx                     Browser entry point
└── styles.css                   Existing visual design and responsive rules
```

## How the prototype works

- `main.jsx` mounts one `App` component.
- `App.tsx` owns cross-screen state and decides which screen is visible.
- Onboarding and event details are isolated screens with explicit, typed props.
- Sample content lives in `data/kinliiData.ts`; edit it there instead of embedding new data in a screen.
- User choices are saved by `usePersistentState`, which delegates browser storage details to `storageService`.
- The community assistant and duplicate-event check are deliberately separate services so a production API can replace the local implementations later.

The current app is a frontend prototype. Verification, calendar sync, notifications, geolocation, rides, assistant responses, and persistence are simulated locally; the interface does not claim a live third-party connection.

## Making changes safely

- Add reusable icons to `components/ui/Icon.tsx` rather than copying SVG markup into screens.
- Add static events, interests, or quiz questions to `data/kinliiData.ts`.
- Keep screen-specific markup in its matching folder under `screens/`.
- Keep integration logic out of visual components and behind a service in `services/`.
- Preserve the existing CSS class names when refactoring markup; the Figma-matched appearance depends on them.
- Run the formatter and production build after every structural change.

## Build and deployment

`npm run build` produces the deployable static app in `dist/`. The compatibility script converts Vite's `app.html` entry into `dist/index.html` for static hosting.

GitHub Pages uses the repository path `/Team-being-human/`. The build configuration selects that path in GitHub Actions and `/` for other hosts such as the private preview site.
