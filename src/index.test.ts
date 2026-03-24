import { afterEach, describe, expect, it, mock } from "bun:test";

import { ExecutionClient } from "./index.js";
import {
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  ServerError,
  TransportError,
} from "./errors.js";

describe("ExecutionClient", () => {
  afterEach(() => {
    mock.restore();
  });

  describe("REST", () => {
    it("executes a policy over REST with x-api-key auth", async () => {
      const fetchMock = mock(async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe("https://api.policy2.net/run/policy/policy-123");
        expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("pk_test");
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ data: { user: { age: 25 } } }));

        return new Response(
          JSON.stringify({
            result: true,
            trace: null,
            rule: ["rule"],
            data: { user: { age: 25 } },
            error: null,
            labels: null,
          }),
          { status: 200 },
        );
      });

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          fetch: fetchMock as typeof fetch,
        },
      });

      const response = await client.executePolicy({
        id: "policy-123",
        data: { user: { age: 25 } },
      });

      expect(response.kind).toBe("policy");
      expect(response.result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("executes a policy version over REST when requested explicitly", async () => {
      const fetchMock = mock(async (input: string | URL | Request) => {
        expect(String(input)).toBe("https://api.policy2.net/run/policy_version/version-123");
        return new Response(
          JSON.stringify({
            result: true,
            trace: null,
            rule: [],
            data: {},
            error: null,
            labels: null,
          }),
          { status: 200 },
        );
      });

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net/",
          fetch: fetchMock as typeof fetch,
        },
      });

      await client.executePolicyVersion({
        id: "version-123",
        data: {},
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("executes a flow over REST", async () => {
      const fetchMock = mock(async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe("https://api.policy2.net/run/flow/flow-123");
        expect(init?.body).toBe(JSON.stringify({ data: { user: { age: 25 } } }));

        return new Response(
          JSON.stringify({
            result: { approved: true },
            nodeResponse: [
              {
                nodeId: "node-1",
                nodeType: "policy",
                response: {
                  result: true,
                  trace: null,
                  rule: ["rule"],
                  data: { approved: true },
                  error: null,
                  labels: null,
                },
              },
            ],
          }),
          { status: 200 },
        );
      });

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      const response = await client.executeFlow({
        id: "flow-123",
        reference: "base",
        data: { user: { age: 25 } },
      });

      expect(response.kind).toBe("flow");
      expect(response.nodeResponse[0]?.nodeId).toBe("node-1");
    });

    it("uses the default base URL when one is not provided", async () => {
      const fetchMock = mock(async (input: string | URL | Request) => {
        expect(String(input)).toBe("https://api.policy2.net/run/policy/policy-123");
        return new Response(
          JSON.stringify({
            result: true,
            trace: null,
            rule: [],
            data: {},
            error: null,
            labels: null,
          }),
          { status: 200 },
        );
      });

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          fetch: fetchMock as typeof fetch,
        },
      });

      await client.executePolicy({
        id: "policy-123",
        data: {},
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("maps REST 401 to AuthenticationError", async () => {
      const fetchMock = mock(async () => new Response("bad api key", { status: 401 }));
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      await expect(
        client.executePolicy({
          id: "policy-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("maps REST 403 to AuthorizationError", async () => {
      const fetchMock = mock(async () => new Response("forbidden", { status: 403 }));
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      await expect(
        client.executeFlow({
          id: "flow-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("maps REST 500 to ServerError", async () => {
      const fetchMock = mock(async () => new Response("boom", { status: 500 }));
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      await expect(
        client.executePolicy({
          id: "policy-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(ServerError);
    });

    it("maps invalid JSON responses to TransportError", async () => {
      const fetchMock = mock(async () => new Response("{", { status: 200 }));
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      await expect(
        client.executePolicy({
          id: "policy-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(TransportError);
    });

    it("maps fetch failures to TransportError", async () => {
      const fetchMock = mock(async () => {
        throw new Error("network down");
      });
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      await expect(
        client.executePolicy({
          id: "policy-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(TransportError);
    });
  });

  describe("configuration", () => {
    it("requires a non-empty apiKey", () => {
      expect(
        () =>
          new ExecutionClient({
            apiKey: "",
          }),
      ).toThrow(ConfigurationError);
    });
  });
});
