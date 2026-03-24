import type { ExecuteFlowRequest, ExecutePolicyRequest, ExecutionClientConfig, FlowExecutionResult, PolicyExecutionResult, RestTransportConfig } from "../types.js";
type ResolvedRestTransportConfig = RestTransportConfig & {
    baseUrl: string;
};
export declare class RestExecutionTransport {
    private readonly config;
    readonly kind = "rest";
    private readonly fetchImpl;
    private readonly baseUrl;
    constructor(config: ExecutionClientConfig, transport: ResolvedRestTransportConfig);
    executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult>;
    executePolicyVersion(request: ExecutePolicyRequest): Promise<PolicyExecutionResult>;
    executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult>;
    private send;
}
export {};
