import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
import { RpcExecutionTransport } from "./transports/rpc.js";
import type {
  ExecuteFlowRequest,
  ExecutePolicyRequest,
  ExecutionClientConfig,
  FlowExecutionResult,
  PolicyExecutionResult,
} from "./types.js";

type ExecutionTransport = RestExecutionTransport | RpcExecutionTransport;

export class ExecutionClient {
  private readonly transport: ExecutionTransport;

  constructor(private readonly config: ExecutionClientConfig) {
    if (!config.apiKey.trim()) {
      throw new ConfigurationError("apiKey is required");
    }

    if (config.transport.kind === "rest") {
      this.transport = new RestExecutionTransport(config, config.transport);
      return;
    }

    this.transport = new RpcExecutionTransport(config, config.transport);
  }

  executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    return this.transport.executePolicy(request);
  }

  executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult> {
    return this.transport.executeFlow(request);
  }
}
