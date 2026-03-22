import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
import type {
  ExecuteFlowRequest,
  ExecutePolicyRequest,
  ExecutionClientConfig,
  FlowExecutionResult,
  PolicyExecutionResult,
} from "./types.js";

export class ExecutionClient {
  private readonly transport: RestExecutionTransport;

  constructor(private readonly config: ExecutionClientConfig) {
    if (!config.apiKey.trim()) {
      throw new ConfigurationError("apiKey is required");
    }

    this.transport = new RestExecutionTransport(config, config.transport);
  }

  executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    return this.transport.executePolicy(request);
  }

  executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult> {
    return this.transport.executeFlow(request);
  }
}
