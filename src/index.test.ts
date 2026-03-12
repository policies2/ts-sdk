import { afterEach, describe, expect, it, mock } from "bun:test";

import { ExecutionClient } from "./index.js";
import { AuthenticationError } from "./errors.js";

describe("ExecutionClient", () => {
  afterEach(() => {
    mock.restore();
  });

  it("executes a policy over REST with x-api-key auth", async () => {
    const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
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

  it("sends base_id for RPC policy execution when requested", async () => {
    const metadataAdds: Array<[string, string]> = [];
    const runPolicy = mock(
      (
        request: { policy_id?: string; base_id?: string; data: Record<string, unknown> },
        metadata: { add: (key: string, value: string) => void },
        callback: (error: Error | null, response?: Record<string, unknown>) => void,
      ) => {
        metadata.add = (key, value) => {
          metadataAdds.push([key, value]);
        };
        expect(request).toEqual({
          base_id: "base-123",
          data: { user: { age: 25 } },
        });
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
        _request: { flow_id?: string; base_id?: string; data: Record<string, unknown> },
        _metadata: { add: (key: string, value: string) => void },
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
      loadPackageDefinition: () => ({
        policy: {
          v1: {
            PolicyService: class {
              RunPolicy = runPolicy;
            },
            FlowService: class {
              RunFlow = runFlow;
            },
          },
        },
      }),
    }));

    mock.module("@grpc/proto-loader", () => ({
      load: async () => ({}),
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
});
