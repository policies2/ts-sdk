import type { ExecuteFlowRequest, ExecutePolicyRequest, ExecutionClientConfig, FlowExecutionResult, PolicyExecutionResult, RestTransportConfig } from "../types.js";
export declare class RestExecutionTransport {
    private readonly config;
    readonly kind = "rest";
    private readonly fetchImpl;
    private readonly baseUrl;
    constructor(config: ExecutionClientConfig, transport: RestTransportConfig);
    executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult>;
    executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult>;
    private send;
}
