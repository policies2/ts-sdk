import {
  AuthenticationError,
  AuthorizationError,
  ServerError,
  TransportError,
} from "../errors.js";
import type {
  ExecuteFlowRequest,
  ExecutePolicyRequest,
  ExecutionClientConfig,
  FlowExecutionResult,
  JsonObject,
  PolicyExecutionResult,
  RestTransportConfig,
} from "../types.js";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function policyPath(request: ExecutePolicyRequest): string {
  const reference = request.reference ?? "version";
  return reference === "base"
    ? `/run/policy/${request.id}`
    : `/run/policy_version/${request.id}`;
}

function flowPath(request: ExecuteFlowRequest): string {
  const reference = request.reference ?? "version";
  return reference === "base"
    ? `/run/flow/${request.id}`
    : `/run/flow_version/${request.id}`;
}

function encodeBody(data: JsonObject): string {
  return JSON.stringify({ data });
}

function mapStatus(status: number, bodyText: string): never {
  if (status === 401) {
    throw new AuthenticationError(bodyText || "request rejected: invalid API key");
  }

  if (status === 403) {
    throw new AuthorizationError(bodyText || "request rejected: insufficient permissions");
  }

  throw new ServerError(bodyText || `request failed with status ${status}`, {
    status,
  });
}

export class RestExecutionTransport {
  readonly kind = "rest";
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ExecutionClientConfig,
    transport: RestTransportConfig,
  ) {
    this.baseUrl = trimTrailingSlash(transport.baseUrl);
    this.fetchImpl = transport.fetch ?? fetch;
  }

  async executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    return this.send<PolicyExecutionResult>(policyPath(request), encodeBody(request.data), "policy");
  }

  async executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult> {
    return this.send<FlowExecutionResult>(flowPath(request), encodeBody(request.data), "flow");
  }

  private async send<T>(path: string, body: string, kind: "policy" | "flow"): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.config.apiKey,
          ...(this.config.userAgent ? { "user-agent": this.config.userAgent } : {}),
        },
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      if (!response.ok) {
        mapStatus(response.status, text);
      }

      const parsed = JSON.parse(text) as T;
      return {
        ...(parsed as object),
        kind,
      } as T;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError ||
        error instanceof ServerError
      ) {
        throw error;
      }

      throw new TransportError("REST execution request failed", { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}
