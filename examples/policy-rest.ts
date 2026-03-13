import { ExecutionClient } from "../src/index.js";

const client = new ExecutionClient({
  apiKey: process.env.POLICY_API_KEY ?? "pk_live_example",
  transport: {
    kind: "rest",
    baseUrl: process.env.POLICY_API_URL ?? "https://api.policy2.net",
  },
});

const response = await client.executePolicy({
  id: "3b7d4b2a-9aa0-4b6d-a1b4-9dcf11ce12ab",
  reference: "base",
  data: {
    drivingTest: {
      person: {
        name: "Bob",
        dateOfBirth: "1990-01-01",
      },
      scores: {
        theory: {
          multipleChoice: 45,
          hazardPerception: 75,
        },
        practical: {
          major: false,
          minor: 13,
        },
      },
    },
  },
});

console.log("Policy result:", response.result);
console.log("Execution timing:", response.execution);
