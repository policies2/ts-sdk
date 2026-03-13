import { ExecutionClient } from "../src/index.js";

const client = new ExecutionClient({
  apiKey: process.env.POLICY_API_KEY ?? "pk_live_example",
  transport: {
    kind: "rpc",
    address: process.env.POLICY_RPC_ADDRESS ?? "127.0.0.1:8081",
    tls: false,
  },
});

const response = await client.executeFlow({
  id: "ae6fb044-ad2b-45fd-82d1-0d2f1fa176a5",
  reference: "base",
  data: {
    drivingTest: {
      person: {
        name: "Alice",
        dateOfBirth: "1992-05-12",
      },
      scores: {
        theory: {
          multipleChoice: 47,
          hazardPerception: 70,
        },
        practical: {
          major: false,
          minor: 6,
        },
      },
    },
  },
});

console.log("Flow result:", response.result);
console.log("Visited nodes:", response.nodeResponse.map((node) => node.nodeId));
