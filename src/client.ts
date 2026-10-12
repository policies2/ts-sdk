import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
import type {
  ExecuteFlowRequest,
  ExecutePolicyRequest,
  ExecutionClientConfig,
  FlowExecutionResult,
  PolicyExecutionResult,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.policy2.net";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// The API key is sent on every request, so require https unless the host is
// loopback (local development).
export function validateBaseUrl(baseUrl: string): void {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new ConfigurationError(`invalid baseUrl: ${baseUrl}`);
  }
  if (url.protocol === "https:") return;
  if (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname)) return;
  if (url.protocol === "http:") {
    throw new ConfigurationError(
      `refusing plaintext http to ${baseUrl}: the api key would be sent unencrypted; use https (or a loopback address for local development)`,
    );
  }
  throw new ConfigurationError(`unsupported baseUrl protocol: ${url.protocol}`);
}

export class ExecutionClient {
  private readonly transport: RestExecutionTransport;

  constructor(private readonly config: ExecutionClientConfig) {
    if (!config.apiKey.trim()) {
      throw new ConfigurationError("apiKey is required");
    }

    const baseUrl = config.transport?.baseUrl ?? DEFAULT_BASE_URL;
    validateBaseUrl(baseUrl);

    const transport = {
      baseUrl,
      fetch: config.transport?.fetch,
    };

    this.transport = new RestExecutionTransport(config, transport);
  }

  executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    return this.transport.executePolicy(request);
  }

  executePolicyVersion(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    return this.transport.executePolicyVersion(request);
  }

  executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult> {
    return this.transport.executeFlow(request);
  }
}
