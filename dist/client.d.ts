import type { ExecuteFlowRequest, ExecutePolicyRequest, ExecutionClientConfig, FlowExecutionResult, PolicyExecutionResult } from "./types.js";
export declare class ExecutionClient {
    private readonly config;
    private readonly transport;
    constructor(config: ExecutionClientConfig);
    executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult>;
    executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult>;
}
