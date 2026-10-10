# Common Ground

A frontend prototype for an AI-assisted community discovery product. The assistant helps people find, join, or create small real-world gatherings using deterministic local intent matching and seeded data.

## Run locally

```bash
npm install
npm run dev
```

## Assistant architecture

`src/services/communityAssistant.js` defines the provider-neutral boundary. The UI passes conversation history, user context, available gatherings, and filters to a service and receives structured text/actions in return.

V1 uses `MockCommunityAssistantService`, which performs local keyword and filter matching. A future `OpenAICommunityAssistantService` can implement the same contract and translate tool calls into allow-listed actions such as `search_gatherings` and `create_gathering_draft`. The application—not the model—executes those actions, and the model should never receive direct database access.
