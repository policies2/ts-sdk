# `@policies2/sdk`

Execute stored policies and flows over REST using API keys only.

This SDK is intentionally narrow:

- execute policies
- execute flows
- use the REST transport
- authenticate with `x-api-key`

It does not support creating, updating, publishing, or administering resources.

## Install

```bash
npm install @policies2/sdk
```

## REST

```ts
import { ExecutionClient } from "@policies2/sdk";

const client = new ExecutionClient({
  apiKey: process.env.POLICY_API_KEY!,
  transport: {
    baseUrl: "https://api.policy2.net",
  },
});

const result = await client.executePolicy({
  id: "3b7d4b2a-9aa0-4b6d-a1b4-9dcf11ce12ab",
  reference: "base",
  data: {
    user: {
      age: 25,
    },
  },
});

console.log(result.result);
```

## API

### `new ExecutionClient(config)`

Creates an execute-only client.

### `client.executePolicy(request)`

Executes a stored policy and returns a `PolicyExecutionResult`.

### `client.executeFlow(request)`

Executes a stored flow and returns a `FlowExecutionResult`.

## Examples

- REST policy execution: [`examples/policy-rest.ts`](./examples/policy-rest.ts)
- REST flow execution: [`examples/flow-rest.ts`](./examples/flow-rest.ts)

You can run an example with Bun from the package root:

```bash
bun examples/policy-rest.ts
```

## Notes

- API key auth is the only auth model exposed by this SDK.
- REST supports base IDs and exact version IDs.
