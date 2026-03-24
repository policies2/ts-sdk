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

export class ExecutionClient {
  private readonly transport: RestExecutionTransport;

  constructor(private readonly config: ExecutionClientConfig) {
    if (!config.apiKey.trim()) {
      throw new ConfigurationError("apiKey is required");
    }

    const transport = {
      baseUrl: config.transport?.baseUrl ?? DEFAULT_BASE_URL,
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
