# Kinlii

A mobile-first student activity prototype for helping verified students find, join, or create small real-world gatherings. **Less Screen. More Seen.**

## Run locally

```bash
npm install
npm run dev
```

## Assistant architecture

`src/services/communityAssistant.js` defines the provider-neutral boundary. The UI passes conversation history, user context, available gatherings, and filters to a service and receives structured text/actions in return.

V1 uses `MockCommunityAssistantService`, which performs local keyword and filter matching. A future `OpenAICommunityAssistantService` can implement the same contract and translate tool calls into allow-listed actions such as `search_gatherings` and `create_gathering_draft`. The application—not the model—executes those actions, and the model should never receive direct database access.

## Prototype service boundaries

Replaceable local services live in `src/services/` for student verification, storage, calendar sync, duplicate detection, carpool requests, notifications/geolocation, and the structured community assistant. University verification, Google Calendar, push notifications, geolocation, rides, and persistence are intentionally simulated; none claim a live third-party connection.

The production frontend is configured as a static Site from `dist/`.
