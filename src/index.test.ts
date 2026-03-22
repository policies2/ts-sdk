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
        expect(String(input)).toBe("https://api.policy2.net/run/policy_version/policy-123");
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
          kind: "rest",
          baseUrl: "https://api.policy2.net",
          fetch: fetchMock as typeof fetch,
        },
      });

      const response = await client.executePolicy({
        id: "policy-123",
        reference: "version",
        data: { user: { age: 25 } },
      });

      expect(response.kind).toBe("policy");
      expect(response.result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("uses the base policy path when requested", async () => {
      const fetchMock = mock(async (input: string | URL | Request) => {
        expect(String(input)).toBe("https://api.policy2.net/run/policy/base-123");
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
          kind: "rest",
          baseUrl: "https://api.policy2.net/",
          fetch: fetchMock as typeof fetch,
        },
      });

      await client.executePolicy({
        id: "base-123",
        reference: "base",
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
          kind: "rest",
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

    it("maps REST 401 to AuthenticationError", async () => {
      const fetchMock = mock(async () => new Response("bad api key", { status: 401 }));
      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          kind: "rest",
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
          kind: "rest",
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
          kind: "rest",
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
          kind: "rest",
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
          kind: "rest",
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

  describe("RPC", () => {
    it("sends base_id for RPC policy execution when requested", async () => {
      const metadataAdds: Array<[string, string]> = [];
      const runPolicy = mock(
        (
          request: { policyId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => {
          expect(request).toEqual({
            baseId: "base-123",
            data: { user: { age: 25 } },
          });
          expect(options.deadline).toBeInstanceOf(Date);
          callback(null, {
            result: true,
            trace: null,
            rule: [],
            data: { user: { age: 25 } },
            error: null,
            labels: null,
          });
        },
      );

      const runFlow = mock(
        (
          _request: { flowId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          _options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => callback(null, { result: true, nodeResponse: [] }),
      );

      mock.module("@grpc/grpc-js", () => ({
        Metadata: class {
          add(key: string, value: string) {
            metadataAdds.push([key, value]);
          }
        },
        credentials: {
          createInsecure: () => ({}),
          createSsl: () => ({}),
        },
        status: {
          UNAUTHENTICATED: 16,
          PERMISSION_DENIED: 7,
        },
        makeGenericClientConstructor: (_definition: unknown, serviceName: string) =>
          class {
            constructor(_address: string, _credentials: unknown) {}

            RunPolicy = serviceName === "PolicyService" ? runPolicy : undefined;
            RunFlow = serviceName === "FlowService" ? runFlow : undefined;
          },
      }));

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          kind: "rpc",
          address: "localhost:8081",
        },
      });

      const response = await client.executePolicy({
        id: "base-123",
        reference: "base",
        data: { user: { age: 25 } },
      });

      expect(response.kind).toBe("policy");
      expect(response.result).toBe(true);
      expect(metadataAdds).toContainEqual(["x-api-key", "pk_test"]);
    });

    it("sends flowId for RPC flow execution by default", async () => {
      const runPolicy = mock(
        (
          _request: { policyId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          _options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => callback(null, { result: true, trace: null, rule: [], data: {}, error: null, labels: null }),
      );
      const runFlow = mock(
        (
          request: { flowId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => {
          expect(request).toEqual({
            flowId: "flow-123",
            data: { user: { age: 25 } },
          });
          expect(options.deadline).toBeInstanceOf(Date);
          callback(null, { result: { approved: true }, nodeResponse: [] });
        },
      );

      mock.module("@grpc/grpc-js", () => ({
        Metadata: class {
          add(_key: string, _value: string) {}
        },
        credentials: {
          createInsecure: () => ({}),
          createSsl: () => ({}),
        },
        status: {
          UNAUTHENTICATED: 16,
          PERMISSION_DENIED: 7,
        },
        makeGenericClientConstructor: (_definition: unknown, serviceName: string) =>
          class {
            constructor(_address: string, _credentials: unknown) {}

            RunPolicy = serviceName === "PolicyService" ? runPolicy : undefined;
            RunFlow = serviceName === "FlowService" ? runFlow : undefined;
          },
      }));

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          kind: "rpc",
          address: "localhost:8081",
        },
      });

      const response = await client.executeFlow({
        id: "flow-123",
        data: { user: { age: 25 } },
      });

      expect(response.kind).toBe("flow");
      expect(response.nodeResponse).toEqual([]);
    });

    it("maps RPC unauthenticated errors to AuthenticationError", async () => {
      const runPolicy = mock(
        (
          _request: { policyId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          _options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => {
          const error = Object.assign(new Error("bad key"), { code: 16 });
          callback(error);
        },
      );

      mock.module("@grpc/grpc-js", () => ({
        Metadata: class {
          add(_key: string, _value: string) {}
        },
        credentials: {
          createInsecure: () => ({}),
          createSsl: () => ({}),
        },
        status: {
          UNAUTHENTICATED: 16,
          PERMISSION_DENIED: 7,
        },
        makeGenericClientConstructor: () =>
          class {
            constructor(_address: string, _credentials: unknown) {}

            RunPolicy = runPolicy;
          },
      }));

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          kind: "rpc",
          address: "localhost:8081",
        },
      });

      await expect(
        client.executePolicy({
          id: "policy-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("maps RPC permission denied errors to AuthorizationError", async () => {
      const runFlow = mock(
        (
          _request: { flowId?: string; baseId?: string; data: Record<string, unknown> },
          _metadata: { add: (key: string, value: string) => void },
          _options: { deadline?: Date },
          callback: (error: Error | null, response?: Record<string, unknown>) => void,
        ) => {
          const error = Object.assign(new Error("forbidden"), { code: 7 });
          callback(error);
        },
      );

      mock.module("@grpc/grpc-js", () => ({
        Metadata: class {
          add(_key: string, _value: string) {}
        },
        credentials: {
          createInsecure: () => ({}),
          createSsl: () => ({}),
        },
        status: {
          UNAUTHENTICATED: 16,
          PERMISSION_DENIED: 7,
        },
        makeGenericClientConstructor: (_definition: unknown, serviceName: string) =>
          class {
            constructor(_address: string, _credentials: unknown) {}

            RunPolicy =
              serviceName === "PolicyService"
                ? (
                    _request: { policyId?: string; baseId?: string; data: Record<string, unknown> },
                    _metadata: { add: (key: string, value: string) => void },
                    _options: { deadline?: Date },
                    callback: (error: Error | null, response?: Record<string, unknown>) => void,
                  ) => callback(null, { result: true, trace: null, rule: [], data: {}, error: null, labels: null })
                : undefined;
            RunFlow = serviceName === "FlowService" ? runFlow : undefined;
          },
      }));

      const client = new ExecutionClient({
        apiKey: "pk_test",
        transport: {
          kind: "rpc",
          address: "localhost:8081",
        },
      });

      await expect(
        client.executeFlow({
          id: "flow-123",
          data: { user: { age: 25 } },
        }),
      ).rejects.toBeInstanceOf(AuthorizationError);
    });
  });

  describe("configuration", () => {
    it("requires a non-empty apiKey", () => {
      expect(
        () =>
          new ExecutionClient({
            apiKey: "",
            transport: {
              kind: "rest",
              baseUrl: "https://api.policy2.net",
            },
          }),
      ).toThrow(ConfigurationError);
    });
  });
});
